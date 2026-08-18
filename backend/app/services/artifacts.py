"""
Local artifact store — persists each task's graded output file so the NEXT
task's sandbox can use it as input (e.g. Task 1's cleaned.csv becomes Task 2's
dataset.csv). Keyed by enrollment_id so each student's own artifacts flow
forward independently. No DB migration needed — files live on disk.
"""
from pathlib import Path

ARTIFACTS_ROOT = Path(__file__).resolve().parent.parent.parent / "data" / "artifacts"

# NOTE for local development: this directory sits INSIDE the backend tree that
# `uvicorn --reload` watches, so every real (non-dry-run) submission writes a
# file that makes the reloader restart the server mid-request — killing the
# very request that wrote it, which the browser sees as a dropped connection
# rather than any HTTP error. Scope the watcher to the source package to avoid
# it:
#
#     uvicorn app.main:app --reload --reload-dir app --port 3001
#
# The location itself is right for production (artifacts must survive across
# runs so one task's output can be the next task's input), so this is a
# dev-loop concern, not a reason to move the store.


def _dir_for(enrollment_id: str | int) -> Path:
    # str() because callers legitimately hold an int: the sandbox routes
    # declare `enrollment_id: int`, and `Path / int` raises TypeError rather
    # than coercing. That mismatch meant EVERY real submission 500'd at the
    # point of saving its artifact — while dry runs, which never reach this
    # code, worked perfectly and made the failure look intermittent.
    d = ARTIFACTS_ROOT / str(enrollment_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_artifact(enrollment_id: str | int, task_id: int, filename: str, content: bytes) -> None:
    path = _dir_for(enrollment_id) / f"task_{task_id}_{filename}"
    path.write_bytes(content)


def load_artifact(enrollment_id: str | int, task_id: int, filename: str) -> bytes | None:
    path = _dir_for(enrollment_id) / f"task_{task_id}_{filename}"
    return path.read_bytes() if path.exists() else None
