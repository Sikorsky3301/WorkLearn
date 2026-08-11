"""Provision students / teachers / university admins into the users table."""
import io
from typing import Any

import pandas as pd
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models import User
from app.models.roles import RoleSlug, ROLE_IDS
from app.models.university import University, DEFAULT_UNIVERSITY_CODE
from app.core.auth import hash_password, token_user_id
from app.core.permissions import require_roles
from app.services.audit import log_action, resolve_actor_info

router = APIRouter(prefix="/api/admin/provision", tags=["provisioning"])

PROVISIONABLE = {
    "student": RoleSlug.STUDENT,
    "teacher": RoleSlug.TEACHER,
    "university_admin": RoleSlug.UNIVERSITY_ADMIN,
}

FORBIDDEN_BULK_ROLES = {RoleSlug.SUPER_ADMIN, RoleSlug.ADMIN}
MAX_BULK_ROWS = 500
REQUIRED_COLUMNS = {"name", "email", "password", "role"}

UNI_ADMIN_TEMPLATE_HEADERS = ["name", "email", "password", "role", "roll_no", "department", "section", "year"]
PLATFORM_ADMIN_TEMPLATE_HEADERS = [
    "name", "email", "password", "role", "university_code", "roll_no", "department", "section", "year",
]

UNI_ADMIN_SAMPLE_ROWS = [
    ["Sample Student", "sample.student@university.edu", "password", "student", "BULK001", "CSE", "A", "2026"],
    ["Sample Teacher", "sample.teacher@university.edu", "password", "teacher", "", "CSE", "", ""],
]

PLATFORM_ADMIN_SAMPLE_ROWS = [
    ["Sample Student", "sample.student@university.edu", "password", "student", "iitd", "BULK001", "CSE", "A", "2026"],
    ["Sample Teacher", "sample.teacher@university.edu", "password", "teacher", "iitd", "", "CSE", "", ""],
    ["Sample Uni Admin", "sample.uniadmin@university.edu", "password", "university_admin", "iitd", "", "", "", ""],
]


class ProvisionUserBody(BaseModel):
    name: str
    role: str = Field(description="student | teacher | university_admin")
    email: EmailStr
    roll_no: str | None = None
    password: str = Field(min_length=6)
    university_id: int | None = None
    department: str | None = None
    section: str | None = None
    year: str | None = None


