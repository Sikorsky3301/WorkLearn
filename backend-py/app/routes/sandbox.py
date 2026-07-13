"""
Sandbox submission endpoint. This is the ONLY place a task's score is
computed for sandboxed tasks — the client submits code (or text for Task 5
of da-job-sim), the server runs it (Docker), and grades the ARTIFACT the run
produced against a server-computed/hidden ground truth. The client never
supplies a trusted score.

Every lookup here is keyed by (simulation_id, task_id), not bare task_id —
different simulations reuse task numbers 1-5, so a bare task_id key would
silently route one simulation's submission through another's grader.
"""
import base64
import io
import json
import math

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.auth import get_current_user
from app.models import Enrollment
from app.services import sandbox, artifacts
from app.services.dataset import generate_dataset, compute_reference_solution, seed_from_enrollment
from app.services.graders import task1_cleaning, task2_report, task3_segmentation, task4_ab_test, task5_brief
from app.services.graders import (
    frontend_task1, frontend_task2, frontend_task3, frontend_task4, frontend_task5,
)
from app.services.skill_engine import award_task_completion

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])

# (simulation_id, task_id) -> (input filename, output filename the grader reads).
# For da-job-sim the input filename is the dataset the sandbox is given; for
# frontend-dev-sim it's the filename the student's own code is written as
# (there's no separate "dataset" input — see SIM_GRADERS / submit() below).
SIM_TASK_IO = {
    "da-job-sim": {
        1: ("dataset.csv", "output.csv"),
        2: ("dataset.csv", "output.json"),
        3: ("dataset.csv", "output.json"),
        4: ("dataset.csv", "output.json"),
    },
    "frontend-dev-sim": {
        1: ("submission.html", "output.json"),
        2: ("submission.html", "output.json"),
        3: ("submission.js", "output.json"),
        4: ("submission.jsx", "output.json"),
        5: ("submission.jsx", "output.json"),
    },
}

SIM_GRADERS = {
    "da-job-sim": {
        1: task1_cleaning.grade,
        2: task2_report.grade,
        3: task3_segmentation.grade,
        4: task4_ab_test.grade,
    },
    "frontend-dev-sim": {
        1: frontend_task1.grade,
        2: frontend_task2.grade,
        3: frontend_task3.grade,
        4: frontend_task4.grade,
        5: frontend_task5.grade,
    },
}

FILE_PAGE_SIZE = 50
MAX_FILE_PAGE_SIZE = 200
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20MB — generous for a ~9,600-row CSV, still bounded


class SubmitBody(BaseModel):
    code: str | None = None         # sandboxed tasks, run through the sandbox
    text: str | None = None         # da-job-sim Task 5 (LLM-judged brief)
    output_csv: str | None = None   # da-job-sim alternative to `code`: a student-uploaded
                                     # output file (base64), graded directly — no sandbox run
    dry_run: bool = False           # "Run" preview — grades the code but never persists completion/XP


async def _get_owned_enrollment(enrollment_id: str, user_id: str, db: AsyncSession) -> Enrollment:
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == user_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    return enrollment


def _resolve_input_csv(enrollment_id: str, task_id: int) -> bytes:
    """The exact dataset.csv bytes this task's sandbox will see — the raw
    seeded dataset for Task 1, or the student's own Task 1 cleaned output for 2-4.
    da-job-sim only."""
    prior_output = artifacts.load_artifact(enrollment_id, 1, "output.csv") if task_id > 1 else None
    if prior_output is not None:
        return prior_output
    seed = seed_from_enrollment(enrollment_id)
    return generate_dataset(seed).to_csv(index=False).encode("utf-8")


def _csv_file_entry(name: str, csv_bytes: bytes) -> dict:
    df = pd.read_csv(io.BytesIO(csv_bytes))
    # Task 1's raw dataset is deliberately messy (missing values are the point
    # of "clean the data"), so df.head() can contain NaN. pandas' own to_json
    # converts NaN/Infinity to JSON null; plain .to_dict() leaves them as
    # Python float('nan'), which Starlette's JSONResponse rejects outright.
    # This is a lightweight teaser for the Explorer's initial paint — the full
    # dataset (thousands of rows) is fetched page by page via /files/{name}/rows.
    rows = json.loads(df.head(10).to_json(orient="records"))
    return {
        "name": name, "kind": "csv", "editable": False,
        "columns": list(df.columns), "rows": rows,
        "row_count": len(df),
    }


