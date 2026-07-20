"""
Langfuse tracing setup.

Guarded by `langfuse_enabled` (true only once both API keys are configured)
so the app behaves exactly as before — zero overhead, zero log noise — when
tracing isn't set up. An unconfigured `Langfuse()` client fails auth inside
its own constructor and, per the SDK's internal guard, does NOT register as
the reusable singleton `get_client()` expects; every subsequent
`get_client()` call would otherwise rebuild a fresh disabled client and log
its own "Authentication error" line, once per call. Routing every tracing
call site through `traced_observation()` / `traced_context()` below keeps
that guard in one place instead of repeated at each call site.
"""
from contextlib import contextmanager
from app.config import settings

langfuse_enabled = bool(settings.langfuse_public_key and settings.langfuse_secret_key)


def init_langfuse() -> None:
    """Call once at app startup, before any tracing call site runs, so the
    SDK registers its singleton — get_client() elsewhere then reuses it."""
    if not langfuse_enabled:
        return
    from langfuse import Langfuse
    Langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_host,
    )


def shutdown_langfuse() -> None:
    """Flush buffered traces and stop background threads on app shutdown."""
    if not langfuse_enabled:
        return
    from langfuse import get_client
    get_client().shutdown()


class _NoopObservation:
    """Stand-in yielded when tracing is disabled, so call sites can always
    call .update(...) on the yielded object without branching themselves."""
    def update(self, **kwargs):
        pass


@contextmanager
def traced_observation(as_type: str, name: str, **kwargs):
    """Span or generation; no-ops when Langfuse isn't configured.

    as_type: "span" for a step/request wrapper, "generation" for an actual
    LLM call (enables Langfuse's model-specific analytics and cost calc).
    """
    if not langfuse_enabled:
        yield _NoopObservation()
        return
    from langfuse import get_client
    with get_client().start_as_current_observation(as_type=as_type, name=name, **kwargs) as obs:
        yield obs


@contextmanager
def traced_context(**kwargs):
    """Tags the active trace with user_id/session_id/tags/etc — no-ops when
    Langfuse isn't configured. See langfuse.propagate_attributes()."""
    if not langfuse_enabled:
        yield
        return
    from langfuse import propagate_attributes
    with propagate_attributes(**kwargs):
        yield
