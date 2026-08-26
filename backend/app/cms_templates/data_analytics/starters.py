"""Starter code and model solutions for the four Data Analyst tasks added in
the three-week restructure.

Each STARTER is a runnable skeleton: it loads the data, names the keys the
grader looks for, and leaves the actual computation to the student. It is
deliberately runnable as-is — pressing Run before writing anything should
produce a scored result with most checks failing, not a traceback, because
"my code crashed" and "my answer is wrong" are different lessons.

Each SOLUTION is the reference implementation. verify_da_grading.py runs every
one of them through the real Docker sandbox and asserts it scores 100, and
that the matching starter scores LESS than 100 — a starter that already passes
means the task asks for nothing.
"""

# ── Task 2 · Data Quality Report ─────────────────────────────────────────────

TASK2_STARTER = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

# Every number below is a count off the RAW file — before any cleaning.
report = {
    "total_rows": 0,
    "duplicate_order_ids": 0,
    "unparseable_dates": 0,
    "negative_quantity_rows": 0,
    "zero_price_rows": 0,
    "discount_over_one_rows": 0,
    "missing_channel_rows": 0,
    "distinct_categories_raw": 0,
}

# TODO: fill each one in, then say in a comment what you would DO about it.

with open("output.json", "w") as f:
    json.dump(report, f, indent=2)

print(json.dumps(report, indent=2))
'''

TASK2_SOLUTION = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

# Dates first — `coerce` turns anything unparseable into NaT instead of
# raising, so the count on the next line is the real failure count.
parsed = pd.to_datetime(df["order_date"], errors="coerce", format="mixed")

report = {
    "total_rows": int(len(df)),
    # Rows minus distinct ids IS the number of surplus rows.
    "duplicate_order_ids": int(len(df) - df["order_id"].nunique()),
    "unparseable_dates": int(parsed.isna().sum()),
    "negative_quantity_rows": int((df["quantity"] < 0).sum()),
    "zero_price_rows": int((df["unit_price"] == 0).sum()),
    "discount_over_one_rows": int((df["discount_pct"] > 1).sum()),
    "missing_channel_rows": int(df["channel"].isna().sum()),
    "distinct_categories_raw": int(df["product_category"].nunique()),
}

with open("output.json", "w") as f:
    json.dump(report, f, indent=2)

for key, value in report.items():
    print(f"{key:26} {value:>7,}")
'''


# ── Task 4 · Channel & Country Performance ───────────────────────────────────

TASK4_STARTER = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

# Revenue for rows that represent money coming in: returns and $0 promos out.
billable = df[(df["quantity"] > 0) & (df["unit_price"] > 0)].copy()
billable["revenue"] = (
    billable["quantity"] * billable["unit_price"] * (1 - billable["discount_pct"].fillna(0))
)

out = {
    "by_country": {},        # TODO: revenue per country
    "aov_by_channel": {},    # TODO: revenue / DISTINCT ORDERS per channel
    "top_country": "",       # TODO
    "invalid_country_code": "",  # TODO: one value in `country` is not a country
}

with open("output.json", "w") as f:
    json.dump(out, f, indent=2)
print(out)
'''

TASK4_SOLUTION = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

billable = df[(df["quantity"] > 0) & (df["unit_price"] > 0)].copy()
billable["revenue"] = (
    billable["quantity"] * billable["unit_price"] * (1 - billable["discount_pct"].fillna(0))
)

by_country = billable.groupby("country")["revenue"].sum()

# AOV is per DISTINCT ORDER, not per row — an order spanning two lines must
# not count twice in the denominator.
orders = billable.groupby("channel")["order_id"].nunique()
revenue = billable.groupby("channel")["revenue"].sum()
aov_by_channel = (revenue / orders.replace(0, 1)).dropna()

# 'ZZ' is not an ISO country code. It is almost certainly the fallback the
# order form writes when the field was left blank, and it is large enough
# (a few hundred orders) to distort any per-market comparison that keeps it.
valid_iso = {"US", "CA", "UK", "AU"}
invalid = sorted(set(billable["country"].dropna()) - valid_iso)

out = {
    "by_country": {k: float(v) for k, v in by_country.items() if isinstance(k, str)},
    "aov_by_channel": {k: float(v) for k, v in aov_by_channel.items() if isinstance(k, str)},
    "top_country": str(by_country.idxmax()),
    "invalid_country_code": invalid[0] if invalid else "",
}

with open("output.json", "w") as f:
    json.dump(out, f, indent=2)

print(f"top market: {out['top_country']}")
print(f"unrecognised country code: {out['invalid_country_code']!r} "
      f"({int((billable['country'] == out['invalid_country_code']).sum()):,} orders)")
for channel, aov in sorted(aov_by_channel.items(), key=lambda kv: -kv[1]):
    print(f"  {channel:14} AOV ${aov:,.2f}")
'''


# ── Task 5 · Monthly Trend & Growth ──────────────────────────────────────────

TASK5_STARTER = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

