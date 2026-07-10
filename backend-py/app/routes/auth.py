from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, UnlockedFeature, Role, SuperAdminCredential, UserBadge
from app.auth import verify_password, hash_password, create_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginDirectBody(BaseModel):
    email: str
    password: str

class LoginUniversityBody(BaseModel):
    roll_no: str
    password: str

class LoginMentorBody(BaseModel):
    mentor_id: str
    password: str

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

def _safe_user(user: User) -> dict:
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "roll_no": user.roll_no, "role": user.role,
        "institution": user.institution, "department": user.department,
        "section": user.section, "year": user.year, "avatar": user.avatar,
        "xp": user.xp, "target_role": user.target_role,
    }

async def _touch(db: AsyncSession, user_id: str):
    await db.execute(update(User).where(User.id == user_id).values(last_seen_at=datetime.now(timezone.utc)))
    await db.commit()

@router.post("/register")
async def register(body: RegisterBody, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "An account with this email already exists.")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    user = User(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        role=Role.DIRECT_USER,
        avatar=body.name.strip()[:2].upper(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"token": create_token(user.id, user.role), "user": _safe_user(user)}

@router.post("/login/direct")
async def login_direct(body: LoginDirectBody, db: AsyncSession = Depends(get_db)):
    email = body.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or user.role != Role.DIRECT_USER:
        raise HTTPException(401, "Invalid email or password.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    await _touch(db, user.id)
    return {"token": create_token(user.id, user.role), "user": _safe_user(user)}

@router.post("/login/superadmin")
async def login_superadmin(body: LoginDirectBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SuperAdminCredential).where(SuperAdminCredential.email == body.email.lower().strip()))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    admin.last_seen_at = datetime.now(timezone.utc)
    await db.commit()
    return {
        "token": create_token(admin.id, "SUPER_ADMIN", sa=True),
        "user": {"id": admin.id, "name": admin.name, "email": admin.email, "role": "SUPER_ADMIN", "xp": 0},
    }

@router.post("/login/university")
async def login_university(body: LoginUniversityBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.roll_no == body.roll_no))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Invalid Roll Number or password.")
    if user.role == Role.CLASS_MENTOR:
        raise HTTPException(403, "Mentors must log in at the Mentor Login page.")
    if user.role != Role.UNIVERSITY_STUDENT:
        raise HTTPException(401, "Invalid Roll Number or password.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid Roll Number or password.")
    await _touch(db, user.id)
    unlocked = await db.execute(select(UnlockedFeature).where(UnlockedFeature.user_id == user.id))
    features = [f.feature for f in unlocked.scalars().all()]
    return {"token": create_token(user.id, user.role), "user": {**_safe_user(user), "unlocked_features": features}}

@router.post("/login/mentor")
async def login_mentor(body: LoginMentorBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.roll_no == body.mentor_id))
    user = result.scalar_one_or_none()
    if not user or user.role != Role.CLASS_MENTOR:
        raise HTTPException(401, "This portal is for mentors only.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid Mentor ID or password.")
    await _touch(db, user.id)
    return {"token": create_token(user.id, user.role), "user": _safe_user(user)}

@router.get("/me")
async def me(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    if token.get("sa"):
        result = await db.execute(select(SuperAdminCredential).where(SuperAdminCredential.id == token["sub"]))
        admin = result.scalar_one_or_none()
        if not admin:
            raise HTTPException(404, "Admin not found")
        admin.last_seen_at = datetime.now(timezone.utc)
        await db.commit()
        return {"id": admin.id, "name": admin.name, "email": admin.email, "role": "SUPER_ADMIN", "xp": 0}
    result = await db.execute(select(User).where(User.id == token["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await _touch(db, user.id)
    unlocked = await db.execute(select(UnlockedFeature).where(UnlockedFeature.user_id == user.id))
    features = [f.feature for f in unlocked.scalars().all()]
    badges_res = await db.execute(select(UserBadge).where(UserBadge.user_id == user.id))
    badges = [_badge_dict(b) for b in badges_res.scalars().all()]
    return {**_safe_user(user), "unlocked_features": features, "badges": badges}


def _badge_dict(b: UserBadge) -> dict:
    return {
        "id": b.id, "badge_key": b.badge_key, "label": b.label, "icon": b.icon,
        "simulation_id": b.simulation_id, "granted_at": b.granted_at.isoformat(),
    }
