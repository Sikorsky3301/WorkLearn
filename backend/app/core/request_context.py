"""
Per-request correlation ID — threaded through logging so every log line
emitted while handling a request (including from deep helpers like
mentor_tools.py/llm.py that never see the Request object) can be grepped
back to that one request, and so a client-visible X-Request-ID header can be
matched against the server-side traceback for a given 500.
"""
import logging
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        # Deliberately not reset in a finally: the global exception handler
        # (app.exception_handler(Exception)) is invoked by Starlette's
        # ServerErrorMiddleware, which sits OUTSIDE this middleware on an
        # unhandled exception. If we reset here on the way out, that handler
        # would see the var already cleared back to "-" before it ever runs.
        # Each request is its own asyncio Task, so leaving it set doesn't
        # leak into other requests.
        request_id_var.set(rid)
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response


class RequestIdLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class CatchUnhandledMiddleware(BaseHTTPMiddleware):
    """Turn an unhandled exception into a 500 response from INSIDE the CORS layer.

    Starlette's own ServerErrorMiddleware is always the outermost layer — it
    wraps CORSMiddleware, not the other way round — so the 500 it produces for
    an unhandled exception never passes back through CORS and carries no
    `Access-Control-Allow-Origin` header. The browser then blocks the response
    it did receive, `fetch()` rejects, and the frontend reports a *network*
    failure.

    That is exactly how `column universities.logo_url does not exist` reached a
    student as "We can't reach WorkLearn right now" with the real cause visible
    only in the server log. Every backend crash looked like a down server.

    Registered so it sits inside CORSMiddleware (added BEFORE it — Starlette
    applies middleware in reverse registration order), so the response it
    returns travels back out through CORS and gets the headers.
    """

    async def dispatch(self, request, call_next):
        try:
            return await call_next(request)
        except Exception:
            # Same contract as the app-level handler in main.py: the traceback
            # goes to the log, never into the response body.
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "request_id": getattr(request.state, "request_id", "-"),
                },
            )
