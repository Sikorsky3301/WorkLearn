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
