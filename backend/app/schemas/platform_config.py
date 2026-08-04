from datetime import datetime
from pydantic import BaseModel


class ConfigEntryOut(BaseModel):
    category: str
    key: str
    label: str
    description: str
    is_secret: bool
    # Secret values are never round-tripped to the client once set — only
    # whether one is stored. Non-secret values are returned as-is.
    value: str | None
    value_set: bool
    updated_at: datetime | None
    updated_by: int | None


class SetConfigBody(BaseModel):
    value: str
