"""
Central logging setup — called once at the top of app/main.py, before other
route modules import, so even startup/lifespan log lines are formatted.
"""
import logging.config
from pathlib import Path

# Logs went to the console only, which meant a traceback existed exactly as
# long as the terminal did — close it, scroll past it, or run the server in a
# window you don't have in front of you, and the one record of what went wrong
# was gone. The unhandled-exception handler deliberately keeps details out of
# HTTP responses (correct), so the log IS the only copy.
#
# Rotating, so it can't grow without bound on a long-running dev server.
LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "backend.log"


def configure_logging(level: str) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    logging.config.dictConfig({
        "version": 1,
        # Without this, dictConfig disables every logger that already exists
        # at call time — including uvicorn's own "uvicorn"/"uvicorn.error"/
        # "uvicorn.access" loggers, which would silently kill its access logs.
        "disable_existing_loggers": False,
        "filters": {
            "request_id": {"()": "app.core.request_context.RequestIdLogFilter"},
        },
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)-8s [%(request_id)s] %(name)s: %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "filters": ["request_id"],
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(LOG_FILE),
                "maxBytes": 5 * 1024 * 1024,
                "backupCount": 3,
                "encoding": "utf-8",
                "formatter": "default",
                "filters": ["request_id"],
            },
        },
        "root": {
            "level": level.upper(),
            "handlers": ["console", "file"],
        },
    })
