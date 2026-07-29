from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(
    user_id: str, role: str, sa: bool = False,
    permissions: list[str] | None = None, expire_hours: int | None = None,
) -> str:
    if expire_hours is not None:
        expire = datetime.now(timezone.utc) + timedelta(hours=expire_hours)
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    payload = {"sub": user_id, "role": role, "exp": expire}
    if sa:
        payload["sa"] = True
    # Frontend-nav hint only — the backend never trusts this claim, it
    # re-checks permissions against the database on every request (see
    # app/dependencies.py::require_permission).
    if permissions is not None:
        payload["permissions"] = permissions
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    return decode_token(credentials.credentials)
