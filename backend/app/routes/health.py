from fastapi import APIRouter

# Deliberately unversioned (sits alongside routes/v1/, not inside it) and
# outside the /api prefix every v1 router uses — orchestrators/monitoring
# (see k8s/backend/deployment.yaml's liveness/readiness probes) shouldn't
# need to know about API versioning just to check the process is up.
router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}