async def _actor(db: AsyncSession, token: dict) -> User:
    uid = token_user_id(token)
    result = await db.execute(
        select(User).where(User.id == uid).options(selectinload(User.role_row), selectinload(User.university))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Actor not found")
    return user


def _allowed_roles_for_actor(actor: User) -> set[str]:
    if actor.role == RoleSlug.UNIVERSITY_ADMIN:
        return {RoleSlug.STUDENT, RoleSlug.TEACHER}
    return {RoleSlug.STUDENT, RoleSlug.TEACHER, RoleSlug.UNIVERSITY_ADMIN}


async def _resolve_university_id(
    db: AsyncSession,
    actor: User,
    university_id: int | None,
) -> int:
    if actor.role == RoleSlug.UNIVERSITY_ADMIN:
        if not actor.university_id:
            raise HTTPException(400, "University admin has no university assigned")
        return actor.university_id
    if university_id is None:
        raise HTTPException(400, "university_id is required")
    uni = await db.execute(select(University).where(University.id == university_id))
    if not uni.scalar_one_or_none():
        raise HTTPException(400, "Unknown university_id")
    return university_id


async def _provision_one(
    db: AsyncSession,
    *,
    actor: User,
    university_id: int,
    name: str,
    email: str,
    password: str,
    role: str,
    roll_no: str | None = None,
    department: str | None = None,
    section: str | None = None,
    year: str | None = None,
    seen_emails: set[str] | None = None,
    seen_roll_nos: set[str] | None = None,
    audit: bool = True,
    token: dict | None = None,
) -> dict[str, Any]:
    """Create one user or raise ValueError with a user-facing message."""
    role_key = (role or "").strip().lower()
    if role_key in FORBIDDEN_BULK_ROLES or role_key in ("super_admin", "admin"):
        raise ValueError(f"role '{role_key}' cannot be provisioned via this API")

    slug = PROVISIONABLE.get(role_key)
    if not slug:
        raise ValueError("role must be student, teacher, or university_admin")

    allowed = _allowed_roles_for_actor(actor)
    if slug not in allowed:
        if actor.role == RoleSlug.UNIVERSITY_ADMIN:
            raise ValueError("University Admin may only provision students and teachers")
        raise ValueError(f"role '{role_key}' is not allowed for your account")

    name = (name or "").strip()
    if not name:
        raise ValueError("name is required")

    email_norm = (email or "").strip().lower()
    if not email_norm or "@" not in email_norm:
        raise ValueError("valid email is required")

    password = password or ""
    if len(password) < 6:
        raise ValueError("password must be at least 6 characters")

    roll = (roll_no or "").strip() or None
    if slug == RoleSlug.STUDENT and not roll:
        raise ValueError("student needs roll_no")

    if seen_emails is not None:
        if email_norm in seen_emails:
            raise ValueError("duplicate email in this upload")
        seen_emails.add(email_norm)
    if roll and seen_roll_nos is not None:
        if roll in seen_roll_nos:
            raise ValueError("duplicate roll_no in this upload")
        seen_roll_nos.add(roll)

    existing = await db.execute(select(User).where(User.email == email_norm))
    if existing.scalar_one_or_none():
        raise ValueError("Email already in use")
    if roll:
        existing = await db.execute(select(User).where(User.roll_no == roll))
        if existing.scalar_one_or_none():
            raise ValueError("Roll number already in use")

    dept = (department or "").strip() or None
    sect = (section or "").strip() or None
    yr = (year or "").strip() or None

    user = User(
        name=name,
        email=email_norm,
        roll_no=roll,
        password_hash=hash_password(password),
        role_id=ROLE_IDS[slug],
        university_id=university_id,
        department=dept,
        section=sect,
        year=yr,
        avatar=name[:2].upper(),
    )
    db.add(user)
    await db.flush()

    if audit and token is not None:
        actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
        await log_action(
            db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
            action="user.provision", target_type="user", target_id=str(user.id),
            meta={"role": slug, "university_id": university_id},
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "roll_no": user.roll_no,
        "role": slug,
        "university_id": university_id,
    }


@router.post("/users")
async def provision_user(
    body: ProvisionUserBody,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN)),
):
    """
    Platform Admin: provision student | teacher | university_admin into a chosen partner uni.
    University Admin: provision student | teacher only into own org (university_id forced).
    Super Admin is intentionally excluded from this endpoint.
    """
    actor = await _actor(db, token)
    try:
        university_id = await _resolve_university_id(db, actor, body.university_id)
        result = await _provision_one(
            db,
            actor=actor,
            university_id=university_id,
            name=body.name,
            email=str(body.email),
            password=body.password,
            role=body.role,
            roll_no=body.roll_no,
            department=body.department,
            section=body.section,
            year=body.year,
            audit=True,
            token=token,
        )
    except ValueError as e:
        status = 403 if "may only" in str(e) or "cannot create" in str(e) or "not allowed" in str(e) else 400
        raise HTTPException(status, str(e)) from e

    await db.commit()
    return result


def _cell(val) -> str:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ""
    return str(val).strip()


def _parse_bulk_dataframe(df: pd.DataFrame, *, require_university_code: bool) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]
    required = set(REQUIRED_COLUMNS)
    if require_university_code:
        required.add("university_code")
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(400, f"Missing required columns: {', '.join(sorted(missing))}")
    subset = [c for c in df.columns if c in required or c in {
        "roll_no", "department", "section", "year", "university_code",
    }]
    df = df.dropna(how="all", subset=subset)
    if len(df) == 0:
        raise HTTPException(400, "File has no data rows")
    if len(df) > MAX_BULK_ROWS:
        raise HTTPException(400, f"Too many rows (max {MAX_BULK_ROWS})")
    return df


async def _lookup_partner_university_by_code(db: AsyncSession, code: str) -> University:
    """Resolve partner university by code; reject missing / default academy."""
    norm = (code or "").strip().lower()
    if not norm:
        raise ValueError("university_code is required")
    if norm == DEFAULT_UNIVERSITY_CODE.lower():
        raise ValueError("cannot bulk-provision into the default academy university")
    result = await db.execute(
        select(University).where(func.lower(University.code) == norm)
    )
    uni = result.scalar_one_or_none()
    if not uni:
        raise ValueError(f"unknown university_code '{norm}'")
    if uni.is_default:
        raise ValueError("cannot bulk-provision into the default academy university")
    return uni


