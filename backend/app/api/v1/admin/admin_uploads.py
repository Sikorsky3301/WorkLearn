"""
Image uploads for the Simulation CMS — company logos and manager photos.
Saved to a locally-served static directory and returned as a URL the rest of
the CMS (Simulation.logo_url, manager.photo_url) just treats as an opaque
string, same as any other image URL. Gated by simulations.edit since it's
only ever called from within the sim/Sim Builder editors.
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.core.permissions import require_cms_access
from app.core.paths import UPLOAD_DIR

router = APIRouter(prefix="/api/admin/uploads", tags=["admin-uploads"])

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5MB


@router.post("/image")
async def upload_image(file: UploadFile = File(...), _=Depends(require_cms_access())):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported image type '{ext}' — use one of {sorted(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "Image is too large (max 5MB)")

    filename = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / filename).write_bytes(content)
    return {"url": f"/static/uploads/{filename}"}
