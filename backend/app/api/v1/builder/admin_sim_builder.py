"""
CRUD for Sim Builder — a separate, Framer-like visual editor for authoring
job simulations as Weeks -> Pages -> Blocks. Gated by the same granular
simulations.* permissions as admin_simulations.py (see
app/services/permissions_seed.py) — SUPER_ADMIN bypasses these
unconditionally; an ADMIN needs the matching permission on their assigned
AdminRole. Deliberately independent of admin_simulations.py / models_cms.py —
see models_sim_builder.py's module docstring for why.
"""
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.core.permissions import require_permission
from app.models.sim_builder import SimBuilderProject, SimBuilderPage, SimBuilderBlock, SimBuilderVersion, SimBuilderStatus
from app.schemas.sim_builder import (
    SimBuilderProjectCreate, SimBuilderProjectUpdate, SimBuilderPageCreate, SimBuilderPageUpdate,
    ReorderPagesBody, SimBuilderBlockCreate, SimBuilderBlockUpdate, ReorderBlocksBody, AiGenerateBody,
    validate_block_config,
)
from app.services.block_types import BLOCK_TYPES, default_config_for
from app.ai.services import llm

router = APIRouter(prefix="/api/admin/sim-builder", tags=["admin-sim-builder"])


# ── Serialization ─────────────────────────────────────────────────────────────

def _block_dict(b: SimBuilderBlock) -> dict:
    return {
        "id": b.id, "page_id": b.page_id, "block_type": b.block_type,
        "order": b.order, "config": b.config,
    }


def _page_dict(p: SimBuilderPage) -> dict:
    return {
        "id": p.id, "project_id": p.project_id, "title": p.title, "week": p.week, "order": p.order,
        "blocks": [_block_dict(b) for b in sorted(p.blocks, key=lambda b: b.order)],
    }


def _project_summary(project: SimBuilderProject, page_count: int) -> dict:
    return {
        "id": project.id, "title": project.title, "status": project.status.value,
        "page_count": page_count,
        "updated_at": project.updated_at.isoformat(),
        "published_at": project.published_at.isoformat() if project.published_at else None,
    }


def _project_dict(project: SimBuilderProject) -> dict:
    return {
        "id": project.id, "title": project.title, "status": project.status.value,
        "created_at": project.created_at.isoformat(), "updated_at": project.updated_at.isoformat(),
        "published_at": project.published_at.isoformat() if project.published_at else None,
        "pages": [_page_dict(p) for p in sorted(project.pages, key=lambda p: p.order)],
    }


def _version_summary(v: SimBuilderVersion) -> dict:
    return {
        "id": v.id, "project_id": v.project_id, "version_number": v.version_number,
        "label": v.label, "created_at": v.created_at.isoformat(),
    }


