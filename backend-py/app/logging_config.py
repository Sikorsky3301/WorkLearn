"""
Central logging setup — called once at the top of app/main.py, before other
route modules import, so even startup/lifespan log lines are formatted.
"""
import logging.config


def configure_logging(level: str) -> None:
    logging.config.dictConfig({
        "version": 1,
        # Without this, dictConfig disables every logger that already exists
        # at call time — including uvicorn's own "uvicorn"/"uvicorn.error"/
        # "uvicorn.access" loggers, which would silently kill its access logs.
        "disable_existing_loggers": False,
        "filters": {
            "request_id": {"()": "app.request_context.RequestIdLogFilter"},
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
        },
        "root": {
            "level": level.upper(),
            "handlers": ["console"],
        },
    })
