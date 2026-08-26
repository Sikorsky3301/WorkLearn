"""Graders for the four Data Analyst tasks added when the simulation went from
five tasks to nine (three per week, matching the Frontend Developer sim).

    task 2  Data Quality Report        output.json
    task 4  Channel & Country          output.json
    task 5  Monthly Trend & Growth     output.json
    task 7  Cohort Retention           output.json

Same contract as the original four (task1_cleaning.py etc): read the artifact,
never stdout; compare every number to a reference the server recomputed from
the student's own seeded dataset; return through `finalize()`.

TOLERANCES are chosen per field rather than globally. A count of duplicate
order ids is exact — there is one right answer and pandas will produce it — so
it is graded exactly. A revenue total depends on whether the student treats a
missing discount as zero, so it gets room. Grading a judgement call to three
decimal places teaches students to reverse-engineer the grader instead of
doing the analysis.
"""
from app.services.graders import finalize, try_parse_json, within_tolerance


def _require_json(data, points_when_valid):
    """Shared preamble. Returns (checks, ok)."""
    if data is None:
        return [{"id": "output_exists", "label": "output.json was produced and is valid JSON",
                 "points": 0, "pass": False}], False
    return [{"id": "output_exists", "label": "output.json was produced and is valid JSON",
             "points": points_when_valid, "pass": True}], True


def _exact(checks, data, key, label, points, expected):
    """A count with exactly one right answer."""
    actual = data.get(key)
    ok = isinstance(actual, (int, float)) and not isinstance(actual, bool) and int(actual) == int(expected)
    checks.append({"id": key, "label": label, "points": points, "pass": ok})


def _close(checks, data, key, label, points, expected, tol):
    actual = data.get(key)
    ok = (isinstance(actual, (int, float)) and not isinstance(actual, bool)
          and within_tolerance(actual, expected, tol))
    checks.append({"id": key, "label": label, "points": points, "pass": ok})


def _mapping_matches(data, key, reference, tol, min_hit_ratio=0.6):
    """A dict-valued answer (revenue by country, AOV by channel…).

    Passing needs most keys right, not all: the reference keeps rows a careful
    student might legitimately exclude, and demanding a perfect match would
    grade the exclusion decision rather than the aggregation.
    """
    submitted = data.get(key) if isinstance(data.get(key), dict) else {}
    if not reference:
        return False
    hits = sum(
        1 for k, v in reference.items()
        if k in submitted and isinstance(submitted[k], (int, float))
        and within_tolerance(submitted[k], v, tol)
    )
    return hits >= len(reference) * min_hit_ratio


# ── Task 2 · Data Quality Report ─────────────────────────────────────────────

def grade_quality_report(output_json: bytes | None, reference: dict) -> dict:
    """Every figure here is an exact count off the RAW file. There is no
    judgement in counting duplicates, so there is no tolerance either."""
    data = try_parse_json(output_json)
    checks, ok = _require_json(data, 10)
    if not ok:
        return finalize(checks, {"error": "No valid output.json found"})

    _exact(checks, data, "total_rows", "Total row count matches the raw file", 10, reference["total_rows"])
    _exact(checks, data, "duplicate_order_ids", "Duplicate order_id count is exact", 15, reference["duplicate_order_ids"])
    _exact(checks, data, "negative_quantity_rows", "Negative-quantity (return) rows counted", 15, reference["negative_quantity_rows"])
    _exact(checks, data, "zero_price_rows", "Zero-price (promo) rows counted", 10, reference["zero_price_rows"])
    _exact(checks, data, "discount_over_one_rows", "Rows with discount_pct above 1 counted", 15, reference["discount_over_one_rows"])
    _exact(checks, data, "missing_channel_rows", "Rows with a missing channel counted", 10, reference["missing_channel_rows"])
    # Dates are the one figure with slack: a student who supplies a better
    # format string than `mixed` legitimately parses a few more.
    _close(checks, data, "unparseable_dates", "Unparseable dates counted (within 10%)", 15,
           reference["unparseable_dates"], 0.10)

    return finalize(checks, {"submitted": data})


# ── Task 4 · Channel & Country Performance ───────────────────────────────────

