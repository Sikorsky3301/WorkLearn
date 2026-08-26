"""Resolve university tenant from request hostname."""
import ipaddress
from fastapi import Header, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.university import University
from fastapi import Depends

# Labels that never map to a partner university (main / academy host)
RESERVED_SUBDOMAINS = frozenset({
    "www", "app", "api", "admin", "static", "mail", "localhost",
})

TENANT_HOST_HEADER = "X-WorkLearn-Host"


def extract_partner_subdomain(host: str | None) -> str | None:
    """Return partner subdomain label, or None for the teaching-academy (main) host."""
    if not host:
        return None
    host = host.strip().lower()

    # Strip the port. An IPv6 literal keeps its brackets here — naively
    # splitting "[::1]:5173" on the first ":" truncates it to "[", so the
    # bracket form is handled before falling back to a plain split.
    if host.startswith("["):
        host = host.split("]")[0] + "]"
    else:
        host = host.split(":")[0]

    if not host or host in ("localhost", "127.0.0.1", "::1", "[::1]"):
        return None

    # An IP literal is never a partner subdomain host — it's how the SAME
    # apex site is reached from another device on the network, not a
    # different tenant.
    #
    # Without this check, opening the app at http://192.168.0.214:5173 split
    # "192.168.0.214" on "." into four labels and read "192" as a partner
    # subdomain — so logging in from any device on the LAN failed with
    # "Unknown university subdomain: 192" instead of reaching the ordinary
    # teaching-academy login every other host on this same machine gets.
    bare = host[1:-1] if host.startswith("[") and host.endswith("]") else host
    try:
        ipaddress.ip_address(bare)
        return None
    except ValueError:
        pass

    parts = host.split(".")
    # iitd.localhost
    if parts[-1] == "localhost":
        if len(parts) >= 2 and parts[0] not in RESERVED_SUBDOMAINS:
            return parts[0]
        return None

    # iitd.worklearn.ai (3+ labels)
    if len(parts) >= 3:
        label = parts[0]
        if label in RESERVED_SUBDOMAINS:
            return None
        return label

    # worklearn.ai / example.com — apex = academy
    return None


def host_from_request(
    request: Request,
    x_worklearn_host: str | None = None,
) -> str | None:
    raw = (x_worklearn_host or "").strip() or request.headers.get("host")
    return raw


def tenant_public_dict(uni: University) -> dict:
    return {
        "id": uni.id,
        "code": uni.code,
        "name": uni.name,
        "logo_url": uni.logo_url,
        "is_default": bool(uni.is_default),
        "subdomain": None if uni.is_default else uni.code.lower(),
    }


async def get_default_university(db: AsyncSession) -> University:
    result = await db.execute(select(University).where(University.is_default == True))  # noqa: E712
    uni = result.scalar_one_or_none()
    if not uni:
        raise HTTPException(500, "Default university (teaching academy) is not configured")
    return uni


async def get_partner_university(db: AsyncSession, subdomain: str) -> University:
    result = await db.execute(
        select(University).where(
            func.lower(University.code) == subdomain.lower(),
            University.is_default == False,  # noqa: E712
        )
    )
    uni = result.scalar_one_or_none()
    if not uni:
        raise HTTPException(404, f"Unknown university subdomain: {subdomain}")
    return uni


async def resolve_tenant(
    db: AsyncSession,
    host: str | None,
) -> University:
    subdomain = extract_partner_subdomain(host)
    if subdomain is None:
        return await get_default_university(db)
    return await get_partner_university(db, subdomain)


async def get_tenant(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
) -> University:
    return await resolve_tenant(db, host_from_request(request, x_worklearn_host))