def _paginate_csv(csv_bytes: bytes, page: int, page_size: int) -> dict:
    df = pd.read_csv(io.BytesIO(csv_bytes))
    total_rows = len(df)
    page_size = max(1, min(page_size, MAX_FILE_PAGE_SIZE))
    total_pages = max(1, math.ceil(total_rows / page_size))
    page = max(1, min(page, total_pages))
    start = (page - 1) * page_size
    chunk = df.iloc[start:start + page_size]
    return {
        "columns": list(df.columns),
        "rows": json.loads(chunk.to_json(orient="records")),
        "row_count": total_rows,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# Frontend-dev-sim's editable filename per task (extension drives the Explorer
# icon/Monaco language client-side) — kept alongside SIM_TASK_IO's (filename,
# output) tuples so both dicts stay structurally parallel across simulations.
def _frontend_kind(filename: str) -> str:
    if filename.endswith(".html"):
        return "html"
    if filename.endswith((".js", ".jsx")):
        return "javascript"
    return "text"


@router.get("/{enrollment_id}/tasks/{task_id}/files")
async def list_files(
    enrollment_id: str, task_id: int,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    """Directory listing for the sandbox's Explorer sidebar — real file
    previews, not decoration: dataset.csv reflects the exact bytes the Docker
    container will read, and output.* reflects the last graded artifact."""
    user_id = token["sub"]
    enrollment = await _get_owned_enrollment(enrollment_id, user_id, db)
    sim_id = enrollment.simulation_id
    task_io = SIM_TASK_IO.get(sim_id, {})

    if task_id not in task_io:
        return {"files": [{"name": "submission.py", "kind": "python", "editable": True}]}

    if sim_id == "frontend-dev-sim":
        submission_filename, _ = task_io[task_id]
        return {"files": [{"name": submission_filename, "kind": _frontend_kind(submission_filename), "editable": True}]}

    # da-job-sim: dataset.csv preview + last graded output.*
    files = [{"name": "submission.py", "kind": "python", "editable": True}]

    try:
        input_bytes = _resolve_input_csv(enrollment_id, task_id)
        files.append(_csv_file_entry("dataset.csv", input_bytes))
    except Exception:
        pass  # dataset not ready yet — submission.py is still usable

    _, output_name = task_io[task_id]
    output_bytes = artifacts.load_artifact(enrollment_id, task_id, output_name)
    if output_bytes is not None:
        if output_name == "output.csv":
            files.append(_csv_file_entry("output.csv", output_bytes))
        else:
            try:
                files.append({"name": "output.json", "kind": "json", "editable": False, "content": json.loads(output_bytes)})
            except Exception:
                pass

    return {"files": files}


def _resolve_csv_by_name(enrollment_id: str, task_id: int, filename: str) -> bytes:
    """Resolves either of the two CSV files the Explorer can show to their
    actual bytes — shared by pagination and download, which serve the same
    underlying data two different ways. da-job-sim only (frontend-dev-sim has
    no CSV files, so any filename here 404s via the fallback below)."""
    if filename == "dataset.csv":
        try:
            return _resolve_input_csv(enrollment_id, task_id)
        except Exception:
            raise HTTPException(404, "dataset.csv is not ready yet")
    if filename == "output.csv":
        io_map = SIM_TASK_IO.get("da-job-sim", {})
        if io_map.get(task_id, (None, None))[1] != "output.csv":
            raise HTTPException(404, "No output.csv for this task")
        csv_bytes = artifacts.load_artifact(enrollment_id, task_id, "output.csv")
        if csv_bytes is None:
            raise HTTPException(404, "output.csv has not been submitted yet")
        return csv_bytes
    raise HTTPException(404, "Unknown or non-CSV file")


@router.get("/{enrollment_id}/tasks/{task_id}/files/{filename}/rows")
async def file_rows(
    enrollment_id: str, task_id: int, filename: str,
    page: int = 1, page_size: int = FILE_PAGE_SIZE,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    """Full, paginated access to a CSV file's rows — the Explorer's inline
    preview only ever shows the first 10 rows; this is how the student pages
    through the entire dataset (dataset.csv can be ~9,600 rows)."""
    user_id = token["sub"]
    await _get_owned_enrollment(enrollment_id, user_id, db)
    csv_bytes = _resolve_csv_by_name(enrollment_id, task_id, filename)
    return _paginate_csv(csv_bytes, page, page_size)


@router.get("/{enrollment_id}/tasks/{task_id}/files/{filename}/download")
async def download_file(
    enrollment_id: str, task_id: int, filename: str,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    """Raw file download — same source data as /rows, served as an
    attachment so the student can save the dataset (or their graded output)
    to their own machine."""
    user_id = token["sub"]
    await _get_owned_enrollment(enrollment_id, user_id, db)
    csv_bytes = _resolve_csv_by_name(enrollment_id, task_id, filename)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _submit_da_job_sim(enrollment_id: str, task_id: int, body: SubmitBody, task_io: dict):
    """The original pandas/CSV pipeline — unchanged behavior, just relocated
    out of submit() so the per-simulation branches don't tangle together."""
    if task_id == 5:
        if not body.text or not body.text.strip():
            raise HTTPException(400, "text is required for this task")
        grade_result = await task5_brief.grade(body.text, {})
        artifacts.save_artifact(enrollment_id, task_id, "brief.txt", body.text.encode("utf-8"))
        return grade_result, "brief.txt", None

    if task_id not in task_io:
        raise HTTPException(404, "No sandbox for this task")

    # The reference solution is always computed from the canonical seeded
    # dataset, regardless of what the student's own code actually reads.
    seed = seed_from_enrollment(enrollment_id)
    df = generate_dataset(seed)

    # Tasks 2-4 all analyze the CLEANED dataset — i.e. the student's own
    # Task 1 output — never the raw one.
    input_bytes = _resolve_input_csv(enrollment_id, task_id)
    input_name, output_name = task_io[task_id]

    if body.output_csv:
        # Student uploaded a pre-made output file instead of writing code —
        # skip the sandbox entirely and grade the upload directly. Same trust
        # model as the code path: never grade printed stdout, only the
        # artifact, and an upload IS the artifact.
        try:
            output_bytes = base64.b64decode(body.output_csv, validate=True)
        except Exception:
            raise HTTPException(400, "Uploaded file is not valid base64")
        if len(output_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(400, "Uploaded file is too large")
        stdout, stderr, timed_out = "", "", False
    else:
        if not body.code or not body.code.strip():
            raise HTTPException(400, "code is required for this task")
        result = await sandbox.run_submission(body.code, input_files={input_name: input_bytes})
        try:
            output_bytes = sandbox.read_output(result, output_name)
            stdout, stderr, timed_out = result.stdout, result.stderr, result.timed_out
        finally:
            sandbox.cleanup(result.workdir)

    reference = compute_reference_solution(task_id, df)
    grade_result = SIM_GRADERS["da-job-sim"][task_id](output_bytes, reference)
    grade_result["details"]["stdout"] = stdout[-2000:]
    grade_result["details"]["stderr"] = stderr[-2000:]
    grade_result["details"]["timed_out"] = timed_out
    return grade_result, output_name, output_bytes


async def _submit_frontend_dev_sim(enrollment_id: str, task_id: int, body: SubmitBody, task_io: dict, graders: dict):
    """Runs the student's HTML/CSS/JS/React file against a hidden Jest test
    spec inside the frontend sandbox image. Same trust model as da-job-sim:
    the sandbox's stdout is shown to the student for debugging, but grading
    only ever reads the Jest JSON report the container wrote to /workspace."""
    from app.services.frontend_specs import FRONTEND_TEST_SPECS

    if task_id not in task_io or task_id not in graders:
        raise HTTPException(404, "No sandbox for this task")
    if not body.code or not body.code.strip():
        raise HTTPException(400, "code is required for this task")

    submission_filename, output_name = task_io[task_id]
    result = await sandbox.run_submission(
        body.code,
        input_files={"submission.test.js": FRONTEND_TEST_SPECS[task_id]},
        image=settings.sandbox_image_frontend,
        submission_filename=submission_filename,
    )
    try:
        output_bytes = sandbox.read_output(result, output_name)
        stdout, stderr, timed_out = result.stdout, result.stderr, result.timed_out
    finally:
        sandbox.cleanup(result.workdir)

    grade_result = graders[task_id](output_bytes, None)
    grade_result["details"]["stdout"] = stdout[-2000:]
    grade_result["details"]["stderr"] = stderr[-2000:]
    grade_result["details"]["timed_out"] = timed_out
    return grade_result, output_name, output_bytes


@router.post("/{enrollment_id}/tasks/{task_id}/submit")
async def submit(
    enrollment_id: str, task_id: int, body: SubmitBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    user_id = token["sub"]
    enrollment = await _get_owned_enrollment(enrollment_id, user_id, db)
    sim_id = enrollment.simulation_id
    task_io = SIM_TASK_IO.get(sim_id, {})
    graders = SIM_GRADERS.get(sim_id, {})

    if sim_id == "da-job-sim":
        grade_result, output_name, output_bytes = await _submit_da_job_sim(enrollment_id, task_id, body, task_io)
    elif sim_id == "frontend-dev-sim":
        grade_result, output_name, output_bytes = await _submit_frontend_dev_sim(enrollment_id, task_id, body, task_io, graders)
    else:
        raise HTTPException(404, "This simulation has no sandbox configured")

    # Only a real Submit for Grading persists the artifact — a "Run" (dry_run)
    # is a free, repeatable preview and must leave no trace, otherwise a
    # graded artifact would appear in the Explorer before the student ever
    # actually submitted anything.
    if output_bytes is not None and not body.dry_run:
        artifacts.save_artifact(enrollment_id, task_id, output_name, output_bytes)

    if body.dry_run:
        # Preview only — no completion/XP persisted, so students can re-run freely.
        return {**grade_result, "dry_run": True}

    awards = await award_task_completion(
        db, user_id, enrollment_id, task_id, simulation_id=sim_id,
        score=grade_result["score"], quiz_score=None, rubric_rating=grade_result,
    )

    return {**awards, **grade_result, "dry_run": False}
