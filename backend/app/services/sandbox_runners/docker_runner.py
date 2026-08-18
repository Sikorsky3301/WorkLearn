"""
Docker sandbox runner — shells out to `docker run` on the host daemon.
Each submission gets a fresh, network-disabled, resource-capped, one-shot
container. Nothing here trusts the container's stdout for grading — callers
read back whatever artifact file the container wrote to the mounted
workspace and grade THAT (see app/services/graders/).
"""
import asyncio
import functools
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path

from app.core.config import settings
from app.services.sandbox_runners.base import SandboxResult

logger = logging.getLogger(__name__)


@functools.lru_cache(maxsize=1)
def _docker_binary() -> str:
    """Absolute path to the docker CLI, resolved once.

    `subprocess.run(["docker", ...])` searches the PATH *of this process*, which
    is inherited from whichever shell started the server — not from the machine.
    A terminal opened before Docker Desktop was installed (or one with a
    different profile) has no docker on PATH, and every submission then dies
    with `FileNotFoundError: [WinError 2] The system cannot find the file
    specified` — a message that names neither docker nor PATH, so it reads like
    a bug in this app.

    Resolving explicitly means the server works regardless of how it was
    launched, and fails with something actionable when Docker genuinely isn't
    installed. Cached because this cannot change within a process lifetime.
    """
    found = shutil.which("docker")
    if found:
        return found

    # Docker Desktop's usual homes, for a process whose PATH predates the
    # install. Per-user first (the default for recent installers).
    candidates = [
        Path.home() / "AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe",
        Path("C:/Program Files/Docker/Docker/resources/bin/docker.exe"),
        Path("C:/ProgramData/DockerDesktop/version-bin/docker.exe"),
        Path("/usr/bin/docker"),
        Path("/usr/local/bin/docker"),
    ]
    for candidate in candidates:
        if candidate.exists():
            logger.warning(
                "docker not on PATH; falling back to %s. Start the server from a "
                "shell where `docker` resolves to avoid this lookup.", candidate,
            )
            return str(candidate)

    raise FileNotFoundError(
        "The docker CLI could not be found on PATH or in any standard install "
        "location. Install Docker Desktop, or start the backend from a shell "
        "where `docker --version` works."
    )


def _run_docker(docker_args: list[str], timeout: int) -> tuple[bytes, bytes, int | None, bool]:
    # argv[0] is the literal "docker" placeholder the caller built; swap in the
    # resolved absolute path.
    docker_args = [_docker_binary(), *docker_args[1:]]
    try:
        proc = subprocess.run(docker_args, capture_output=True, timeout=timeout)
        return proc.stdout, proc.stderr, proc.returncode, False
    except subprocess.TimeoutExpired:
        return b"", b"Execution timed out and was terminated.", None, True


async def run_submission(
    code: str,
    input_files: dict[str, bytes | str] | None = None,
    image: str | None = None,
    submission_filename: str = "submission.py",
) -> SandboxResult:
    """
    Runs `code` as `submission_filename` inside a locked-down container.
    `input_files` are written into the workspace before the container starts
    (e.g. {"dataset.csv": csv_bytes}) so the student's code can read them.
    `image` overrides settings.sandbox_image for this call (e.g. the
    frontend sandbox image). The caller is responsible for reading back any
    output.* files from result.workdir and MUST clean up the workdir when
    done (see cleanup()).
    """
    workdir = Path(tempfile.mkdtemp(prefix="sandbox_"))
    try:
        (workdir / submission_filename).write_text(code, encoding="utf-8")
        for name, content in (input_files or {}).items():
            path = workdir / name
            if isinstance(content, bytes):
                path.write_bytes(content)
            else:
                path.write_text(content, encoding="utf-8")

        docker_args = [
            "docker", "run", "--rm",
            "--network=none",
            f"--memory={settings.sandbox_memory_limit}",
            f"--cpus={settings.sandbox_cpu_limit}",
            "--pids-limit=64",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            "-v", f"{workdir}:/workspace",
            image or settings.sandbox_image,
        ]

        # subprocess.run in a worker thread, not asyncio.create_subprocess_exec:
        # asyncio's subprocess transport requires a ProactorEventLoop on
        # Windows, which uvicorn does not use by default (it raises
        # NotImplementedError under the SelectorEventLoop uvicorn installs).
        # subprocess.run doesn't touch asyncio's transport machinery at all,
        # so it works under any event loop.
        stdout_b, stderr_b, exit_code, timed_out = await asyncio.to_thread(
            _run_docker, docker_args, settings.sandbox_timeout_seconds
        )

        return SandboxResult(
            stdout=stdout_b.decode("utf-8", errors="replace"),
            stderr=stderr_b.decode("utf-8", errors="replace"),
            exit_code=exit_code,
            timed_out=timed_out,
            workdir=workdir,
        )
    except Exception:
        logger.exception("docker sandbox run failed, cleaning up workdir=%s", workdir)
        shutil.rmtree(workdir, ignore_errors=True)
        raise
