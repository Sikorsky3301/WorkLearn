"""Schemas for partner university onboard / update."""
import re
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.university import DEFAULT_UNIVERSITY_CODE
from app.services.tenant import RESERVED_SUBDOMAINS

_CODE_RE = re.compile(r"^[a-z0-9]+$")


def normalize_university_code(raw: str) -> str:
    code = (raw or "").strip().lower()
    if not code:
        raise ValueError("code is required")
    if not _CODE_RE.match(code):
        raise ValueError("code must be lowercase alphanumeric (subdomain label)")
    if code == DEFAULT_UNIVERSITY_CODE.lower() or code in RESERVED_SUBDOMAINS:
        raise ValueError(f"code '{code}' is reserved")
    return code


class UniversityAdminSeed(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)


class UniversityOnboardBody(BaseModel):
    name: str = Field(min_length=1)
    code: str
    admin: UniversityAdminSeed

    @field_validator("code")
    @classmethod
    def _code(cls, v: str) -> str:
        return normalize_university_code(v)

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        name = (v or "").strip()
        if not name:
            raise ValueError("name is required")
        return name


class UniversityUpdateBody(BaseModel):
    name: str = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        name = (v or "").strip()
        if not name:
            raise ValueError("name is required")
        return name


class UniversityOut(BaseModel):
    id: int
    code: str
    name: str
    students: int = 0
    mentors: int = 0
    status: str = "active"
    is_default: bool = False