async def _get_project_or_404(project_id: str, db: AsyncSession) -> SimBuilderProject:
    result = await db.execute(select(SimBuilderProject).where(SimBuilderProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Sim Builder project not found")
    return project


async def _get_page_or_404(project_id: str, page_id: str, db: AsyncSession) -> SimBuilderPage:
    result = await db.execute(
        select(SimBuilderPage).where(SimBuilderPage.id == page_id, SimBuilderPage.project_id == project_id)
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(404, "Page not found")
    return page


async def _get_block_or_404(page_id: str, block_id: str, db: AsyncSession) -> SimBuilderBlock:
    result = await db.execute(
        select(SimBuilderBlock).where(SimBuilderBlock.id == block_id, SimBuilderBlock.page_id == page_id)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(404, "Block not found")
    return block


# ── Projects ──────────────────────────────────────────────────────────────────

@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.view"))):
    result = await db.execute(select(SimBuilderProject))
    projects = result.scalars().all()
    out = []
    for project in projects:
        count_res = await db.execute(
            select(func.count()).select_from(SimBuilderPage).where(SimBuilderPage.project_id == project.id)
        )
        out.append(_project_summary(project, count_res.scalar() or 0))
    return {"projects": out}


@router.post("")
async def create_project(body: SimBuilderProjectCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("simulations.create"))):
    project = SimBuilderProject(title=body.title, status=SimBuilderStatus.DRAFT, created_by=token.get("sub"))
    db.add(project)
    await db.commit()
    await db.refresh(project, attribute_names=["pages"])
    return _project_dict(project)


@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.view"))):
    project = await _get_project_or_404(project_id, db)
    await db.refresh(project, attribute_names=["pages"])
    for page in project.pages:
        await db.refresh(page, attribute_names=["blocks"])
    return _project_dict(project)


@router.patch("/{project_id}")
async def update_project(project_id: str, body: SimBuilderProjectUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    project = await _get_project_or_404(project_id, db)
    patch = body.model_dump(exclude_unset=True)
    for key, value in patch.items():
        setattr(project, key, value)
    await db.commit()
    await db.refresh(project, attribute_names=["pages"])
    return _project_dict(project)


@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.delete"))):
    project = await _get_project_or_404(project_id, db)
    await db.delete(project)
    await db.commit()
    return {"ok": True}


# ── Pages ─────────────────────────────────────────────────────────────────────

@router.post("/{project_id}/pages")
async def create_page(project_id: str, body: SimBuilderPageCreate, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    await _get_project_or_404(project_id, db)
    existing = await db.execute(
        select(SimBuilderPage).where(SimBuilderPage.project_id == project_id, SimBuilderPage.order == body.order)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"A page already exists at order {body.order}")

    page = SimBuilderPage(project_id=project_id, title=body.title, week=body.week, order=body.order)
    db.add(page)
    await db.commit()
    await db.refresh(page, attribute_names=["blocks"])
    return _page_dict(page)


@router.patch("/{project_id}/pages/{page_id}")
async def update_page(project_id: str, page_id: str, body: SimBuilderPageUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    page = await _get_page_or_404(project_id, page_id, db)
    patch = body.model_dump(exclude_unset=True)
    for key, value in patch.items():
        setattr(page, key, value)
    await db.commit()
    await db.refresh(page, attribute_names=["blocks"])
    return _page_dict(page)


@router.delete("/{project_id}/pages/{page_id}")
async def delete_page(project_id: str, page_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    page = await _get_page_or_404(project_id, page_id, db)
    await db.delete(page)
    await db.commit()
    return {"ok": True}


@router.post("/{project_id}/pages/reorder")
async def reorder_pages(project_id: str, body: ReorderPagesBody, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    result = await db.execute(select(SimBuilderPage).where(SimBuilderPage.project_id == project_id))
    pages_by_id = {p.id: p for p in result.scalars().all()}
    if set(body.page_ids) != set(pages_by_id.keys()):
        raise HTTPException(400, "page_ids must be exactly the project's current page set")

    # Two-pass update avoids transiently colliding with the UniqueConstraint
    # on (project_id, order) while indices are being reshuffled.
    for i, page_id in enumerate(body.page_ids):
        pages_by_id[page_id].order = -(i + 1)
    await db.flush()
    for i, page_id in enumerate(body.page_ids):
        pages_by_id[page_id].order = i + 1
    await db.commit()
    return {"ok": True}


# ── Blocks ────────────────────────────────────────────────────────────────────

@router.post("/{project_id}/pages/{page_id}/blocks")
async def create_block(project_id: str, page_id: str, body: SimBuilderBlockCreate, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    await _get_page_or_404(project_id, page_id, db)
    try:
        validated_config = validate_block_config(body.block_type, body.config)
    except ValidationError as e:
        raise HTTPException(422, f"Invalid config for block type '{body.block_type}': {e}")

    existing = await db.execute(
        select(SimBuilderBlock).where(SimBuilderBlock.page_id == page_id, SimBuilderBlock.order == body.order)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"A block already exists at order {body.order}")

    block = SimBuilderBlock(page_id=page_id, block_type=body.block_type, order=body.order, config=validated_config)
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return _block_dict(block)


@router.patch("/{project_id}/pages/{page_id}/blocks/{block_id}")
async def update_block(project_id: str, page_id: str, block_id: str, body: SimBuilderBlockUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    await _get_page_or_404(project_id, page_id, db)
    block = await _get_block_or_404(page_id, block_id, db)
    try:
        block.config = validate_block_config(block.block_type, body.config)
    except ValidationError as e:
        raise HTTPException(422, f"Invalid config for block type '{block.block_type}': {e}")
    await db.commit()
    await db.refresh(block)
    return _block_dict(block)


@router.delete("/{project_id}/pages/{page_id}/blocks/{block_id}")
async def delete_block(project_id: str, page_id: str, block_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    await _get_page_or_404(project_id, page_id, db)
    block = await _get_block_or_404(page_id, block_id, db)
    await db.delete(block)
    await db.commit()
    return {"ok": True}


@router.post("/{project_id}/pages/{page_id}/blocks/reorder")
async def reorder_blocks(project_id: str, page_id: str, body: ReorderBlocksBody, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    await _get_page_or_404(project_id, page_id, db)
    result = await db.execute(select(SimBuilderBlock).where(SimBuilderBlock.page_id == page_id))
    blocks_by_id = {b.id: b for b in result.scalars().all()}
    if set(body.block_ids) != set(blocks_by_id.keys()):
        raise HTTPException(400, "block_ids must be exactly the page's current block set")

    for i, block_id in enumerate(body.block_ids):
        blocks_by_id[block_id].order = -(i + 1)
    await db.flush()
    for i, block_id in enumerate(body.block_ids):
        blocks_by_id[block_id].order = i + 1
    await db.commit()
    return {"ok": True}


# ── Publish + Version History ────────────────────────────────────────────────

@router.post("/{project_id}/publish")
async def publish_project(project_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("simulations.publish"))):
    project = await _get_project_or_404(project_id, db)
    await db.refresh(project, attribute_names=["pages"])
    for page in project.pages:
        await db.refresh(page, attribute_names=["blocks"])
    if not project.pages:
        raise HTTPException(400, "Cannot publish a project with no pages")

    count_res = await db.execute(
        select(func.count()).select_from(SimBuilderVersion).where(SimBuilderVersion.project_id == project_id)
    )
    next_version = (count_res.scalar() or 0) + 1

    version = SimBuilderVersion(
        project_id=project_id, version_number=next_version, label=f"Version {next_version}",
        snapshot=_project_dict(project), created_by=token.get("sub"),
    )
    db.add(version)
    project.status = SimBuilderStatus.PUBLISHED
    project.published_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True, "status": project.status.value, "version_number": next_version}


@router.get("/{project_id}/versions")
async def list_versions(project_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.view"))):
    await _get_project_or_404(project_id, db)
    result = await db.execute(
        select(SimBuilderVersion).where(SimBuilderVersion.project_id == project_id).order_by(SimBuilderVersion.version_number.desc())
    )
    return {"versions": [_version_summary(v) for v in result.scalars().all()]}


@router.post("/{project_id}/versions/{version_id}/restore")
async def restore_version(project_id: str, version_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    """Destructive: replaces the project's entire live Pages/Blocks tree with
    the snapshot's contents. The frontend must confirm before calling this —
    matches this app's existing confirm-before-destructive pattern (e.g. the
    SuperAdmin user-delete flow)."""
    project = await _get_project_or_404(project_id, db)
    result = await db.execute(
        select(SimBuilderVersion).where(SimBuilderVersion.id == version_id, SimBuilderVersion.project_id == project_id)
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(404, "Version not found")

    await db.refresh(project, attribute_names=["pages"])
    for page in list(project.pages):
        await db.delete(page)
    await db.flush()

    for page_data in version.snapshot.get("pages", []):
        page = SimBuilderPage(project_id=project_id, title=page_data["title"], week=page_data.get("week"), order=page_data["order"])
        db.add(page)
        await db.flush()
        for block_data in page_data.get("blocks", []):
            db.add(SimBuilderBlock(
                page_id=page.id, block_type=block_data["block_type"],
                order=block_data["order"], config=block_data.get("config") or {},
            ))

    await db.commit()
    return {"ok": True}


# ── AI Generate ───────────────────────────────────────────────────────────────

_AI_GENERATE_INSTRUCTIONS = """You are an instructional designer. Given a short brief, output ONLY a JSON object (no prose, no markdown fences) with this exact shape:
{"weeks": [{"label": "Week 1", "pages": [{"title": "...", "blocks": [{"type": "heading|text|image|video|quiz|ai_chat|email_exercise|coding_challenge|file_upload|assessment|branching_logic|timer|xp_rewards", "config": {}}]}]}]}
Use 1-3 weeks, 2-4 pages per week, 2-5 blocks per page, mixing block types naturally (don't use the same type for every block). Keep each block's `config` minimal but on-topic for the brief:
- heading: {"text": "...", "level": 2}
- text: {"body": "..."}
- image: {"url": "", "caption": "..."}
- video: {"url": "", "caption": "..."}
- quiz: {"question": "...", "options": ["...", "..."], "correct": 0}
- ai_chat: {"persona_name": "...", "persona_role": "...", "prompt": "..."}
- email_exercise: {"scenario": "...", "to_placeholder": "...", "subject_placeholder": "...", "body_placeholder": "..."}
- coding_challenge: {"language": "python", "starter_code": "...", "instructions": "..."}
- file_upload: {"instructions": "...", "accepted_types": [".pdf"], "max_size_mb": 10}
- assessment: {"criteria": [{"label": "...", "weight": 0.5}, {"label": "...", "weight": 0.5}]}
- branching_logic: {"prompt": "...", "branches": [{"label": "...", "description": "..."}, {"label": "...", "description": "..."}]}
- timer: {"duration_minutes": 15, "label": "..."}
- xp_rewards: {"xp_amount": 50, "badge_label": "..."}
"""


def _extract_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return json.loads(text)


@router.post("/{project_id}/ai-generate")
async def ai_generate(project_id: str, body: AiGenerateBody, db: AsyncSession = Depends(get_db), _=Depends(require_permission("simulations.edit"))):
    """Generates a Weeks/Pages/Blocks skeleton from a text brief and appends
    it to the project (after any existing pages) — a v1 scoped to structural
    skeleton generation, not full content authoring. Reuses the existing
    multi-provider LLM service (app/ai/services/llm.py), same one the job-sim
    builder's AI Roleplay/Text-Rubric tasks already depend on."""
    project = await _get_project_or_404(project_id, db)
    if not body.prompt.strip():
        raise HTTPException(400, "prompt is required")

    raw = await llm.generate(
        prompt=f"{_AI_GENERATE_INSTRUCTIONS}\n\nBrief: {body.prompt.strip()}",
        max_tokens=2000, trace_name="sim-builder-ai-generate",
    )
    try:
        parsed = _extract_json(raw)
        weeks = parsed["weeks"]
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(502, f"AI generation returned an unexpected format: {e}")

    max_order_res = await db.execute(select(func.max(SimBuilderPage.order)).where(SimBuilderPage.project_id == project_id))
    next_page_order = (max_order_res.scalar() or 0) + 1

    created_pages = 0
    for week in weeks:
        week_label = week.get("label")
        week_number = None
        if week_label:
            digits = "".join(c for c in week_label if c.isdigit())
            week_number = int(digits) if digits else None
        for page_data in week.get("pages", []):
            page = SimBuilderPage(
                project_id=project_id, title=page_data.get("title") or "Untitled Page",
                week=week_number, order=next_page_order,
            )
            db.add(page)
            await db.flush()
            next_page_order += 1
            created_pages += 1

            for i, block_data in enumerate(page_data.get("blocks", [])):
                block_type = block_data.get("type")
                if block_type not in BLOCK_TYPES:
                    continue
                try:
                    config = validate_block_config(block_type, block_data.get("config") or {})
                except ValidationError:
                    config = default_config_for(block_type)
                db.add(SimBuilderBlock(page_id=page.id, block_type=block_type, order=i + 1, config=config))

    await db.commit()
    await db.refresh(project, attribute_names=["pages"])
    for page in project.pages:
        await db.refresh(page, attribute_names=["blocks"])
    return {"pages_created": created_pages, "project": _project_dict(project)}
