from fastapi import Depends, HTTPException
from app.auth import get_current_user

def require_superadmin(token: dict = Depends(get_current_user)) -> dict:
    if token.get("role") != "SUPER_ADMIN":
        raise HTTPException(403, "Superadmin access required")
    return token
