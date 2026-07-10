"""
Kubernetes sandbox runner — each submission becomes a one-shot Job in the
locked-down `worklearn-sandbox` namespace, so the cluster (not the backend
host) schedules, caps, and reaps every concurrent user's container.

Files are exchanged through a directory shared between the backend pod and
the sandbox pods: the backend mounts the node path `sandbox_hostpath_dir`
at `sandbox_shared_dir`, creates a per-submission subdir there, and each Job
hostPath-mounts that same subdir at /workspace (single-node assumption — see
k8s/README.md). stdout/stderr are captured as files in the workdir via a
shell redirect so the two streams stay separate (pod logs would merge them).
As with the docker runner, nothing here trusts stdout for grading.
"""
import asyncio
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path

from app.config import settings
from app.services.sandbox_runners.base import SandboxResult

_POLL_INTERVAL = 0.3

_batch_api = None
_core_api = None


def _apis():
    global _batch_api, _core_api
    if _batch_api is None:
        from kubernetes import client, config
        try:
            config.load_incluster_config()
        except config.ConfigException:
            # Running on the host against the cluster (dev) — use ~/.kube/config
            config.load_kube_config()
        _batch_api = client.BatchV1Api()
        _core_api = client.CoreV1Api()
    return _batch_api, _core_api


def _k8s_memory(limit: str) -> str:
    """Docker-style '256m'/'1g' → K8s '256Mi'/'1Gi'. In K8s, a bare 'm'
    suffix means millibytes, so passing the docker value through would be
    catastrophic. Values already in K8s form pass through unchanged."""
    if limit.endswith(("Ki", "Mi", "Gi")):
        return limit
    if limit[-1] in ("m", "M"):
        return limit[:-1] + "Mi"
    if limit[-1] in ("g", "G"):
        return limit[:-1] + "Gi"
    return limit


def _job_manifest(job_name: str, workdir_name: str) -> dict:
    memory = _k8s_memory(settings.sandbox_memory_limit)
    cpu = settings.sandbox_cpu_limit  # K8s accepts decimal cpu quantities ("0.5")
    resources = {"memory": memory, "cpu": cpu}
    return {
        "apiVersion": "batch/v1",
        "kind": "Job",
        "metadata": {"name": job_name, "labels": {"app": "worklearn-sandbox"}},
        "spec": {
            "backoffLimit": 0,
            # Backstops only — the runner enforces the real timeout and deletes
            # the Job itself. activeDeadlineSeconds includes scheduling time,
            # so it must exceed the execution timeout.
            "ttlSecondsAfterFinished": 300,
            "activeDeadlineSeconds": settings.sandbox_timeout_seconds + 15,
            "template": {
                "metadata": {"labels": {"app": "worklearn-sandbox"}},
                "spec": {
                    "restartPolicy": "Never",
                    # Student code must not be able to reach the K8s API or
                    # discover cluster services (Docker Desktop's CNI does not
                    # enforce NetworkPolicy, so these are the real mitigations).
                    "automountServiceAccountToken": False,
                    "enableServiceLinks": False,
                    "dnsPolicy": "Default",
                    "containers": [
                        {
                            "name": "sandbox",
                            "image": settings.sandbox_image,
                            "imagePullPolicy": "Never",
                            "command": [
                                "/bin/sh", "-c",
                                "exec python /opt/sandbox/entrypoint.py"
                                " > /workspace/.sandbox_stdout"
                                " 2> /workspace/.sandbox_stderr",
                            ],
                            "resources": {"requests": resources, "limits": resources},
                            "securityContext": {
                                "runAsUser": 10001,
                                "runAsNonRoot": True,
                                "allowPrivilegeEscalation": False,
                                "capabilities": {"drop": ["ALL"]},
                                "seccompProfile": {"type": "RuntimeDefault"},
                                "readOnlyRootFilesystem": True,
                            },
                            "volumeMounts": [{"name": "workspace", "mountPath": "/workspace"}],
                        }
                    ],
                    "volumes": [
                        {
                            "name": "workspace",
                            "hostPath": {
                                "path": f"{settings.sandbox_hostpath_dir}/{workdir_name}",
                                "type": "Directory",
                            },
                        }
                    ],
                },
            },
        },
    }


