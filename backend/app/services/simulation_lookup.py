"""Resolve simulations by public slug or integer id."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.cms import Simulation, SimulationStatus


async def get_simulation(db: AsyncSession, key: str | int, *, published_only: bool = False) -> Simulation | None:
    """`key` is either the integer id or the public slug string."""
    q = select(Simulation)
    if isinstance(key, int) or (isinstance(key, str) and key.isdigit()):
        q = q.where(Simulation.id == int(key))
    else:
        q = q.where(Simulation.slug == str(key))
    if published_only:
        q = q.where(Simulation.status == SimulationStatus.PUBLISHED)
    result = await db.execute(q)
    return result.scalar_one_or_none()
