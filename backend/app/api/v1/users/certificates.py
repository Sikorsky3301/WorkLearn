"""
Read-only certificate endpoints. Certificates are never created here —
issuance is automatic on simulation completion (see
app/services/certificates.py), so there is deliberately no POST: a
credential a student could mint for themselves would be worthless.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.auth import get_current_user, token_user_id
from app.models.certificate import Certificate
from app.services.certificates import certificate_dict

router = APIRouter(prefix="/api", tags=["certificates"])


@router.get("/users/me/certificates")
async def my_certificates(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(
        select(Certificate)
        .where(Certificate.user_id == user_id)
        .order_by(Certificate.issued_at.desc())
    )
    return {"certificates": [certificate_dict(c) for c in result.scalars().all()]}


@router.get("/certificates/{certificate_number}")
async def verify_certificate(certificate_number: str, db: AsyncSession = Depends(get_db)):
    """Public verification lookup by certificate number — unauthenticated on
    purpose, since the whole point of the number is that someone outside the
    platform (a recruiter) can check it. Returns only what's printed on the
    certificate face; no user id, email, or other account data.
    """
    result = await db.execute(
        select(Certificate).where(Certificate.certificate_number == certificate_number.upper())
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(404, "No certificate found with that number")
    return {
        "valid": True,
        "certificate_number": cert.certificate_number,
        "recipient_name": cert.recipient_name,
        "simulation_title": cert.simulation_title,
        "company": cert.company,
        "issued_at": cert.issued_at.isoformat(),
    }
