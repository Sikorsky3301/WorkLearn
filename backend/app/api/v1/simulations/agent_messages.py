from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.database import get_db
from app.core.auth import get_current_user, token_user_id
from app.models import AgentMessage, Enrollment
from app.models.cms import Simulation

router = APIRouter(prefix="/api", tags=["agent-messages"])

@router.get("/agent-messages")
async def list_messages(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    # Left-joined out to the simulation so each message can carry the slug it
    # belongs to. Without it the bell knows only an enrollment_id and has no
    # way to link a message to the simulation it is about.
    result = await db.execute(
        select(AgentMessage, Simulation.slug)
        .outerjoin(Enrollment, Enrollment.id == AgentMessage.enrollment_id)
        .outerjoin(Simulation, Simulation.id == Enrollment.simulation_id)
        .where(AgentMessage.user_id == user_id)
        .order_by(AgentMessage.created_at.desc()).limit(20)
    )
    return {"messages": [_msg_dict(m, slug) for m, slug in result.all()]}

@router.post("/agent-messages/{msg_id}/read")
async def mark_read(msg_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(
        select(AgentMessage).where(AgentMessage.id == msg_id, AgentMessage.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Message not found")
    await db.execute(update(AgentMessage).where(AgentMessage.id == msg_id).values(read=True))
    await db.commit()
    return {"ok": True}

@router.post("/agent-messages/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    await db.execute(
        update(AgentMessage).where(AgentMessage.user_id == user_id, AgentMessage.read == False).values(read=True)
    )
    await db.commit()
    return {"ok": True}

def _msg_dict(m: AgentMessage, simulation_slug: str | None = None) -> dict:
    return {
        "id": m.id, "type": m.type, "content": m.content,
        "read": m.read, "created_at": m.created_at.isoformat(),
        "enrollment_id": m.enrollment_id, "simulation_slug": simulation_slug,
    }
