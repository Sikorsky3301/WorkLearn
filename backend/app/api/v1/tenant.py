"""Public tenant resolution for multi-university subdomains."""
from fastapi import APIRouter, Depends, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.tenant import (
    TENANT_HOST_HEADER,
    host_from_request,
    resolve_tenant,
    tenant_public_dict,
)

router = APIRouter(prefix="/api/tenant", tags=["tenant"])


@router.get("")
async def get_current_tenant(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    host = host_from_request(request, x_worklearn_host)
    uni = await resolve_tenant(db, host)
    return tenant_public_dict(uni)
