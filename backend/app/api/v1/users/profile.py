"""
Self-service portfolio profile — contact info, bio, education history, resume,
and profile photo. Every route here acts only on the calling user's own row
(token["sub"]), there is no "edit someone else's profile" path — that's what
admin_management.py is for. Photo/resume uploads reuse the same local static
directory convention as admin_uploads.py, just in their own subfolders and
with extensions appropriate to each (images vs. document files).
"""
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.auth import get_current_user, token_user_id
from app.core.paths import UPLOAD_DIR, PHOTO_DIR, RESUME_DIR
from app.models import User
from app.models.profile import EducationEntry
from app.schemas.profile import ProfileUpdateBody, EducationIn, EducationOut

router = APIRouter(prefix="/api/users/me", tags=["profile"])

PHOTO_DIR.mkdir(parents=True, exist_ok=True)
RESUME_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_PHOTO_EXT = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_RESUME_EXT = {".pdf", ".doc", ".docx"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024   # 5MB
MAX_RESUME_BYTES = 10 * 1024 * 1024  # 10MB


async def _get_user(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("/profile")
async def update_profile(
    body: ProfileUpdateBody, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    user = await _get_user(db, token_user_id(token))
    # exclude_unset: every ProfileUpdateBody field defaults to None, so a
    # plain model_dump() turns "field not sent" into an explicit NULL write.
    # That made this a destructive full-document overwrite — e.g. the
    # Portfolio's edit form omits preferred_domain, so saving it wiped the
    # domain chosen during onboarding.
    for field, value in body.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            # Store a genuinely-unset optional field as NULL rather than "",
            # so the UI can tell "skipped" apart from "answered with blank".
            value = value.strip() or None
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return {"ok": True}


@router.post("/complete-onboarding")
async def complete_onboarding(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    from app.services.simulation_scope import assign_onboarding_simulations

    user = await _get_user(db, token_user_id(token))
    user.onboarding_completed = True
    assigned = await assign_onboarding_simulations(db, user)
    await db.commit()
    return {"ok": True, "assigned_simulation_ids": assigned}


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_PHOTO_EXT:
        raise HTTPException(400, f"Unsupported image type '{ext}' — use one of {sorted(ALLOWED_PHOTO_EXT)}")
    content = await file.read()
    if len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(400, "Image is too large (max 5MB)")

    user = await _get_user(db, token_user_id(token))
    filename = f"{uuid.uuid4().hex}{ext}"
    (PHOTO_DIR / filename).write_bytes(content)
    old_url = user.photo_url
    user.photo_url = f"/static/uploads/profile_photos/{filename}"
    await db.commit()

    # Best-effort cleanup of the previous photo file — never block on it.
    if old_url and old_url.startswith("/static/uploads/profile_photos/"):
        old_path = UPLOAD_DIR / "profile_photos" / Path(old_url).name
        old_path.unlink(missing_ok=True)

    return {"photo_url": user.photo_url}


@router.delete("/photo")
async def delete_photo(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user = await _get_user(db, token_user_id(token))
    old_url = user.photo_url
    user.photo_url = None
    await db.commit()
    if old_url and old_url.startswith("/static/uploads/profile_photos/"):
        (UPLOAD_DIR / "profile_photos" / Path(old_url).name).unlink(missing_ok=True)
    return {"ok": True}


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_RESUME_EXT:
        raise HTTPException(400, f"Unsupported file type '{ext}' — use one of {sorted(ALLOWED_RESUME_EXT)}")
    content = await file.read()
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(400, "File is too large (max 10MB)")

    user = await _get_user(db, token_user_id(token))
    filename = f"{uuid.uuid4().hex}{ext}"
    (RESUME_DIR / filename).write_bytes(content)
    old_url = user.resume_url
    user.resume_url = f"/static/uploads/resumes/{filename}"
    user.resume_filename = file.filename
    user.resume_uploaded_at = datetime.now(timezone.utc)
    await db.commit()

    if old_url and old_url.startswith("/static/uploads/resumes/"):
        (UPLOAD_DIR / "resumes" / Path(old_url).name).unlink(missing_ok=True)

    return {"resume_url": user.resume_url, "resume_filename": user.resume_filename}


@router.delete("/resume")
async def delete_resume(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user = await _get_user(db, token_user_id(token))
    old_url = user.resume_url
    user.resume_url = None
    user.resume_filename = None
    user.resume_uploaded_at = None
    await db.commit()
    if old_url and old_url.startswith("/static/uploads/resumes/"):
        (UPLOAD_DIR / "resumes" / Path(old_url).name).unlink(missing_ok=True)
    return {"ok": True}


@router.get("/education", response_model=list[EducationOut])
async def list_education(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(
        select(EducationEntry).where(EducationEntry.user_id == user_id)
        .order_by(EducationEntry.sort_order, EducationEntry.start_year.desc())
    )
    return result.scalars().all()


@router.post("/education", response_model=EducationOut)
async def add_education(
    body: EducationIn, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    user_id = token_user_id(token)
    count_result = await db.execute(select(EducationEntry).where(EducationEntry.user_id == user_id))
    sort_order = len(count_result.scalars().all())
    entry = EducationEntry(user_id=user_id, sort_order=sort_order, **body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/education/{entry_id}", response_model=EducationOut)
async def update_education(
    entry_id: int, body: EducationIn, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    user_id = token_user_id(token)
    result = await db.execute(
        select(EducationEntry).where(EducationEntry.id == entry_id, EducationEntry.user_id == user_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Education entry not found")
    for field, value in body.model_dump().items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/education/{entry_id}")
async def delete_education(
    entry_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    user_id = token_user_id(token)
    result = await db.execute(
        delete(EducationEntry).where(EducationEntry.id == entry_id, EducationEntry.user_id == user_id)
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Education entry not found")
    await db.commit()
    return {"ok": True}