async def _get_pod(job_name: str):
    _, core = _apis()
    pods = await asyncio.to_thread(
        core.list_namespaced_pod,
        settings.sandbox_namespace,
        label_selector=f"job-name={job_name}",
    )
    return pods.items[0] if pods.items else None


async def _delete_job(job_name: str) -> None:
    batch, _ = _apis()
    try:
        await asyncio.to_thread(
            batch.delete_namespaced_job,
            job_name,
            settings.sandbox_namespace,
            propagation_policy="Background",
        )
    except Exception:
        pass  # ttlSecondsAfterFinished / activeDeadlineSeconds reap stragglers


def _read_stream(workdir: Path, name: str) -> str:
    path = workdir / name
    return path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""


async def run_submission(code: str, input_files: dict[str, bytes | str] | None = None) -> SandboxResult:
    """
    Same contract as docker_runner.run_submission: caller reads output.* from
    result.workdir and MUST call cleanup() when done.
    """
    workdir = Path(tempfile.mkdtemp(prefix="sandbox_", dir=settings.sandbox_shared_dir))
    job_name = f"sandbox-{uuid.uuid4().hex[:12]}"
    try:
        # The sandbox container runs as uid 10001 and must write output files;
        # fsGroup does not apply to hostPath volumes, so open up the workdir.
        os.chmod(workdir, 0o777)
        (workdir / "submission.py").write_text(code, encoding="utf-8")
        for name, content in (input_files or {}).items():
            path = workdir / name
            if isinstance(content, bytes):
                path.write_bytes(content)
            else:
                path.write_text(content, encoding="utf-8")
            os.chmod(path, 0o644)

        batch, _ = _apis()
        await asyncio.to_thread(
            batch.create_namespaced_job,
            settings.sandbox_namespace,
            _job_manifest(job_name, workdir.name),
        )

        # Phase A — scheduling/startup budget. Exceeding it is an
        # infrastructure problem (image missing, quota full), not a slow
        # student program, so it raises instead of returning timed_out.
        deadline = time.monotonic() + settings.sandbox_startup_timeout_seconds
        pod = None
        while time.monotonic() < deadline:
            pod = await _get_pod(job_name)
            if pod is not None and pod.status.phase != "Pending":
                break
            await asyncio.sleep(_POLL_INTERVAL)
        else:
            await _delete_job(job_name)
            raise RuntimeError(
                f"Sandbox job {job_name} did not start within "
                f"{settings.sandbox_startup_timeout_seconds}s "
                f"(pod phase: {pod.status.phase if pod else 'not created'})"
            )

        # Phase B — execution budget, mirrors the docker runner's 15s that
        # measures run time, not scheduling.
        deadline = time.monotonic() + settings.sandbox_timeout_seconds
        while pod.status.phase not in ("Succeeded", "Failed"):
            if time.monotonic() >= deadline:
                await _delete_job(job_name)
                return SandboxResult(
                    stdout="",
                    stderr="Execution timed out and was terminated.",
                    exit_code=None,
                    timed_out=True,
                    workdir=workdir,
                )
            await asyncio.sleep(_POLL_INTERVAL)
            pod = await _get_pod(job_name)
            if pod is None:  # reaped externally (e.g. activeDeadlineSeconds)
                break

        exit_code = None
        if pod is not None and pod.status.container_statuses:
            terminated = pod.status.container_statuses[0].state.terminated
            if terminated is not None:
                exit_code = terminated.exit_code

        await _delete_job(job_name)
        return SandboxResult(
            stdout=_read_stream(workdir, ".sandbox_stdout"),
            stderr=_read_stream(workdir, ".sandbox_stderr"),
            exit_code=exit_code,
            timed_out=False,
            workdir=workdir,
        )
    except Exception:
        await _delete_job(job_name)
        shutil.rmtree(workdir, ignore_errors=True)
        raise
