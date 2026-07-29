"""Grades Task 3 — RFM Segmentation. Expects output.json with a per-customer
segment assignment. Checked against server-computed reference aggregates —
never against printed text."""
from app.services.graders import finalize, try_parse_json, within_tolerance


def grade(output_json: bytes | None, reference: dict) -> dict:
    checks = []
    data = try_parse_json(output_json)

    if data is None:
        checks.append({"id": "output_exists", "label": "output.json was produced and is valid JSON", "points": 0, "pass": False})
        return finalize(checks, {"error": "No valid output.json found"})

    checks.append({"id": "output_exists", "label": "output.json was produced and is valid JSON", "points": 15, "pass": True})

    customers = data.get("customers")
    has_segments = (
        isinstance(customers, list) and len(customers) > 0
        and all(isinstance(c, dict) and "segment" in c for c in customers[:20])
    )
    checks.append({"id": "has_segments", "label": "Each customer has a segment label", "points": 25, "pass": has_segments})

    distinct_segments = len({c.get("segment") for c in customers}) if isinstance(customers, list) else 0
    multi_segment_ok = distinct_segments >= 2
    checks.append({"id": "multi_segment", "label": "Customers are split across multiple segments (not all one bucket)", "points": 20, "pass": multi_segment_ok})

    cust_count = len(customers) if isinstance(customers, list) else 0
    count_ok = within_tolerance(cust_count, reference["customer_count"], 0.15)
    checks.append({"id": "customer_count", "label": "Customer count is consistent with the dataset", "points": 20, "pass": count_ok})

    total_monetary = data.get("total_monetary")
    monetary_ok = isinstance(total_monetary, (int, float)) and within_tolerance(total_monetary, reference["total_monetary"], 0.05)
    checks.append({"id": "total_monetary", "label": "Total customer monetary value matches (within 5%)", "points": 20, "pass": monetary_ok})

    return finalize(checks, {"customer_count": cust_count})
