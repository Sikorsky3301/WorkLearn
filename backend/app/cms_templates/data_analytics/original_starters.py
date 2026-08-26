"""Boilerplate for the four ORIGINAL Data Analyst tasks.

WHY THIS EXISTS

Tasks 1, 3, 6 and 8 shipped with `starter_code` that was not starter code —
it was the finished solution. Measured through the real graders:

    task 1  Clean the Data                 starter scored 100
    task 6  RFM Segmentation               starter scored  80
    task 8  A/B Test Analysis              starter scored  65
    task 3  Sales Report                   starter scored  25

A student opened task 1, pressed Submit without typing a character, and passed
with full marks. Task 1's starter de-duplicated, fixed the category typos,
rescaled `discount_pct` and removed the price outlier — every one of the six
things the grader checks. Task 8's did the t-test and made the ship/no-ship
call, which IS the task.

The four tasks added in the three-week restructure (2, 4, 5, 7) were already
right — their starters score 10 — and this module follows their house style,
set out in starters.py:

  · runnable as-is, so pressing Run before writing anything gives a scored
    result with most checks failing rather than a traceback. "My code crashed"
    and "my answer is wrong" are different lessons.
  · it names every key the grader reads, so nobody loses marks guessing an
    identifier. The contract is not the secret; the analysis is.
  · it reads the input and writes the output, so the file plumbing — the part
    that is fiddly and teaches nothing — is done.
  · it computes NOTHING that the task is asking for.

tests/unit/test_da_starters.py pins the shape of all eight, and
verify_da_grading.py runs them through real Docker containers and asserts each
starter scores below its model solution.
"""

# ── Task 1 · Clean the Data ──────────────────────────────────────────────────
#
# The grader checks six things: the file exists, duplicates are gone, no
# order_id repeats, discount_pct is on a 0-1 scale, the category typos are
# normalised, and the $99,999 outlier is dealt with. None of that is done here.

TASK1_STARTER = '''import pandas as pd

# dataset.csv is the RAW extract — three systems that never agreed with each
# other. Look at it before you change anything.
df = pd.read_csv("dataset.csv")
print(f"Loaded {len(df):,} rows, {df['order_id'].nunique():,} distinct order_ids")
print(df.dtypes)
print(df.head())

# ── Your cleaning goes here ─────────────────────────────────────────────────
#
# Work through these in an order you can defend. Each one is a judgement call,
# not a recipe — and the write-up asks you what you did and why.
#
#   1. Duplicate orders            same order_id appearing more than once
#   2. Category typos              inspect df["product_category"].unique()
#   3. discount_pct scale          some rows are 0.15, some are 15
#   4. The price outlier           df["unit_price"].max() will show you
#   5. Returns                     negative quantities are real, not errors —
#                                  decide whether to flag or drop, and say why
#
# TODO: write it.


# ── The artifact ────────────────────────────────────────────────────────────
# THIS file is what gets graded. Printed output never is.
df.to_csv("output.csv", index=False)
print(f"output.csv written with {len(df):,} rows")
'''


# ── Task 3 · Sales Report ────────────────────────────────────────────────────
#
# Keys named, values left at zero. `net_revenue` is deliberately absent: how
# revenue is defined (and whether returns and $0 promos belong in it) is the
# actual question.

TASK3_STARTER = '''import pandas as pd
import json

# This is YOUR cleaned file from Task 1 — whatever you decided there flows
# through into every number below.
df = pd.read_csv("dataset.csv")
print(f"{len(df):,} rows")

# ── Your analysis goes here ─────────────────────────────────────────────────
#
# Decide first what counts as revenue. Quantity times price is not the whole
# story: there is a discount column, there are returns, and there are $0 rows.
# Whatever you choose, apply it consistently to all five figures below.
#
# TODO: compute each of these.

report = {
    "total_revenue": 0.0,   # float
    "order_count": 0,       # int — DISTINCT orders, not rows
    "aov": 0.0,             # float — revenue per order
    "by_channel": {},       # {channel: revenue}
    "by_category": {},      # {product_category: revenue}
}

with open("output.json", "w") as f:
    json.dump(report, f, indent=2)

print(json.dumps(report, indent=2))
'''


# ── Task 6 · RFM Segmentation ────────────────────────────────────────────────
#
# The old starter shipped a working tercile split and a three-way segment
# function — i.e. the segmentation. Gone. What is left is the output shape.

TASK6_STARTER = '''import pandas as pd
import json

df = pd.read_csv("dataset.csv")

# ── Your segmentation goes here ─────────────────────────────────────────────
#
# RFM is Recency, Frequency, Monetary. Build a per-customer view first, then
# decide how to cut it into segments — how many, where the boundaries sit, and
# what to call them. Those choices are the task; there is no single right
# answer, but there is an answer you can justify to Priya.
#
# Watch for rows with no customer_id — decide what to do with them.
#
# TODO: build the per-customer table, then assign a segment to each one.

customers = []      # [{"customer_id": ..., "segment": ...}, ...]
total_monetary = 0.0

output = {
    "customers": customers,
    "total_monetary": total_monetary,
}

with open("output.json", "w") as f:
    json.dump(output, f, indent=2)

print(f"{len(customers):,} customers, total monetary {total_monetary:,.2f}")
'''


# ── Task 8 · A/B Test Analysis ───────────────────────────────────────────────
#
# The old starter ran the t-test and picked the recommendation. Both are the
# task. scipy is imported because finding the import is not the lesson.

TASK8_STARTER = '''import pandas as pd
import json
from scipy import stats   # stats.ttest_ind is available if you want it

df = pd.read_csv("dataset.csv")
print(df["experiment_group"].value_counts(dropna=False))

# ── Your analysis goes here ─────────────────────────────────────────────────
#
# Two groups, one metric, one decision.
#
#   1. Split control from variant. Check what else is in that column.
#   2. Decide what you are comparing — revenue per what?
#   3. Test whether the difference is real, and get a p-value.
#   4. Make the call.
#
# On step 4: a p-value is NOT the probability the variant works, and
# "not significant" is not the same as "no effect". Your recommendation has to
# survive Priya asking why.
#
# TODO: compute each of these.

output = {
    "mean_control": 0.0,
    "mean_variant": 0.0,
    "p_value": 1.0,
    "recommendation": "",   # one of: ship, no-ship, hold
}

with open("output.json", "w") as f:
    json.dump(output, f, indent=2)

print(json.dumps(output, indent=2))
'''


# task_index -> starter. Keyed by the task's CURRENT index; the simulation was
# renumbered in the three-week restructure (see new_tasks.RENUMBER).
ORIGINAL_STARTERS = {
    1: TASK1_STARTER,
    3: TASK3_STARTER,
    6: TASK6_STARTER,
    8: TASK8_STARTER,
}
