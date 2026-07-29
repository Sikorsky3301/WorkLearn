"""Grades Task 2 — Sales Report. Expects the sandbox to have written
output.json with the required KPIs. Every numeric KPI is compared to the
server-computed reference solution within a tolerance — never parsed
from printed text."""
from app.services.graders import finalize, try_parse_json, within_tolerance


def grade(output_json: bytes | None, reference: dict) -> dict:
    checks = []
    data = try_parse_json(output_json)

    if data is None:
        checks.append({"id": "output_exists", "label": "output.json was produced and is valid JSON", "points": 0, "pass": False})
        return finalize(checks, {"error": "No valid output.json found"})

    checks.append({"id": "output_exists", "label": "output.json was produced and is valid JSON", "points": 10, "pass": True})

    def check_numeric(key, label, points, tol=0.02):
        actual = data.get(key)
        ok = isinstance(actual, (int, float)) and within_tolerance(actual, reference[key], tol)
        checks.append({"id": key, "label": label, "points": points, "pass": ok})

    check_numeric("total_revenue", "Total Revenue matches (within 2%)", 25)
    check_numeric("order_count", "Order Count matches", 15, tol=0.01)
    check_numeric("aov", "Average Order Value (AOV) matches (within 2%)", 20)

    by_channel = data.get("by_channel") if isinstance(data.get("by_channel"), dict) else {}
    channel_hits = sum(
        1 for k, v in reference["by_channel"].items()
        if k in by_channel and isinstance(by_channel[k], (int, float)) and within_tolerance(by_channel[k], v, 0.05)
    )
    channel_ok = len(reference["by_channel"]) > 0 and channel_hits >= len(reference["by_channel"]) * 0.6
    checks.append({"id": "by_channel", "label": "Revenue by Channel breakdown matches", "points": 15, "pass": channel_ok})

    by_category = data.get("by_category") if isinstance(data.get("by_category"), dict) else {}
    category_hits = sum(
        1 for k, v in reference["by_category"].items()
        if k in by_category and isinstance(by_category[k], (int, float)) and within_tolerance(by_category[k], v, 0.05)
    )
    category_ok = len(reference["by_category"]) > 0 and category_hits >= len(reference["by_category"]) * 0.6
    checks.append({"id": "by_category", "label": "Revenue by Category breakdown matches", "points": 15, "pass": category_ok})

    return finalize(checks, {"submitted": data})
