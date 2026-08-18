"""Server-graded assessments.

Two endpoints per task:

    GET  /api/enrollments/{id}/tasks/{task_id}/assessment   questions, no answers
    POST /api/enrollments/{id}/tasks/{task_id}/assessment   answers in, result out

WHY THIS EXISTS INSTEAD OF REUSING `post_task_quiz`
---------------------------------------------------
The existing quiz path grades in the browser, which means the correct answers
have to be shipped to the browser to do it. That is a reasonable trade for a
low-stakes knowledge check, and it stays exactly as it is for the sims that use
it. It is not a reasonable trade for something called an assessment — least of
all a 50-question final that gates a certificate.

So `config.assessment` is listed in secret_config_keys for both `code_sandbox`
and `quiz` (app/services/task_types.py) and never appears in the public
simulation payload at all. The GET below is the only way to see the questions,
and it strips `correct` and `explanation` on the way out. Those are returned by
the POST, after the attempt has been submitted and can no longer be changed.

SCORING
-------
Every question is worth the same. The score is the percentage answered
correctly, rounded — so a 50-question final and a 5-question mini assessment
are directly comparable, and both land in the same `TaskCompletion.quiz_score`
column the roadmap already reads.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, token_user_id
from app.core.config import QUIZ_BONUS_THRESHOLD, QUIZ_BONUS_XP
from app.db.database import get_db
from app.models import Enrollment, TaskCompletion, User, XpLedger
from app.models.cms import SimulationTask
from app.services.simulation_completion import finalize_if_complete
from app.services.skill_engine import award_task_completion

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["assessments"])


class AssessmentSubmission(BaseModel):
    # One entry per question, in order. None means "left blank", which is
    # scored as wrong but is not the same thing as answering wrongly — the
    # response reports them separately so a student can see what they skipped.
    answers: list[int | None] = Field(default_factory=list)


async def _load(db: AsyncSession, enrollment_id: int, task_id: int, user_id: int):
    """(enrollment, task, assessment) for a task the caller is enrolled on."""
    enrollment = (await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == user_id)
    )).scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")

    task = (await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == enrollment.simulation_id,
            SimulationTask.task_index == task_id,
        )
    )).scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    assessment = (task.config or {}).get("assessment")
    if not assessment or not assessment.get("questions"):
        raise HTTPException(404, "This task has no assessment")

    return enrollment, task, assessment


@router.get("/enrollments/{enrollment_id}/tasks/{task_id}/assessment")
async def get_assessment(
    enrollment_id: int, task_id: int,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    """The questions, with the answer key removed.

    Note what is NOT sent: `correct` and `explanation`. Reading them out of a
    network response would make the whole thing pointless, so they are dropped
    here rather than merely hidden in the UI.
    """
    user_id = token_user_id(token)
    _, task, assessment = await _load(db, enrollment_id, task_id, user_id)

    completion = (await db.execute(
        select(TaskCompletion).where(
            TaskCompletion.enrollment_id == enrollment_id,
            TaskCompletion.task_id == task_id,
        )
    )).scalar_one_or_none()

    return {
        "task_id": task_id,
        "title": assessment.get("title") or task.title,
        "description": assessment.get("description", ""),
        "pass_mark": assessment.get("pass_mark", 0),
        "questions": [
            {"index": i, "question": q["question"], "options": q["options"]}
            for i, q in enumerate(assessment["questions"])
        ],
        # So the client can show "you scored 80% last time" rather than
        # pretending an already-taken assessment is fresh.
        "previous_score": completion.quiz_score if completion else None,
    }


@router.post("/enrollments/{enrollment_id}/tasks/{task_id}/assessment")
async def submit_assessment(
    enrollment_id: int, task_id: int, body: AssessmentSubmission,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    """Grades an attempt, stores the score, and returns per-question feedback."""
    user_id = token_user_id(token)
    enrollment, task, assessment = await _load(db, enrollment_id, task_id, user_id)

    questions = assessment["questions"]
    if len(body.answers) != len(questions):
        raise HTTPException(
            400,
            f"Expected {len(questions)} answers, got {len(body.answers)}. "
            "Send one entry per question, in order, using null for unanswered.",
        )

    results = []
    correct_count = 0
    for i, (question, answer) in enumerate(zip(questions, body.answers)):
        is_correct = answer is not None and answer == question["correct"]
        if is_correct:
            correct_count += 1
        results.append({
            "index": i,
            "answered": answer,
            "correct_option": question["correct"],
            "was_correct": is_correct,
            "skipped": answer is None,
            # Released now that the attempt is committed — this is the part
            # that turns a score into something worth reading.
            "explanation": question.get("explanation", ""),
        })

    score = round(correct_count / len(questions) * 100)
    pass_mark = assessment.get("pass_mark", 0)

    completion = (await db.execute(
        select(TaskCompletion).where(
            TaskCompletion.enrollment_id == enrollment_id,
            TaskCompletion.task_id == task_id,
        )
    )).scalar_one_or_none()

    # A task whose ONLY deliverable is the assessment — the closing exam.
    # Anything else (a code_sandbox ticket) has real work attached, and the
    # assessment is a follow-up to it.
    is_standalone = task.type == "quiz" or (task.config or {}).get("is_final_assessment")

    if not completion and not is_standalone:
        # Without this, submitting the mini assessment for an ungraded sandbox
        # task would fall through to award_task_completion below and mark the
        # coding task complete — awarding its full XP, recording the quiz
        # percentage as the code score, and unlocking the next task — for a
        # student who never opened the editor. Same guard the quiz-score
        # endpoint has, and for the same reason.
        raise HTTPException(409, "Submit the task before taking its assessment")

    bonus_xp = 0
    if completion:
        # The usual path: a mini assessment following a sandbox task that was
        # already graded. Only the quiz score is touched — award_task_completion
        # would re-award the base XP and overwrite rubric_rating.
        first_attempt = completion.quiz_score is None
        if first_attempt and score >= QUIZ_BONUS_THRESHOLD:
            bonus_xp = QUIZ_BONUS_XP
            db.add(XpLedger(user_id=user_id, amount=bonus_xp, source=f"task_{task_id}_assessment_bonus"))
            await db.execute(update(User).where(User.id == user_id).values(xp=User.xp + bonus_xp))
        completion.quiz_score = score
        await db.commit()
    else:
        # A standalone assessment task — the final exam. This IS the
        # completion, so it goes through the normal award path to record XP and
        # skills, and then finalizes: the final assessment is the last task in
        # the simulation, so submitting it is what issues the certificate.
        awards = await award_task_completion(
            db, user_id, enrollment_id, task_id, simulation_id=enrollment.simulation_id,
            score=score, quiz_score=score,
            rubric_rating={"score": score, "checks": [], "details": {
                "correct": correct_count, "total": len(questions), "kind": "assessment",
            }},
        )
        await finalize_if_complete(
            db, user_id=user_id, enrollment_id=enrollment_id,
            simulation_id=enrollment.simulation_id, xp_awarded=awards.get("xp_awarded"),
        )

    return {
        "score": score,
        "correct": correct_count,
        "total": len(questions),
        "pass_mark": pass_mark,
        "passed": score >= pass_mark if pass_mark else None,
        "bonus_xp": bonus_xp,
        "results": results,
    }