@router.post("/users/bulk")
async def provision_users_bulk(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN)),
):
    """Bulk provision from .xlsx or .csv. Partial success — bad rows reported, good rows created.

    Platform Admin: each row requires university_code (partner org).
    University Admin: always actor's org; university_code must be empty or match own code.
    """
    actor = await _actor(db, token)
    is_uni_admin = actor.role == RoleSlug.UNIVERSITY_ADMIN

    if is_uni_admin and not actor.university_id:
        raise HTTPException(400, "University admin has no university assigned")

    actor_uni_code = None
    if is_uni_admin and actor.university:
        actor_uni_code = (actor.university.code or "").strip().lower()

    filename = (file.filename or "").lower()
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(raw))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(raw), engine="openpyxl")
        else:
            raise HTTPException(400, "File must be .xlsx or .csv")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {e}") from e

    df = _parse_bulk_dataframe(df, require_university_code=not is_uni_admin)

    created: list[dict] = []
    errors: list[dict] = []
    seen_emails: set[str] = set()
    seen_roll_nos: set[str] = set()
    codes_used: set[str] = set()
    uni_cache: dict[str, University] = {}

    for i, (_, row) in enumerate(df.iterrows()):
        excel_row = i + 2  # header is row 1
        email = _cell(row.get("email"))
        try:
            row_code = _cell(row.get("university_code")).lower() if "university_code" in df.columns else ""

            if is_uni_admin:
                if row_code and actor_uni_code and row_code != actor_uni_code:
                    raise ValueError(
                        f"university_code '{row_code}' does not match your university "
                        f"('{actor_uni_code}'); University Admin cannot provision into another org"
                    )
                university_id = actor.university_id
                resolved_code = actor_uni_code
            else:
                if row_code in uni_cache:
                    uni = uni_cache[row_code]
                else:
                    uni = await _lookup_partner_university_by_code(db, row_code)
                    uni_cache[row_code] = uni
                university_id = uni.id
                resolved_code = (uni.code or "").lower()
                codes_used.add(resolved_code)

            out = await _provision_one(
                db,
                actor=actor,
                university_id=university_id,
                name=_cell(row.get("name")),
                email=email,
                password=_cell(row.get("password")),
                role=_cell(row.get("role")),
                roll_no=_cell(row.get("roll_no")) or None,
                department=_cell(row.get("department")) or None,
                section=_cell(row.get("section")) or None,
                year=_cell(row.get("year")) or None,
                seen_emails=seen_emails,
                seen_roll_nos=seen_roll_nos,
                audit=False,
                token=None,
            )
            created.append({**out, "row": excel_row, "university_code": resolved_code})
        except ValueError as e:
            errors.append({"row": excel_row, "email": email or None, "error": str(e)})

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="user.provision.bulk", target_type="university",
        target_id=str(actor.university_id) if is_uni_admin else ",".join(sorted(codes_used)) or None,
        meta={
            "created": len(created),
            "failed": len(errors),
            "total": len(created) + len(errors),
            "filename": file.filename,
            "university_codes": sorted(codes_used) if not is_uni_admin else ([actor_uni_code] if actor_uni_code else []),
        },
    )
    await db.commit()

    return {
        "created": [
            {
                "id": c["id"],
                "email": c["email"],
                "role": c["role"],
                "row": c["row"],
                "university_id": c["university_id"],
                "university_code": c.get("university_code"),
            }
            for c in created
        ],
        "errors": errors,
        "summary": {
            "total": len(created) + len(errors),
            "created": len(created),
            "failed": len(errors),
        },
    }


def _build_template_xlsx(rows: list[list[str]], headers: list[str], filename: str) -> StreamingResponse:
    df = pd.DataFrame(rows, columns=headers)
    buf = io.BytesIO()
    df.to_excel(buf, index=False, engine="openpyxl")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    )


@router.get("/users/bulk/template")
async def download_bulk_template(
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN)),
):
    """Role-branched Excel template with sample import rows (no client variant spoofing)."""
    actor = await _actor(db, token)
    if actor.role == RoleSlug.UNIVERSITY_ADMIN:
        return _build_template_xlsx(
            UNI_ADMIN_SAMPLE_ROWS,
            UNI_ADMIN_TEMPLATE_HEADERS,
            "worklearn_uni_admin_bulk_template.xlsx",
        )
    return _build_template_xlsx(
        PLATFORM_ADMIN_SAMPLE_ROWS,
        PLATFORM_ADMIN_TEMPLATE_HEADERS,
        "worklearn_admin_bulk_template.xlsx",
    )