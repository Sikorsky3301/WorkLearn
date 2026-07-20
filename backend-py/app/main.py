from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth, enrollments, ai_mentor, agent_messages, analytics, admin, mentor, sandbox, crm_sim
from app.agents.manager import start_scheduler
from app.services.langfuse_client import init_langfuse, shutdown_langfuse, langfuse_enabled

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (dev convenience — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start Manager scheduler (deterministic reminders + deadline checks)
    try:
        start_scheduler()
        print("[manager] scheduler started")
    except Exception as e:
        print(f"[manager] scheduler failed to start: {e}")

    # Langfuse tracing — registers the SDK singleton get_client() reuses
    # elsewhere; no-ops if LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY aren't set.
    init_langfuse()
    print(f"[langfuse] tracing {'enabled' if langfuse_enabled else 'disabled (no API keys configured)'}")

    yield

    # Shutdown
    from app.agents.manager import scheduler
    if scheduler.running:
        scheduler.shutdown(wait=False)
    shutdown_langfuse()

app = FastAPI(title="WorkAlearn API", lifespan=lifespan)


def _cors_origins() -> list[str]:
    """`localhost` and `127.0.0.1` are different CORS origins as far as the
    browser is concerned, even though they're the same machine — so whichever
    loopback form FRONTEND_URL isn't already, also allow it. Without this,
    the dev server binding to one form (e.g. Vite on 127.0.0.1) while
    FRONTEND_URL configures the other silently breaks every request with a
    CORS error."""
    origins = {settings.frontend_url}
    if "://localhost:" in settings.frontend_url:
        origins.add(settings.frontend_url.replace("localhost", "127.0.0.1"))
    elif "://127.0.0.1:" in settings.frontend_url:
        origins.add(settings.frontend_url.replace("127.0.0.1", "localhost"))
    return list(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(enrollments.router)
app.include_router(ai_mentor.router)
app.include_router(agent_messages.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(mentor.router)
app.include_router(sandbox.router)
app.include_router(crm_sim.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
