"""
Canonical filesystem paths, defined once.

These used to be recomputed independently in each module that needed them
(`Path(__file__).resolve().parent.parent / "static"` in main.py, a
`.parent.parent.parent` variant in the upload routes). That worked only as
long as every one of those files sat at exactly the directory depth its own
hardcoded parent-count assumed — so moving the route modules one level
deeper (app/routes/ -> app/routes/v1/) silently pointed the upload dir at
`app/static/` while main.py still served `backend/static/`. Uploads then
"succeeded" and returned a URL that 404s, with nothing in the logs.

Deriving everything from this module's own location instead means a file
that moves can't drift: importers get the same path regardless of where
they live.
"""
from pathlib import Path

# backend/ — two levels up from backend/app/core/<this file>.
BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Served at /static by main.py's StaticFiles mount. Anything written outside
# this tree is not reachable over HTTP.
STATIC_DIR = BACKEND_ROOT / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"

PHOTO_DIR = UPLOAD_DIR / "profile_photos"
RESUME_DIR = UPLOAD_DIR / "resumes"