billable = df[(df["quantity"] > 0) & (df["unit_price"] > 0)].copy()
billable["revenue"] = (
    billable["quantity"] * billable["unit_price"] * (1 - billable["discount_pct"].fillna(0))
)
billable["parsed"] = pd.to_datetime(billable["order_date"], errors="coerce", format="mixed")

out = {
    "by_month": {},         # TODO: {"2024-01": 31200.0, ...}
    "month_count": 0,       # TODO
    "best_month": "",       # TODO
    "worst_month": "",      # TODO
    "avg_mom_growth": 0.0,  # TODO: mean month-on-month change, as a fraction
}

with open("output.json", "w") as f:
    json.dump(out, f, indent=2)
print(out)
'''

TASK5_SOLUTION = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

billable = df[(df["quantity"] > 0) & (df["unit_price"] > 0)].copy()
billable["revenue"] = (
    billable["quantity"] * billable["unit_price"] * (1 - billable["discount_pct"].fillna(0))
)
billable["parsed"] = pd.to_datetime(billable["order_date"], errors="coerce", format="mixed")

# Rows whose date would not parse cannot be placed in a month. Dropping them
# here is the only defensible move — but note how many, because a month-level
# trend built on top of a big gap is not trustworthy.
undated = int(billable["parsed"].isna().sum())
dated = billable.dropna(subset=["parsed"])

by_month = (
    dated.groupby(dated["parsed"].dt.to_period("M").astype(str))["revenue"]
    .sum()
    .sort_index()
)

# sort_index() above matters: pct_change compares each month to the PREVIOUS
# ROW, so an unsorted series computes growth between unrelated months.
growth = by_month.pct_change().dropna()

out = {
    "by_month": {k: float(v) for k, v in by_month.items()},
    "month_count": int(len(by_month)),
    "best_month": str(by_month.idxmax()),
    "worst_month": str(by_month.idxmin()),
    "avg_mom_growth": float(growth.mean()) if len(growth) else 0.0,
}

with open("output.json", "w") as f:
    json.dump(out, f, indent=2)

print(f"{out['month_count']} months, {undated:,} orders dropped for an unparseable date")
print(f"best  {out['best_month']}  ${by_month.max():,.0f}")
print(f"worst {out['worst_month']}  ${by_month.min():,.0f}")
print(f"average month-on-month change: {out['avg_mom_growth']:+.1%}")
'''


# ── Task 7 · Cohort Retention ────────────────────────────────────────────────

TASK7_STARTER = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

billable = df[(df["quantity"] > 0) & (df["unit_price"] > 0)].copy()
billable["parsed"] = pd.to_datetime(billable["order_date"], errors="coerce", format="mixed")

# Some rows have a BLANK customer_id. Treating them as one customer would
# invent a single extraordinarily loyal buyer — exclude them.

out = {
    "customer_count": 0,
    "repeat_customers": 0,
    "one_time_customers": 0,
    "repeat_rate": 0.0,     # repeat / total, as a fraction
    "cohort_sizes": {},     # {"2023-06": 240, ...} by FIRST order month
    "cohort_count": 0,
}

with open("output.json", "w") as f:
    json.dump(out, f, indent=2)
print(out)
'''

TASK7_SOLUTION = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

billable = df[(df["quantity"] > 0) & (df["unit_price"] > 0)].copy()
billable["parsed"] = pd.to_datetime(billable["order_date"], errors="coerce", format="mixed")

# Blank customer_ids collapse into one key under groupby, which would create a
# single customer with hundreds of orders and wreck both the repeat rate and
# every cohort. Excluded, and the count is reported so the exclusion is visible.
blank = int((billable["customer_id"].fillna("") == "").sum())
named = billable[(billable["customer_id"].fillna("") != "") & billable["parsed"].notna()]

per_customer = named.groupby("customer_id").agg(
    orders=("order_id", "nunique"),
    first_order=("parsed", "min"),
)

total = int(len(per_customer))
repeat = int((per_customer["orders"] > 1).sum())

# A cohort is everyone who FIRST bought in the same month — which is why this
# groups on first_order, not on order date.
cohorts = (
    per_customer["first_order"].dt.to_period("M").astype(str)
    .value_counts().sort_index()
)

out = {
    "customer_count": total,
    "repeat_customers": repeat,
    "one_time_customers": total - repeat,
    "repeat_rate": float(repeat / total) if total else 0.0,
    "cohort_sizes": {k: int(v) for k, v in cohorts.items()},
    "cohort_count": int(len(cohorts)),
}

with open("output.json", "w") as f:
    json.dump(out, f, indent=2)

print(f"{total:,} identifiable customers ({blank:,} rows had no customer_id)")
print(f"{repeat:,} ordered more than once — repeat rate {out['repeat_rate']:.1%}")
print(f"{out['cohort_count']} monthly cohorts, largest {cohorts.max():,}")
'''


STARTERS = {2: TASK2_STARTER, 4: TASK4_STARTER, 5: TASK5_STARTER, 7: TASK7_STARTER}
SOLUTIONS = {2: TASK2_SOLUTION, 4: TASK4_SOLUTION, 5: TASK5_SOLUTION, 7: TASK7_SOLUTION}
