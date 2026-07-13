"""
Sandbox facade — dispatches to whichever runner is configured
(SANDBOX_RUNNER=docker|kubernetes, see app/services/sandbox_runners/).
Callers (app/routes/sandbox.py) only depend on this module's interface, not
on how a submission is actually executed.
"""
import shutil
from pathlib import Path

from app.services.sandbox_runners import SandboxResult, get_runner

__all__ = ["SandboxResult", "run_submission", "read_output", "cleanup"]


async def run_submission(
    code: str,
    input_files: dict[str, bytes | str] | None = None,
    image: str | None = None,
    submission_filename: str = "submission.py",
) -> SandboxResult:
    """
    Runs `code` as `submission_filename` inside a locked-down sandbox.
    `input_files` are written into the workspace before execution starts
    (e.g. {"dataset.csv": csv_bytes}) so the student's code can read them.
    `image` overrides the default (Python) sandbox image, e.g. for the
    frontend sandbox. The caller is responsible for reading back any
    output.* files from result.workdir and MUST clean up the workdir when
    done (see cleanup()).
    """
    return await get_runner().run_submission(code, input_files, image, submission_filename)


def read_output(result: SandboxResult, filename: str) -> bytes | None:
    path = result.workdir / filename
    return path.read_bytes() if path.exists() else None


def cleanup(workdir: Path) -> None:
    shutil.rmtree(workdir, ignore_errors=True)
