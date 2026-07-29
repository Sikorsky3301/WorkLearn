"""Grades Task 1 — Clean the Data. Expects the sandbox to have written
output.csv. Every check runs against that file's actual contents, never
against anything the student's code printed."""
import io
import pandas as pd

from app.services.dataset import CATEGORIES
from app.services.graders import finalize


def grade(output_csv: bytes | None, reference: dict) -> dict:
    checks = []

    if output_csv is None:
        checks.append({"id": "output_exists", "label": "output.csv was produced", "points": 0, "pass": False})
        return finalize(checks, {"error": "No output.csv found"})

    try:
        df = pd.read_csv(io.BytesIO(output_csv))
    except Exception as e:
        checks.append({"id": "output_readable", "label": "output.csv is readable", "points": 0, "pass": False})
        return finalize(checks, {"error": f"Could not read output.csv: {e}"})

    checks.append({"id": "output_readable", "label": "output.csv is readable", "points": 10, "pass": True})

    # Row count sanity — duplicates removed, not gutted
    lo, hi = reference["row_count_range"]
    row_ok = "order_id" in df.columns and lo <= len(df) <= hi
    checks.append({"id": "row_count", "label": "Row count reflects de-duplication (not over/under-deleted)", "points": 15, "pass": row_ok})

    # No duplicate order_id
    dup_ok = "order_id" in df.columns and not df["order_id"].duplicated().any()
    checks.append({"id": "no_dupes", "label": "No duplicate order_id rows remain", "points": 20, "pass": dup_ok})

    # discount_pct normalized to 0-1 scale
    disc_ok = False
    if "discount_pct" in df.columns:
        vals = pd.to_numeric(df["discount_pct"], errors="coerce").dropna()
        disc_ok = len(vals) > 0 and vals.max() <= reference["max_discount_pct"] + 1e-6
    checks.append({"id": "discount_scale", "label": "discount_pct normalized to a 0–1 scale", "points": 20, "pass": disc_ok})

    # Category typos fixed
    cat_ok = False
    if "product_category" in df.columns:
        present = set(df["product_category"].dropna().unique())
        cat_ok = present.issubset(reference["categories_valid"])
    checks.append({"id": "category_typos", "label": "Category typos normalized to canonical names", "points": 20, "pass": cat_ok})

    # $99,999 outlier handled
    outlier_ok = "unit_price" not in df.columns or (
        pd.to_numeric(df["unit_price"], errors="coerce").fillna(0) < 99999
    ).all()
    checks.append({"id": "outlier_price", "label": "The $99,999 price outlier was capped or removed", "points": 15, "pass": outlier_ok})

    preview_columns = list(df.columns)
    preview_rows = df.head(8).to_dict(orient="records")
    return finalize(checks, {"row_count": len(df), "preview_columns": preview_columns, "preview_rows": preview_rows})
