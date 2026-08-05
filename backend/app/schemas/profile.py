from datetime import datetime
from pydantic import BaseModel


class ProfileUpdateBody(BaseModel):
    headline: str | None = None
    bio: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    website_url: str | None = None
    preferred_domain: str | None = None


class EducationIn(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    is_current: bool = False
    description: str | None = None


class EducationOut(BaseModel):
    # int, matching EducationEntry.id (app/models/profile.py). Declaring this
    # `str` made every education response fail validation *after* the row was
    # already committed — Pydantic v2 won't coerce int -> str in lax mode — so
    # POST /education 500'd while still writing the row, which aborted the
    # onboarding wizard before it could mark itself complete.
    id: int
    institution: str
    degree: str | None
    field_of_study: str | None
    start_year: int | None
    end_year: int | None
    is_current: bool
    description: str | None
    sort_order: int

    model_config = {"from_attributes": True}
