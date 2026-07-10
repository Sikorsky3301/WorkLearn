"""
Shared result type for sandbox runners. Whatever backend actually executes the
submission (docker CLI, Kubernetes Job), callers get the exact same shape back
and read output artifacts from `workdir`.
"""
from dataclasses import dataclass
from pathlib import Path


@dataclass
class SandboxResult:
    stdout: str
    stderr: str
    exit_code: int | None
    timed_out: bool
    workdir: Path