def grade_channel_country(output_json: bytes | None, reference: dict) -> dict:
    data = try_parse_json(output_json)
    checks, ok = _require_json(data, 10)
    if not ok:
        return finalize(checks, {"error": "No valid output.json found"})

    checks.append({
        "id": "by_country", "label": "Revenue by country matches (within 5%)", "points": 25,
        "pass": _mapping_matches(data, "by_country", reference["by_country"], 0.05),
    })
    checks.append({
        "id": "aov_by_channel", "label": "AOV by channel matches (within 5%)", "points": 25,
        "pass": _mapping_matches(data, "aov_by_channel", reference["aov_by_channel"], 0.05),
    })

    top = data.get("top_country")
    checks.append({
        "id": "top_country", "label": "Highest-revenue country identified", "points": 15,
        "pass": isinstance(top, str) and top.strip().upper() == reference["top_country"].upper(),
    })

    # The point of the task: 'ZZ' is not a country. A student who reports it as
    # a market has aggregated correctly and analysed nothing.
    flagged = data.get("invalid_country_code")
    checks.append({
        "id": "invalid_country", "label": "The invalid country code was flagged", "points": 25,
        "pass": isinstance(flagged, str) and flagged.strip().upper() == reference["invalid_country_code"],
    })

    return finalize(checks, {"submitted": data})


# ── Task 5 · Monthly Trend & Growth ──────────────────────────────────────────

def grade_monthly_trend(output_json: bytes | None, reference: dict) -> dict:
    data = try_parse_json(output_json)
    checks, ok = _require_json(data, 10)
    if not ok:
        return finalize(checks, {"error": "No valid output.json found"})

    checks.append({
        "id": "by_month", "label": "Monthly revenue matches (within 5%)", "points": 30,
        "pass": _mapping_matches(data, "by_month", reference["by_month"], 0.05),
    })
    _exact(checks, data, "month_count", "Every month in the data is present", 15, reference["month_count"])

    best = data.get("best_month")
    checks.append({
        "id": "best_month", "label": "Strongest month identified", "points": 20,
        "pass": isinstance(best, str) and best.strip() == reference["best_month"],
    })

    # Growth is a rate, and a rate near zero makes a percentage tolerance
    # meaningless — so this is an absolute band, not a relative one.
    growth = data.get("avg_mom_growth")
    checks.append({
        "id": "avg_mom_growth", "label": "Average month-on-month growth is right (±2 points)", "points": 25,
        "pass": (isinstance(growth, (int, float)) and not isinstance(growth, bool)
                 and abs(float(growth) - reference["avg_mom_growth"]) <= 0.02),
    })

    return finalize(checks, {"submitted": data})


# ── Task 7 · Cohort Retention ────────────────────────────────────────────────

def grade_cohort_retention(output_json: bytes | None, reference: dict) -> dict:
    data = try_parse_json(output_json)
    checks, ok = _require_json(data, 10)
    if not ok:
        return finalize(checks, {"error": "No valid output.json found"})

    # 10% rather than exact: this count moves depending on whether the student
    # excludes blank customer_ids, which the brief asks for but which a
    # reasonable person might handle slightly differently.
    _close(checks, data, "customer_count", "Customer count is consistent (within 10%)", 15,
           reference["customer_count"], 0.10)
    _close(checks, data, "repeat_customers", "Repeat customers counted (within 10%)", 20,
           reference["repeat_customers"], 0.10)

    rate = data.get("repeat_rate")
    checks.append({
        "id": "repeat_rate", "label": "Repeat rate is right (±3 points)", "points": 25,
        "pass": (isinstance(rate, (int, float)) and not isinstance(rate, bool)
                 # Accept a fraction (0.31) or a percentage (31) — both are
                 # defensible readings of "rate", and which one was meant is
                 # not what this task is testing.
                 and (abs(float(rate) - reference["repeat_rate"]) <= 0.03
                      or abs(float(rate) / 100 - reference["repeat_rate"]) <= 0.03)),
    })

    checks.append({
        "id": "cohort_sizes", "label": "Cohort sizes by first-order month match (within 10%)", "points": 30,
        "pass": _mapping_matches(data, "cohort_sizes", reference["cohort_sizes"], 0.10),
    })

    return finalize(checks, {"submitted": data})
