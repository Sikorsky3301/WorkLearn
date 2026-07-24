"""
Declarative grading-rule evaluator for admin-authored code_sandbox tasks
(config.grading_strategy == "declarative_rules") — the no-code alternative to
the 9 registered developer graders. The student's code must write a JSON
artifact; each rule checks one field of that JSON against a static,
admin-supplied expected value (not a per-candidate randomized reference like
the registered graders use — see the builder UI's own warning about this).

Returns the same {"score", "checks", "details"} shape every other grader in
this codebase returns, so sandbox.py's submit() flow doesn't need to
special-case which grading strategy produced the result.
"""
import json
import re


def _resolve(obj, dotted_path: str):
    """Resolves 'summary.total_revenue' against a nested dict. Returns
    (value, found) — found=False (not None) distinguishes 'field is null'
    from 'field does not exist', so a missing field always fails clearly."""
    current = obj
    for key in dotted_path.split("."):
        if not isinstance(current, dict) or key not in current:
            return None, False
        current = current[key]
    return current, True


def _eval_rule(rule: dict, output: dict) -> tuple[bool, str]:
    value, found = _resolve(output, rule["field"])
    op = rule["op"]

    if not found and op not in ("row_count_min", "row_count_range"):
        return False, f"field '{rule['field']}' not found in submitted output"

    try:
        if op == "equals":
            expected = rule.get("expected")
            if isinstance(value, str) and not rule.get("case_sensitive", True):
                ok = str(value).lower() == str(expected).lower()
            else:
                ok = value == expected
            return ok, f"expected {expected!r}, got {value!r}"

        if op == "tolerance":
            expected = float(rule["expected"])
            tol_pct = float(rule.get("tolerance_pct", 0.02))
            actual = float(value)
            ok = abs(actual - expected) / max(abs(expected), 1e-9) <= tol_pct
            return ok, f"expected {expected} (±{tol_pct:.0%}), got {actual}"

        if op == "range":
            lo, hi = rule.get("min"), rule.get("max")
            actual = float(value)
            ok = (lo is None or actual >= lo) and (hi is None or actual <= hi)
            return ok, f"expected between {lo} and {hi}, got {actual}"

        if op == "regex":
            pattern = rule["pattern"]
            ok = re.search(pattern, str(value)) is not None
            return ok, f"expected to match /{pattern}/, got {value!r}"

        if op == "array_contains":
            wanted = rule.get("contains", [])
            actual_list = value if isinstance(value, list) else []
            ok = all(w in actual_list for w in wanted)
            return ok, f"expected to contain {wanted}, got {actual_list}"

        if op == "row_count_min":
            actual_list = value if found and isinstance(value, list) else []
            ok = len(actual_list) >= rule.get("min", 0)
            return ok, f"expected at least {rule.get('min', 0)} rows, got {len(actual_list)}"

        if op == "row_count_range":
            actual_list = value if found and isinstance(value, list) else []
            lo, hi = rule.get("min"), rule.get("max")
            n = len(actual_list)
            ok = (lo is None or n >= lo) and (hi is None or n <= hi)
            return ok, f"expected between {lo} and {hi} rows, got {n}"

    except (TypeError, ValueError) as e:
        return False, f"could not evaluate rule against {value!r}: {e}"

    return False, f"unknown op '{op}'"


def evaluate(output_bytes: bytes, rules: list[dict]) -> dict:
    """Same grader-function shape as task1_cleaning.grade() etc: takes the
    submitted artifact's raw bytes (always JSON for declarative-rules tasks —
    CSV-output DSL grading is out of scope, see the CMS plan) and the task's
    `config.rules` list, returns {"score","checks","details"}."""
    try:
        output = json.loads(output_bytes)
    except (json.JSONDecodeError, TypeError):
        return {
            "score": 0,
            "checks": [{"label": "Output is valid JSON", "pass": False, "detail": "Could not parse output.json"}],
            "details": {"justification": "Submission did not produce valid JSON output."},
        }

    checks = []
    earned = 0
    for rule in rules:
        ok, detail = _eval_rule(rule, output)
        if ok:
            earned += rule.get("points", 0)
        checks.append({"label": rule.get("label") or rule["field"], "pass": ok, "detail": detail})

    total_possible = sum(r.get("points", 0) for r in rules) or 100
    score = round((earned / total_possible) * 100) if total_possible else 0

    return {
        "score": score,
        "checks": checks,
        "details": {"justification": f"{sum(1 for c in checks if c['pass'])}/{len(checks)} rules passed."},
    }
