"""
Graders — one module per simulation task. Every grader takes the sandbox's
OUTPUT ARTIFACT (a file the student's code actually wrote) plus a reference
solution computed server-side from the same seeded dataset, and returns:

    {"score": int, "checks": [{"id", "label", "points", "pass"}], "details": {...}}

Never grade printed stdout — only the artifact. This dict is stored directly
as TaskCompletion.rubric_rating; `score` becomes TaskCompletion.score.
"""
import json
import math


def within_tolerance(actual: float, expected: float, pct: float = 0.02) -> bool:
    if expected == 0:
        return abs(actual) < 1e-6
    return abs(actual - expected) / abs(expected) <= pct


def score_from_checks(checks: list[dict]) -> int:
    return sum(c["points"] for c in checks if c["pass"])


def try_parse_json(raw: bytes | None) -> dict | None:
    if raw is None:
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception:
        return None


def to_native(value):
    """Recursively convert numpy/pandas scalar types to native Python types,
    and NaN/Infinity floats to None. pandas/numpy comparisons (e.g.
    Series.max() <= x, Series.all()) return numpy.bool_/numpy.float64/etc,
    which the JSON column can't serialize — and messy source data (the whole
    point of Task 1) produces real NaN cells (e.g. blank order_date), which
    Starlette's JSONResponse rejects outright (allow_nan=False)."""
    if isinstance(value, dict):
        return {k: to_native(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_native(v) for v in value]
    if hasattr(value, "item"):  # numpy scalar (bool_, int64, float64, ...)
        value = value.item()
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def finalize(checks: list[dict], details: dict | None = None) -> dict:
    """Every grader should return through this — guarantees pass/points/details
    are plain JSON-serializable Python types before hitting the DB."""
    clean_checks = [
        {"id": c["id"], "label": c["label"], "points": int(c["points"]), "pass": bool(c["pass"])}
        for c in checks
    ]
    return {
        "score": score_from_checks(clean_checks),
        "checks": clean_checks,
        "details": to_native(details or {}),
    }
