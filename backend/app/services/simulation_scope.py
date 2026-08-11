"""Ownership + university publish targeting + onboarding auto-enroll helpers."""
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import token_user_id
from app.models import User, Enrollment
from app.models.cms import Simulation, SimulationUniversity, SimulationStatus
from app.models.roles import RoleSlug
from app.models.sim_builder import SimBuilderProject
from app.models.university import University


def is_platform_admin(token: dict) -> bool:
    return token.get("role") in (RoleSlug.SUPER_ADMIN, RoleSlug.ADMIN)


def assert_can_mutate_simulation(token: dict, sim: Simulation) -> None:
    if is_platform_admin(token):
        return
    if token.get("role") == RoleSlug.TEACHER and sim.created_by == token_user_id(token):
        return
    raise HTTPException(403, "You can only edit simulations you created")


def assert_can_mutate_project(token: dict, project: SimBuilderProject) -> None:
    if is_platform_admin(token):
        return
    if token.get("role") == RoleSlug.TEACHER and project.created_by == token_user_id(token):
        return
    raise HTTPException(403, "You can only edit Sim Builder projects you created")


def scope_payload(sim: Simulation) -> dict:
    """Serialize publish targeting without triggering async lazy-loads."""
    from sqlalchemy import inspect as sa_inspect

    insp = sa_inspect(sim)
    if "university_links" in insp.unloaded:
        links = []
    else:
        links = list(sim.university_links or [])
    return {
        "available_to_all_universities": bool(getattr(sim, "available_to_all_universities", True)),
        "university_ids": [link.university_id for link in links],
    }


async def load_university_ids(db: AsyncSession, sim_id: int) -> list[int]:
    res = await db.execute(
        select(SimulationUniversity.university_id).where(SimulationUniversity.simulation_id == sim_id)
    )
    return list(res.scalars().all())


async def set_publish_scope(
    db: AsyncSession,
    sim: Simulation,
    *,
    available_to_all: bool,
    university_ids: list[int] | None,
) -> None:
    if available_to_all:
        sim.available_to_all_universities = True
        await db.execute(delete(SimulationUniversity).where(SimulationUniversity.simulation_id == sim.id))
        return

    ids = list({int(x) for x in (university_ids or [])})
    if not ids:
        raise HTTPException(400, "Select at least one university, or publish to all universities")

    existing = await db.execute(select(University.id).where(University.id.in_(ids)))
    found = set(existing.scalars().all())
    missing = [i for i in ids if i not in found]
    if missing:
        raise HTTPException(400, f"Unknown university id(s): {missing}")

    sim.available_to_all_universities = False
    await db.execute(delete(SimulationUniversity).where(SimulationUniversity.simulation_id == sim.id))
    for uid in ids:
        db.add(SimulationUniversity(simulation_id=sim.id, university_id=uid))


async def apply_publish_scope_for_actor(
    db: AsyncSession,
    token: dict,
    sim: Simulation,
    body: dict | None,
) -> None:
    """Teachers always force own university; admins use body (default all)."""
    body = body or {}
    if is_platform_admin(token):
        available_to_all = body.get("available_to_all")
        if available_to_all is None:
            # Back-compat: omit → all universities
            available_to_all = True
        university_ids = body.get("university_ids")
        await set_publish_scope(
            db, sim,
            available_to_all=bool(available_to_all),
            university_ids=university_ids,
        )
        return

    # Teacher
    user: User | None = token.get("_user")
    if user is None:
        uid = token_user_id(token)
        res = await db.execute(select(User).where(User.id == uid))
        user = res.scalar_one_or_none()
    if not user or not user.university_id:
        raise HTTPException(400, "Teacher account has no university — cannot publish")
    await set_publish_scope(db, sim, available_to_all=False, university_ids=[user.university_id])


def sim_visible_to_university(sim: Simulation, university_id: int | None) -> bool:
    if sim.status != SimulationStatus.PUBLISHED:
        return False
    if getattr(sim, "available_to_all_universities", True):
        return True
    if university_id is None:
        return False
    links = getattr(sim, "university_links", None)
    if links is not None:
        return any(link.university_id == university_id for link in links)
    return False


async def published_sims_for_university(
    db: AsyncSession,
    university_id: int | None,
) -> list[Simulation]:
    q = (
        select(Simulation)
        .where(Simulation.status == SimulationStatus.PUBLISHED)
        .options(selectinload(Simulation.university_links))
    )
    result = await db.execute(q)
    sims = result.scalars().all()
    return [s for s in sims if sim_visible_to_university(s, university_id)]


async def assert_sim_visible_to_tenant(
    db: AsyncSession,
    sim: Simulation,
    university_id: int | None,
) -> None:
    # Ensure links loaded
    if not hasattr(sim, "university_links") or sim.university_links is None:
        await db.refresh(sim, attribute_names=["university_links"])
    if not sim_visible_to_university(sim, university_id):
        raise HTTPException(404, "Simulation not found")


def domain_matches(sim: Simulation, preferred_domain: str | None) -> bool:
    if not preferred_domain:
        return False
    want = preferred_domain.strip().lower()
    domain = (sim.domain or "").strip().lower()
    category = (sim.category or "").strip().lower()
    return want == domain or (bool(category) and want == category)


async def assign_onboarding_simulations(db: AsyncSession, user: User) -> list[int]:
    """Enroll student into tenant-visible published sims matching preferred_domain."""
    uni_id = user.university_id
    if uni_id is None:
        res = await db.execute(select(University).where(University.is_default == True))  # noqa: E712
        default_uni = res.scalar_one_or_none()
        uni_id = default_uni.id if default_uni else None

    sims = await published_sims_for_university(db, uni_id)
    matched = [s for s in sims if domain_matches(s, user.preferred_domain)]
    assigned: list[int] = []
    for sim in matched:
        existing = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user.id,
                Enrollment.simulation_id == sim.id,
            )
        )
        if existing.scalar_one_or_none():
            continue
        db.add(Enrollment(user_id=user.id, simulation_id=sim.id))
        assigned.append(sim.id)
    return assigned
