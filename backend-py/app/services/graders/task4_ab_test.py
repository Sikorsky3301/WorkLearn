"""Grades Task 4 — A/B Test Analysis. Expects output.json with per-group
means, a p-value, and a ship/no-ship recommendation — checked against the
server-computed reference, never against printed text."""
from app.services.graders import finalize, try_parse_json, within_tolerance


def grade(output_json: bytes | None, reference: dict) -> dict:
    checks = []
    data = try_parse_json(output_json)

    if data is None:
        checks.append({"id": "output_exists", "label": "output.json was produced and is valid JSON", "points": 0, "pass": False})
        return finalize(checks, {"error": "No valid output.json found"})

    checks.append({"id": "output_exists", "label": "output.json was produced and is valid JSON", "points": 15, "pass": True})

    ref_means = reference["mean_revenue_by_group"]
    means_ok = True
    for group in ("control", "variant"):
        val = data.get(f"mean_{group}")
        if not (isinstance(val, (int, float)) and group in ref_means and within_tolerance(val, ref_means[group], 0.05)):
            means_ok = False
    checks.append({"id": "group_means", "label": "Control/variant mean revenue matches (within 5%)", "points": 35, "pass": means_ok})

    p_value = data.get("p_value")
    p_ok = isinstance(p_value, (int, float)) and 0 <= p_value <= 1
    checks.append({"id": "p_value", "label": "A valid p-value (0–1) is reported", "points": 25, "pass": p_ok})

    recommendation = data.get("recommendation")
    rec_ok = isinstance(recommendation, str) and recommendation.strip().lower() in ("ship", "no-ship", "no ship", "hold")
    checks.append({"id": "recommendation", "label": "A clear ship / no-ship recommendation is given", "points": 25, "pass": rec_ok})

    return finalize(checks, {"submitted": data})
