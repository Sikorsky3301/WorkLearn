"""Lists available CMS starter templates — see app/cms_templates/ for the
content and admin_simulations.py's create_from_template for instantiation."""
from fastapi import APIRouter, Depends
from app.core.dependencies import require_permission
from app.cms_templates import TEMPLATES

router = APIRouter(prefix="/api/admin", tags=["admin-simulation-templates"])


@router.get("/simulation-templates")
async def list_templates(_=Depends(require_permission("simulations.view"))):
    return {"templates": [
        {
            "key": t["key"], "label": t["label"], "description": t["description"],
            "domain": t["simulation"]["domain"], "stage_count": len(t["tasks"]),
        }
        for t in TEMPLATES.values()
    ]}
