from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.database import get_db
from app.core.auth import get_current_user
from app.models import AgentMessage

router = APIRouter(prefix="/api", tags=["agent-messages"])

@router.get("/agent-messages")
async def list_messages(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token["sub"]
    result = await db.execute(
        select(AgentMessage).where(AgentMessage.user_id == user_id)
        .order_by(AgentMessage.created_at.desc()).limit(20)
    )
    msgs = result.scalars().all()
    return {"messages": [_msg_dict(m) for m in msgs]}

@router.post("/agent-messages/{msg_id}/read")
async def mark_read(msg_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    result = await db.execute(
        select(AgentMessage).where(AgentMessage.id == msg_id, AgentMessage.user_id == token["sub"])
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Message not found")
    await db.execute(update(AgentMessage).where(AgentMessage.id == msg_id).values(read=True))
    await db.commit()
    return {"ok": True}

@router.post("/agent-messages/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    await db.execute(
        update(AgentMessage).where(AgentMessage.user_id == token["sub"], AgentMessage.read == False).values(read=True)
    )
    await db.commit()
    return {"ok": True}

def _msg_dict(m: AgentMessage) -> dict:
    return {
        "id": m.id, "type": m.type, "content": m.content,
        "read": m.read, "created_at": m.created_at.isoformat(),
        "enrollment_id": m.enrollment_id,
    }
