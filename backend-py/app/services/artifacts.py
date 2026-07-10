"""
Local artifact store — persists each task's graded output file so the NEXT
task's sandbox can use it as input (e.g. Task 1's cleaned.csv becomes Task 2's
dataset.csv). Keyed by enrollment_id so each student's own artifacts flow
forward independently. No DB migration needed — files live on disk.
"""
from pathlib import Path

ARTIFACTS_ROOT = Path(__file__).resolve().parent.parent.parent / "data" / "artifacts"


def _dir_for(enrollment_id: str) -> Path:
    d = ARTIFACTS_ROOT / enrollment_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_artifact(enrollment_id: str, task_id: int, filename: str, content: bytes) -> None:
    path = _dir_for(enrollment_id) / f"task_{task_id}_{filename}"
    path.write_bytes(content)


def load_artifact(enrollment_id: str, task_id: int, filename: str) -> bytes | None:
    path = _dir_for(enrollment_id) / f"task_{task_id}_{filename}"
    return path.read_bytes() if path.exists() else None
