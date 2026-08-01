"""
Pure-logic tests for the no-code grading DSL (app/services/graders/declarative_rules.py)
— used by admin-authored code_sandbox tasks with grading_strategy=="declarative_rules".
No DB, no HTTP — just evaluate() against synthetic submitted JSON.
"""
import json

from app.services.graders.declarative_rules import evaluate


def _output(**kwargs) -> bytes:
    return json.dumps(kwargs).encode()


def test_invalid_json_scores_zero():
    result = evaluate(b"not json{{{", rules=[{"field": "x", "op": "equals", "expected": 1, "points": 100}])
    assert result["score"] == 0
    assert result["checks"][0]["pass"] is False


def test_equals_pass_and_fail():
    rules = [{"field": "total", "op": "equals", "expected": 42, "points": 100}]
    assert evaluate(_output(total=42), rules)["score"] == 100
    assert evaluate(_output(total=41), rules)["score"] == 0


def test_equals_case_insensitive_string():
    rules = [{"field": "status", "op": "equals", "expected": "Done", "case_sensitive": False, "points": 100}]
    assert evaluate(_output(status="done"), rules)["score"] == 100


def test_tolerance_within_and_outside_band():
    rules = [{"field": "revenue", "op": "tolerance", "expected": 1000, "tolerance_pct": 0.05, "points": 100}]
    assert evaluate(_output(revenue=1030), rules)["score"] == 100   # 3% off, within 5%
    assert evaluate(_output(revenue=1100), rules)["score"] == 0     # 10% off, outside 5%


def test_range_inclusive_bounds():
    rules = [{"field": "score", "op": "range", "min": 0, "max": 100, "points": 100}]
    assert evaluate(_output(score=100), rules)["score"] == 100
    assert evaluate(_output(score=101), rules)["score"] == 0


def test_regex_match():
    rules = [{"field": "email", "op": "regex", "pattern": r"^[^@]+@[^@]+\.[^@]+$", "points": 100}]
    assert evaluate(_output(email="a@b.com"), rules)["score"] == 100
    assert evaluate(_output(email="not-an-email"), rules)["score"] == 0


def test_array_contains():
    rules = [{"field": "tags", "op": "array_contains", "contains": ["sql", "python"], "points": 100}]
    assert evaluate(_output(tags=["sql", "python", "excel"]), rules)["score"] == 100
    assert evaluate(_output(tags=["sql"]), rules)["score"] == 0


def test_row_count_min_and_range():
    min_rule = [{"field": "rows", "op": "row_count_min", "min": 3, "points": 100}]
    assert evaluate(_output(rows=[1, 2, 3]), min_rule)["score"] == 100
    assert evaluate(_output(rows=[1]), min_rule)["score"] == 0

    range_rule = [{"field": "rows", "op": "row_count_range", "min": 2, "max": 4, "points": 100}]
    assert evaluate(_output(rows=[1, 2, 3]), range_rule)["score"] == 100
    assert evaluate(_output(rows=[1, 2, 3, 4, 5]), range_rule)["score"] == 0


def test_missing_field_fails_clearly_not_silently():
    rules = [{"field": "does_not_exist", "op": "equals", "expected": 1, "points": 100}]
    result = evaluate(_output(other=1), rules)
    assert result["score"] == 0
    assert "not found" in result["checks"][0]["detail"]


def test_partial_credit_across_multiple_rules():
    rules = [
        {"field": "a", "op": "equals", "expected": 1, "points": 50},
        {"field": "b", "op": "equals", "expected": 2, "points": 50},
    ]
    result = evaluate(_output(a=1, b=999), rules)
    assert result["score"] == 50
    assert result["checks"][0]["pass"] is True
    assert result["checks"][1]["pass"] is False
