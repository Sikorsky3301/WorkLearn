"""
Sandbox runner selection: SANDBOX_RUNNER=docker (default, local dev) runs
submissions via `docker run` on the host daemon; SANDBOX_RUNNER=kubernetes
launches each submission as a Kubernetes Job (in-cluster deployment).
"""
from app.core.config import settings
from app.services.sandbox_runners.base import SandboxResult

__all__ = ["SandboxResult", "get_runner"]


def get_runner():
    if settings.sandbox_runner == "kubernetes":
        from app.services.sandbox_runners import k8s_runner
        return k8s_runner
    from app.services.sandbox_runners import docker_runner
    return docker_runner
