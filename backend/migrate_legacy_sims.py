"""
One-time, idempotent migration of the 3 hardcoded job simulations
(da-job-sim, frontend-dev-sim, sales-crm-sim) into the new CMS schema
(Simulation/SimulationTask — see app/models/cms.py). Transcribed by hand from
today's hardcoded sources, since sales-crm-sim's engine/simulationConfig.js
and stageQuizzes.js are frontend JS, not importable Python:
  - backend/app/routes/v1/enrollments.py (SIMULATIONS, SIM_MANAGERS,
    SIM_TASK_BRIEFS, SIM_ONBOARDING)
  - backend/app/core/config.py (SIM_TASK_XP_AWARDS, SIM_TASK_SKILL_AWARDS,
    SIM_TASK_WEEKS via SIM_TASK_NAMES's task-0 "Onboarding" entries)
  - backend/app/routes/v1/sandbox.py (SIM_TASK_IO) — informs grader_key/
    dataset_key/language per code_sandbox task
  - backend/app/ai/services/crm_sim_prompts.py (PERSONALITIES, EMAIL_GRADING_PROMPT)
  - src/features/simulations/da-job-sim/DASimulationWorkspace.jsx (TASKS,
    SANDBOX_STARTERS)
  - src/features/simulations/frontend-dev-sim/FrontendSimulationWorkspace.jsx
    (TASKS, SANDBOX_STARTERS, FINAL_ASSESSMENT)
  - src/features/simulations/sales-crm-sim/engine/simulationConfig.js (STAGES)
  - src/features/simulations/sales-crm-sim/data/stageQuizzes.js (STAGE_QUIZZES)
  - src/features/simulations/sales-crm-sim/data/seedData.js (DISCOVERY_CONTACT,
    OBJECTION_CONTACT)
  - src/features/simulations/sales-crm-sim/stages/Stage5Crm/crmConstants.js
    (PIPELINE_STAGES)

Safe to re-run: each simulation is skipped if its id already exists.

Run with: python migrate_legacy_sims.py  (from backend/, so app/ resolves
the same way app/main.py's own imports do)
"""
import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.cms import Simulation, SimulationTask, SimulationStatus
from app.models import sim_builder as _models_sim_builder  # noqa: F401 — registers SimBuilder* tables so Simulation.sim_builder_project_id's FK resolves


# ── da-job-sim ────────────────────────────────────────────────────────────────

TASK1_STARTER = """import pandas as pd

# ── dataset.csv is the raw lumen_orders dataset ──────────────────────────
df = pd.read_csv('dataset.csv')
print(f"Loaded {len(df):,} rows")

# ── Step 1: Remove duplicate orders ──────────────────────────────────────
df = df.drop_duplicates(subset='order_id', keep='first')

# ── Step 2: Fix category typos ────────────────────────────────────────────
category_fixes = {'Lightng': 'Lighting', 'lighting': 'Lighting', 'Accessoires': 'Accessories'}
df['product_category'] = df['product_category'].replace(category_fixes)

# ── Step 3: Normalize discount_pct to a 0–1 scale ────────────────────────
df['discount_pct'] = df['discount_pct'].apply(lambda x: x / 100 if x > 1 else x)

# ── Step 4: Handle the $99,999 price outlier ─────────────────────────────
df = df[df['unit_price'] < 99999]

print(f"Cleaned to {len(df):,} rows")
print(df['product_category'].value_counts())

# ── Write your cleaned data — THIS is what gets graded, not printed text ──
df.to_csv('output.csv', index=False)
print("output.csv written")
"""

TASK1_MODEL_SOLUTION_CODE = """import pandas as pd

df = pd.read_csv('dataset.csv')
print(f"Loaded {len(df):,} rows")

# Step 1 — Remove duplicate orders, but look before deleting
dupes = df[df.duplicated(subset='order_id', keep=False)]
print(f"{dupes['order_id'].nunique()} order_ids appear more than once")
df = df.drop_duplicates(subset='order_id', keep='first')

# Step 2 — Parse every date format to ISO; flag blanks, don't drop them
df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce', format='mixed')
df['date_missing'] = df['order_date'].isna()

# Step 3 — Negative quantities are returns, not errors — flag them
df['is_return'] = df['quantity'] < 0

# Step 4 — $0 prices are promos; the $99,999 entry is a data-entry error — drop it
df['is_promo'] = df['unit_price'] == 0
df = df[df['unit_price'] < 99999]

# Step 5 — Fix category typos with an explicit, reproducible mapping
category_fixes = {'Lightng': 'Lighting', 'lighting': 'Lighting', 'Accessoires': 'Accessories'}
df['product_category'] = df['product_category'].replace(category_fixes)

# Step 6 — Normalize discount_pct to a 0–1 scale
df['discount_pct'] = df['discount_pct'].apply(lambda x: x / 100 if x > 1 else x)

print(f"Cleaned to {len(df):,} rows")
df.to_csv('output.csv', index=False)
print("output.csv written")
"""

TASK2_MODEL_SOLUTION_CODE = """import pandas as pd
import json

df = pd.read_csv('dataset.csv')

# Step 1 — Define net revenue: exclude returns and $0 promo rows
df = df[df['quantity'] > 0]
df = df[df['unit_price'] > 0]
df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])

# Step 2 — Headline KPIs
total_revenue = float(df['net_revenue'].sum())
order_count   = int(df['order_id'].nunique())
aov           = total_revenue / order_count

# Step 3 — Breakdowns by channel and category
by_channel  = df.groupby('channel')['net_revenue'].sum().to_dict()
by_category = df.groupby('product_category')['net_revenue'].sum().to_dict()

# Step 4 — The volume-vs-value insight
orders_by_channel = df.groupby('channel')['order_id'].nunique()
aov_by_channel = df.groupby('channel')['net_revenue'].sum() / orders_by_channel
print("Orders by channel:\\n", orders_by_channel.sort_values(ascending=False))
print("AOV by channel:\\n", aov_by_channel.sort_values(ascending=False))

report = {
    "total_revenue": total_revenue,
    "order_count": order_count,
    "aov": aov,
    "by_channel": {k: float(v) for k, v in by_channel.items() if k},
    "by_category": {k: float(v) for k, v in by_category.items()},
}
with open('output.json', 'w') as f:
    json.dump(report, f)
print("output.json written")
"""

TASK3_MODEL_SOLUTION_CODE = """import pandas as pd
import json

df = pd.read_csv('dataset.csv')
df = df[df['customer_id'].notna() & (df['customer_id'] != '')]
df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])
df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce', format='mixed')

# Step 1 — Aggregate to the customer level
snapshot_date = df['order_date'].max()
rfm = df.groupby('customer_id').agg(
    recency=('order_date', lambda d: (snapshot_date - d.max()).days),
    frequency=('order_id', 'count'),
    monetary=('net_revenue', 'sum'),
).reset_index()
rfm = rfm.dropna(subset=['recency'])

# Step 2 — Quintile-score each dimension (rank first avoids duplicate-edge errors)
rfm['R_score'] = pd.qcut(rfm['recency'].rank(method='first', ascending=False), 5, labels=[1, 2, 3, 4, 5]).astype(int)
rfm['F_score'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)
rfm['M_score'] = pd.qcut(rfm['monetary'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)

# Step 3 — Name the segments from the R/F/M scores
def assign_segment(row):
    if row['R_score'] >= 4 and row['F_score'] >= 4 and row['M_score'] >= 4:
        return 'Champions'
    if row['M_score'] >= 4 and row['R_score'] <= 2:
        return 'At-Risk'
    if row['R_score'] >= 4 and row['F_score'] == 1:
        return 'New'
    return 'Hibernating'

rfm['segment'] = rfm.apply(assign_segment, axis=1)
print(rfm['segment'].value_counts())

output = {
    "customers": [
        {"customer_id": r.customer_id, "segment": r.segment}
        for r in rfm.itertuples()
    ],
    "total_monetary": float(rfm['monetary'].sum()),
}
with open('output.json', 'w') as f:
    json.dump(output, f)
print("output.json written")
"""

TASK4_MODEL_SOLUTION_CODE = """import pandas as pd
from scipy import stats
import json

df = pd.read_csv('dataset.csv')
df = df[df['experiment_group'].isin(['control', 'variant'])]
df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])

# Step 1 — Sanity check: are the two groups roughly balanced?
group_sizes = df['experiment_group'].value_counts()
print("Group sizes:\\n", group_sizes)
balance_ratio = group_sizes.min() / group_sizes.max()
if balance_ratio < 0.7:
    print(f"WARNING: groups are imbalanced ({balance_ratio:.0%} ratio)")

control = df[df['experiment_group'] == 'control']['net_revenue']
variant = df[df['experiment_group'] == 'variant']['net_revenue']

# Step 2 — Compare the primary metric
mean_control = float(control.mean())
mean_variant = float(variant.mean())
lift_pct = (mean_variant - mean_control) / mean_control

# Step 3 — Run Welch's t-test
t_stat, p_value = stats.ttest_ind(control, variant, equal_var=False)

print(f"Control mean: \\${mean_control:.2f}  (n={len(control):,})")
print(f"Variant mean: \\${mean_variant:.2f}  (n={len(variant):,})")
print(f"Lift: {lift_pct:.1%}   p-value: {p_value:.4f}")

# Step 4 — Flag the margin risk even though no one asked
print("Caveat: free shipping raises AOV via cart-padding, but also raises "
      "fulfillment cost on every qualifying order — revenue lift != profit lift.")

# Step 5 — Ship / no-ship, with a "measure first" option for weak signals
if p_value < 0.05 and lift_pct > 0.03:
    recommendation = "ship"
elif p_value < 0.05:
    recommendation = "hold"
else:
    recommendation = "no-ship"

result = {
    "mean_control": mean_control,
    "mean_variant": mean_variant,
    "p_value": float(p_value),
    "recommendation": recommendation,
}
with open('output.json', 'w') as f:
    json.dump(result, f)
print("output.json written")
"""

TASK2_STARTER = """import pandas as pd
import json

# ── dataset.csv is your cleaned data from Task 1 ─────────────────────────
df = pd.read_csv('dataset.csv')
df = df[df['quantity'] > 0]     # exclude returns
df = df[df['unit_price'] > 0]   # exclude $0 promos
df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])

total_revenue = float(df['net_revenue'].sum())
order_count   = int(df['order_id'].nunique())
aov           = total_revenue / order_count

by_channel  = df.groupby('channel')['net_revenue'].sum().to_dict()
by_category = df.groupby('product_category')['net_revenue'].sum().to_dict()

report = {
    "total_revenue": total_revenue,
    "order_count": order_count,
    "aov": aov,
    "by_channel": {k: float(v) for k, v in by_channel.items() if k},
    "by_category": {k: float(v) for k, v in by_category.items()},
}
with open('output.json', 'w') as f:
    json.dump(report, f)
print("output.json written")
"""

TASK3_STARTER = """import pandas as pd
import json

df = pd.read_csv('dataset.csv')
df = df[df['customer_id'].notna() & (df['customer_id'] != '')]
df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])

rfm = df.groupby('customer_id').agg(
    frequency=('order_id', 'count'),
    monetary=('net_revenue', 'sum'),
).reset_index()

# ── Simple tercile-based segmentation — adjust the thresholds/labels ────
rfm['monetary_rank'] = pd.qcut(rfm['monetary'], 3, labels=['Low', 'Mid', 'High'], duplicates='drop')

def assign_segment(row):
    if row['monetary_rank'] == 'High': return 'Champions'
    if row['monetary_rank'] == 'Mid':  return 'Loyal'
    return 'At Risk'

rfm['segment'] = rfm.apply(assign_segment, axis=1)
print(rfm['segment'].value_counts())

output = {
    "customers": [
        {"customer_id": r.customer_id, "segment": r.segment}
        for r in rfm.itertuples()
    ],
    "total_monetary": float(rfm['monetary'].sum()),
}
with open('output.json', 'w') as f:
    json.dump(output, f)
print("output.json written")
"""

TASK4_STARTER = """import pandas as pd
import json
from scipy import stats

df = pd.read_csv('dataset.csv')
df = df[df['experiment_group'].isin(['control', 'variant'])]
df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])

control = df[df['experiment_group'] == 'control']['net_revenue']
variant = df[df['experiment_group'] == 'variant']['net_revenue']

mean_control = float(control.mean())
mean_variant = float(variant.mean())
t_stat, p_value = stats.ttest_ind(control, variant, equal_var=False)

print(f"Control mean: ${mean_control:.2f}")
print(f"Variant mean: ${mean_variant:.2f}")
print(f"p-value: {p_value:.4f}")

recommendation = "ship" if p_value < 0.05 and mean_variant > mean_control else "no-ship"

output = {
    "mean_control": mean_control,
    "mean_variant": mean_variant,
    "p_value": float(p_value),
    "recommendation": recommendation,
}
with open('output.json', 'w') as f:
    json.dump(output, f)
print("output.json written")
"""


def da_job_sim():
    sim = dict(
        slug="da-job-sim",
        title="Junior Data Analyst Job Simulation",
        description="Real-world DA tasks from Lumen Corporation: clean data, build reports, segment customers, run A/B tests, and deliver an executive brief.",
        company="Lumen Corporation",
        domain="Data Analytics",
        category="Data",
        accent_color="bg-primary",
        difficulty="Beginner",
        estimated_hours="4–6 hrs",
        skills=["SQL", "Python", "Analytics", "Data Visualization", "Statistics"],
        rating=4.8, rating_count=1247,
        logo_url="/static/seed/lumen-logo.png",
        manager={"name": "Priya Sharma", "role": "Growth & Analytics Manager", "avatar": "PS", "photo_url": "/static/seed/priya-sharma.jpg"},
        onboarding={
            "company": {
                "name": "Lumen Corporation", "industry": "Home & Lighting",
                "size": "~120 employees", "location": "Remote-first · US/UK",
                "about": "Lumen Corporation is a fast-growing online retailer in the home & lighting space. "
                         "The Growth & Analytics team turns raw commercial data into the decisions that steer the business.",
            },
            "intro": (
                "Hey, and welcome to the team — really glad to have you on Growth & Analytics.\n\n"
                "Here's how I work: I'll send you tasks exactly as I would to any analyst on my team. "
                "Take a real swing at each one before you peek at how I'd have approached it — that's where the learning is. "
                "Don't aim for perfect; aim for defensible. Every number you hand leadership, you should be able to explain.\n\n"
                "Over the next two weeks you'll go from raw, messy data to an executive-ready story. "
                "Let's get you set up and into your first project."
            ),
            "learn": [
                "Cleaning messy real-world data and defending your judgment calls",
                "Building skimmable KPI reports leadership actually reads",
                "Segmenting customers with RFM to focus the business",
                "Analysing an A/B test and making a ship / no-ship call",
                "Turning analysis into a clear executive brief",
            ],
            "offer": {
                "title": "Junior Data Analyst — Job Simulation", "role": "Junior Data Analyst",
                "team": "Growth & Analytics", "company": "Lumen Corporation",
                "body": (
                    "We're delighted to offer you a place on the Lumen Corporation Junior Data Analyst Job Simulation. "
                    "In this role you'll work directly with your manager on five real projects using a realistic commercial dataset, "
                    "building the exact skills a junior data analyst needs on the job. "
                    "By accepting, you're committing to give each task a genuine attempt and to learn by doing. "
                    "We're excited to see what you deliver."
                ),
            },
        },
        onboarding_xp_award=10,
    )

    common = dict(dataset_key="da_job_sim.lumen_orders", language="python", submission_mode="code",
                  grading_strategy="registered_grader")

    tasks = [
        dict(task_index=1, title="Task 1 — Clean the Data", type="code_sandbox", week=1,
             objective="Data quality check — raw order data needs a pass",
             briefing="Before anyone trusts our reports, the data has to be trustworthy. I pulled the last 18 months "
                      "of orders straight from the warehouse and it's… raw. Can you clean it and give me a one-page "
                      "data-quality summary? I want to know what you fixed and what you chose not to fix, and why.",
             what_to_do=["Profile the dataset: row count, columns, % missing per column, data types.",
                         "Identify and resolve each quality issue: duplicate order_ids, mixed date formats, "
                         "negative quantities, zero/outlier prices, inconsistent category text, and the "
                         "discount_pct scale problem.",
                         "Document every decision (fix / drop / flag) with a one-line rationale."],
             what_to_submit=["Your cleaned dataset (same tool you started in)",
                              "A data-quality log — a table with columns: Issue | Rows Affected | Action Taken | Rationale"],
             hints=["Don't silently delete rows. A returned order with negative quantity might be valid data, just "
                    "mislabeled. Ask yourself what it represents before deleting it.",
                    '"Fix" vs "drop" is a judgment call — the rationale matters more than the choice itself.'],
             success_criteria=["Profile the dataset", "Resolve each quality issue", "Document every decision"],
             model_solution={
                 "steps": [
                     dict(title="Remove duplicate orders",
                          detail="De-dupe on order_id, keeping the first occurrence — but look before deleting: "
                                 "verify the dupes are true copies, not legitimately distinct order lines.",
                          example="dupes = df[df.duplicated(subset='order_id', keep=False)]\n"
                                  "print(f\"{dupes['order_id'].nunique()} order_ids appear more than once\")\n"
                                  "df = df.drop_duplicates(subset='order_id', keep='first')"),
                     dict(title="Standardize the dates",
                          detail="Parse every date format to ISO. Blank or unparseable dates get flagged, not "
                                 "dropped — they may still carry valid revenue data.",
                          example="df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce', format='mixed')\n"
                                  "df['date_missing'] = df['order_date'].isna()"),
                     dict(title="Flag returns instead of deleting them",
                          detail="Negative quantities are returns, not errors. Add an is_return boolean flag so "
                                 "any downstream analysis can include or exclude them deliberately.",
                          example="df['is_return'] = df['quantity'] < 0"),
                     dict(title="Handle promo and outlier prices",
                          detail="unit_price = 0 is likely a promotional freebie — flag it as promo. The $99,999 "
                                 "entry is clearly a data-entry error — exclude it rather than let it distort any average.",
                          example="df['is_promo'] = df['unit_price'] == 0\ndf = df[df['unit_price'] < 99999]"),
                     dict(title="Fix category typos",
                          detail="Build a mapping table and apply it programmatically. Never hand-edit row by "
                                 "row — it's not reproducible.",
                          example="category_fixes = {'Lightng': 'Lighting', 'lighting': 'Lighting', 'Accessoires': 'Accessories'}\n"
                                  "df['product_category'] = df['product_category'].replace(category_fixes)"),
                     dict(title="Normalize the discount scale",
                          detail="Any discount_pct value greater than 1 was entered on the 0–100 scale instead of "
                                 "0–1 — divide those values by 100 to normalize.",
                          example="df['discount_pct'] = df['discount_pct'].apply(lambda x: x / 100 if x > 1 else x)"),
                 ],
                 "key_principle": "A good analyst makes data auditable, not just clean. The log is the real "
                                   "deliverable — anyone should be able to reproduce your cleaned file by reading it.",
                 "great_looks_like": "You can defend every decision and explicitly flagged ambiguity instead of "
                                      "hiding it. Your cleaning log is a document someone else could hand to a new "
                                      "analyst and get the same result.",
                 "example_solution": TASK1_MODEL_SOLUTION_CODE,
             },
             config={**common, "grader_key": "da_job_sim.task1_cleaning", "starter_code": TASK1_STARTER,
                     "input_filename": "dataset.csv", "output_filename": "output.csv"},
             xp_award=50, skill_awards={"sql": 60, "data_cleaning": 50}),
        dict(task_index=2, title="Task 2 — Sales Report", type="code_sandbox", week=1,
             objective="Monthly business review numbers — needed by Friday EOD",
             briefing="Leadership's monthly business review is Friday. I need the core numbers: how are we doing on "
                      "revenue, orders, and average order value, and where is the growth coming from? Build me the "
                      "report. Make it skimmable — exec attention span is about 30 seconds per slide.",
             what_to_do=["Calculate the four headline KPIs: Total Revenue, Order Count, Average Order Value (AOV), "
                         "and Units per Order.",
                         "Break revenue down three ways: by channel, by product_category, and by month (trend line).",
                         'Surface at least two insights with business framing — not just "Email AOV is $142" but '
                         "what that means."],
             what_to_submit=["A one-page report or dashboard: headline KPI tiles + 2–3 charts (trend, channel "
                              "breakdown, category breakdown)",
                              'A 3–5 bullet "what this means" section underneath the numbers'],
             hints=["Revenue per order line = quantity × unit_price × (1 − discount_pct). Decide upfront whether "
                    "returns are included or excluded, and state your definition.",
                    "A KPI with no comparison tells no story. Anchor every number: vs. last month, vs. the same "
                    "channel average, vs. the total."],
             success_criteria=["Four headline KPIs calculated", "Revenue broken down 3 ways", "2+ insights surfaced"],
             model_solution={
                 "steps": [
                     dict(title="Define net revenue upfront",
                          detail="Gross minus discounts, with returns and $0 promo rows excluded (not just "
                                 "zeroed). Leadership needs to know exactly what definition they're looking at.",
                          example="df = df[df['quantity'] > 0]\ndf = df[df['unit_price'] > 0]\n"
                                  "df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])"),
                     dict(title="Calculate the headline KPIs",
                          detail="Total Revenue, Order Count, and Average Order Value — the three numbers "
                                 "leadership expects before anything else.",
                          example="total_revenue = float(df['net_revenue'].sum())\n"
                                  "order_count   = int(df['order_id'].nunique())\n"
                                  "aov           = total_revenue / order_count"),
                     dict(title="Break revenue down by channel and category",
                          detail="A channel/category bar chart covers most of what execs ask in a first pass.",
                          example="by_channel  = df.groupby('channel')['net_revenue'].sum().to_dict()\n"
                                  "by_category = df.groupby('product_category')['net_revenue'].sum().to_dict()"),
                     dict(title="Find the volume-vs-value insight",
                          detail="Strong insight pattern: the channel with the most orders is almost never the one "
                                 "with the highest AOV — that tension is the story worth surfacing.",
                          example=None),
                     dict(title="Annotate the revenue definition",
                          detail="State the definition on the chart itself, not buried in a footnote — if someone "
                                 "screenshots your slide for a deck, the definition travels with it.",
                          example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "An exec could read it in 30 seconds and walk away with one clear, "
                                      "decision-worthy insight — not a page of numbers to interpret themselves.",
                 "example_solution": TASK2_MODEL_SOLUTION_CODE,
             },
             config={**common, "grader_key": "da_job_sim.task2_report", "starter_code": TASK2_STARTER,
                     "input_filename": "dataset.csv", "output_filename": "output.json"},
             xp_award=80, skill_awards={"python": 50, "analytics": 60, "data_viz": 40}),
        dict(task_index=3, title="Task 3 — RFM Segmentation", type="code_sandbox", week=2,
             objective="Customer segmentation — Marketing wants to stop spray-and-pray",
             briefing='Marketing wants to stop blasting the same email to everyone. Can you segment our customers '
                      'so they can target smartly? I keep hearing about "RFM" — give it a shot and tell me which '
                      'segments we should care about most.',
             what_to_do=["For each customer_id, compute three metrics: Recency (days since their last order), "
                         "Frequency (total number of orders), Monetary (total spend across all orders).",
                         "Score each dimension on a 1–5 scale (quintiles work well) and combine the scores to "
                         "assign customers to named segments.",
                         "Define 3–4 actionable segment names (e.g., Champions, At-Risk, New Customers, "
                         "Hibernating) and describe what makes each segment distinct."],
             what_to_submit=["A customer table with columns: customer_id | R_score | F_score | M_score | Segment",
                              "A segment brief (half a page): which 1–2 segments deserve investment right now, "
                              "and what specific action you'd recommend for each"],
             hints=["Guest-checkout orders (missing customer_id) cannot be segmented by definition — state "
                    "explicitly that they are excluded and estimate their share of revenue as a caveat.",
                    'A segment is only useful if it implies an action. "High value, lapsing" should immediately '
                    'suggest "win-back email campaign with a personalized offer."'],
             success_criteria=["R/F/M scores computed", "3-4 named segments", "Segment brief written"],
             model_solution={
                 "steps": [
                     dict(title="Aggregate to the customer level",
                          detail="Group by customer_id and compute the most recent order date, order count, and "
                                 "total net revenue. Drop any customer whose date couldn't be parsed at all — you "
                                 "can't score a recency you don't have.",
                          example="df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])\n"
                                  "snapshot_date = df['order_date'].max()\n"
                                  "rfm = df.groupby('customer_id').agg(\n"
                                  "    recency=('order_date', lambda d: (snapshot_date - d.max()).days),\n"
                                  "    frequency=('order_id', 'count'),\n"
                                  "    monetary=('net_revenue', 'sum'),\n"
                                  ").reset_index()\nrfm = rfm.dropna(subset=['recency'])"),
                     dict(title="Quintile-score each dimension",
                          detail="For Recency, a lower raw value (more recent) should map to a higher score. "
                                 "Ranking first before qcut avoids errors when many customers tie on the same raw value.",
                          example="rfm['R_score'] = pd.qcut(rfm['recency'].rank(method='first', ascending=False), 5, "
                                  "labels=[1,2,3,4,5]).astype(int)\n"
                                  "rfm['F_score'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1,2,3,4,5]).astype(int)\n"
                                  "rfm['M_score'] = pd.qcut(rfm['monetary'].rank(method='first'), 5, labels=[1,2,3,4,5]).astype(int)"),
                     dict(title="Name the segments from the R/F/M scores",
                          detail='"Champions" = high on all three → reward with loyalty perks. "At-Risk" = high '
                                 'monetary but low recency → win-back campaign. "New" = high recency but only one '
                                 'order → nurture toward a second purchase. Everyone else is "Hibernating."',
                          example="def assign_segment(row):\n"
                                  "    if row['R_score'] >= 4 and row['F_score'] >= 4 and row['M_score'] >= 4:\n"
                                  "        return 'Champions'\n"
                                  "    if row['M_score'] >= 4 and row['R_score'] <= 2:\n"
                                  "        return 'At-Risk'\n"
                                  "    if row['R_score'] >= 4 and row['F_score'] == 1:\n"
                                  "        return 'New'\n"
                                  "    return 'Hibernating'"),
                     dict(title="Prioritize the highest-leverage segment",
                          detail="The highest-leverage segment is almost always high-value-but-lapsing (At-Risk): "
                                 "cheapest to win back, biggest revenue downside if permanently lost.",
                          example=None),
                     dict(title="Quantify the guest-checkout blind spot",
                          detail='Guest checkouts are excluded from RFM by definition. Quantify them anyway: '
                                 '"Guests represent X% of revenue and are a measurable blind spot."',
                          example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "Every segment ends in a concrete recommended action, not just a label. "
                                      "Marketing can take your brief straight into a campaign brief without asking "
                                      "follow-up questions.",
                 "example_solution": TASK3_MODEL_SOLUTION_CODE,
             },
             config={**common, "grader_key": "da_job_sim.task3_segmentation", "starter_code": TASK3_STARTER,
                     "input_filename": "dataset.csv", "output_filename": "output.json"},
             xp_award=90, skill_awards={"customer_analysis": 30, "segmentation": 30}),
        dict(task_index=4, title="Task 4 — A/B Test Analysis", type="code_sandbox", week=2,
             objective="Check the free-shipping experiment before we roll it out",
             briefing='We tested a new free-shipping threshold on half of traffic last quarter — experiment_group = '
                      '"control" vs "variant". The growth PM is sure it won and wants to roll it out Monday. Before '
                      "we do, tell me: did it actually work? Be the person in the room who checks the math.",
             what_to_do=['Filter to rows where experiment_group is "control" or "variant" (ignore nulls — those '
                         "orders predate the test).",
                         "Compare the two groups on a primary metric: AOV, revenue per customer, or both.",
                         "Make a ship / don't-ship recommendation with your reasoning — and list any caveats the "
                         "PM may not have considered."],
             what_to_submit=["A comparison table: Group | Sample Size | Primary Metric | Difference | % Lift",
                              "A 150–200 word recommendation with your reasoning and at least one second-order "
                              "risk flagged"],
             hints=["A higher number in the variant is necessary but not sufficient. Ask: how big is the sample, "
                    "could the difference be random noise, and is the lift economically meaningful?",
                    "Classic trap: free-shipping thresholds often raise AOV (people add items to hit the threshold) "
                    "but also raise fulfillment costs. Revenue ≠ profit. Flag it even if no one asked."],
             success_criteria=["Groups compared on primary metric", "Ship/don't-ship recommendation made"],
             model_solution={
                 "steps": [
                     dict(title="Sanity-check the group split",
                          detail="Are the two groups roughly the same size? A 60/40 split is a yellow flag. A "
                                 "90/10 split is a red one — the assignment logic may have been flawed.",
                          example="group_sizes = df['experiment_group'].value_counts()\n"
                                  "balance_ratio = group_sizes.min() / group_sizes.max()\n"
                                  "if balance_ratio < 0.7:\n    print(f\"WARNING: groups are imbalanced ({balance_ratio:.0%} ratio)\")"),
                     dict(title="Compare the primary metric",
                          detail="Then ask: is the lift practically significant? A 0.3% AOV increase on 500 users "
                                 "is noise. A 12% AOV increase on 4,000 users is worth discussing.",
                          example="control = df[df['experiment_group'] == 'control']['net_revenue']\n"
                                  "variant = df[df['experiment_group'] == 'variant']['net_revenue']\n"
                                  "mean_control = float(control.mean())\nmean_variant = float(variant.mean())\n"
                                  "lift_pct = (mean_variant - mean_control) / mean_control"),
                     dict(title="Run a significance test",
                          detail="Welch's t-test doesn't assume equal variance between the two groups — the safer "
                                 "default for revenue data.",
                          example="from scipy import stats\nt_stat, p_value = stats.ttest_ind(control, variant, equal_var=False)"),
                     dict(title="Flag the margin risk",
                          detail="Free-shipping raises AOV by incentivizing cart padding, but also raises "
                                 "fulfillment costs on every qualifying order. A real AOV lift can still be "
                                 "margin-negative — flag this even if the PM didn't ask.",
                          example=None),
                     dict(title='Default to "measure first" when the signal is weak',
                          detail='"Don\'t ship yet — here\'s what I\'d measure first" is often the correct, mature '
                                 'answer. Saying so makes you more trusted, not less.',
                          example="if p_value < 0.05 and lift_pct > 0.03:\n    recommendation = \"ship\"\n"
                                  "elif p_value < 0.05:\n    recommendation = \"hold\"\nelse:\n    recommendation = \"no-ship\""),
                 ],
                 "key_principle": None,
                 "great_looks_like": "You resisted the PM's certainty, reasoned from evidence, and considered "
                                      "profit not just revenue. The recommendation is defensible even if the PM disagrees.",
                 "example_solution": TASK4_MODEL_SOLUTION_CODE,
             },
             config={**common, "grader_key": "da_job_sim.task4_ab_test", "starter_code": TASK4_STARTER,
                     "input_filename": "dataset.csv", "output_filename": "output.json"},
             xp_award=100, skill_awards={"statistics": 40, "hypothesis_testing": 35}),
        dict(task_index=5, title="Task 5 — Executive Brief", type="code_sandbox", week=2,
             objective="One-pager for the VP — due EOD today",
             briefing="Pull it all together. Our VP gets one page from us this week. Tell her what's working, "
                      "what's at risk, and what we should do next — in language a non-data person acts on. This is "
                      "the skill that gets analysts promoted.",
             what_to_do=["Synthesize your findings from Tasks 1–4 into a one-page executive summary. Structure: "
                         "Situation → Key Findings → Recommendations.",
                         "Lead with the recommendation, then support it with the data. Keep all jargon out — if a "
                         "word requires a definition, replace it."],
             what_to_submit=["A one-page memo, ≤ 400 words, with exactly 3 prioritized recommendations"],
             hints=['Executives read top-down. Your first two sentences must answer "so what?" — the rest is support.',
                    "Each recommendation needs three things: the action, the expected business impact, and your "
                    "confidence level."],
             success_criteria=["One-page memo, ≤ 400 words", "Exactly 3 prioritized recommendations"],
             model_solution={
                 "steps": [
                     dict(title="Use the four-part structure",
                          detail="(1) One-sentence bottom line. (2) Three findings, each with a supporting data "
                                 "point. (3) Three recommendations, ranked by impact × confidence. (4) One sentence "
                                 "on what you'd track to know if it worked.", example=None),
                     dict(title="Translate metrics into business consequences",
                          detail='Not "Email AOV is 22% higher" but "shifting 10% of Paid Search budget toward '
                                 'Email could grow revenue without increasing traffic costs." The number only '
                                 "matters once it's tied to an action.", example=None),
                     dict(title="Order recommendations by impact × confidence",
                          detail="Highest confidence × highest impact goes first. Don't bury the lead — a VP "
                                 "reading top-down should hit your best idea in the first line.", example=None),
                     dict(title="Include one honest caveat",
                          detail="A risk or caveat shows judgment, not weakness. Executives distrust memos that "
                                 "have no caveats — it reads as either naive or hiding something.", example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "A non-technical VP reads it once and knows exactly what to approve, what to "
                                      "question, and what to watch. She doesn't need to ask a follow-up.",
                 "example_solution": (
                     "Bottom line: Email is our most efficient channel by AOV, and the free-shipping test shows a "
                     "real, if modest, lift — recommend a phased rollout, not a full one.\n\n"
                     "Findings: (1) Paid Search drives the most orders but Email has 22% higher AOV — volume and "
                     "value are decoupled. (2) The free-shipping variant lifted AOV ~5% with a statistically "
                     "significant result (p<0.05) on a balanced sample. (3) 8% of orders are guest-checkout and "
                     "un-segmentable — a measurable blind spot for personalization.\n\n"
                     "Recommendations: (1) Shift 10% of Paid Search budget toward Email — highest confidence, "
                     "immediate impact. (2) Roll out free shipping to one region first, watching fulfillment cost "
                     "per order, not just AOV. (3) Add a lightweight guest-checkout capture (email at minimum) to "
                     "shrink the unsegmentable share.\n\n"
                     "Caveat: the shipping lift is real but small — fulfillment cost per order needs one more "
                     "month of data before a full rollout is safe to call profit-positive, not just revenue-positive."
                 ),
             },
             config={"grading_strategy": "registered_grader", "grader_key": "da_job_sim.task5_brief",
                     "language": "text", "submission_mode": "text", "starter_code": ""},
             xp_award=120, skill_awards={"communication": 50, "data_storytelling": 40}),
    ]
    return sim, tasks


# ── frontend-dev-sim ────────────────────────────────────────────────────────

# ── frontend-dev-sim ─────────────────────────────────────────────────────────
#
# The structure, copy, starter code and model solutions now live in
# app/cms_templates/engineering.py so the CMS template and this seed cannot
# drift apart. This function only adds what is specific to the seeded row:
# its slug, and the /static/seed/* asset paths that exist only for it.
def frontend_dev_sim():
    from app.cms_templates.engineering import TEMPLATE

    template_sim = TEMPLATE["simulation"]
    sim = dict(
        template_sim,
        slug="frontend-dev-sim",
        logo_url="/static/seed/enigma-logo.png",
        manager={**template_sim["manager"], "photo_url": "/static/seed/maya-chen.jpg"},
    )
    # Copied so a caller mutating a task dict can't reach back into the
    # module-level template and corrupt it for the CMS gallery.
    tasks = [dict(t) for t in TEMPLATE["tasks"]]
    return sim, tasks



# ── sales-crm-sim ────────────────────────────────────────────────────────────

EMAIL_GRADING_PROMPT = """\
You are grading a cold outreach email written by a sales-rep trainee in the Nimbus CRM job simulation.
The email is being sent to a manufacturing-company prospect about Nimbus CRM (an AI sales platform).

Score each category 0-100 and give specific, actionable feedback (2-4 sentences total, direct and concrete —
reference actual phrases from the email where useful):
- grammar: spelling, grammar, and clarity
- professionalism: tone appropriate for a B2B cold email to an exec
- personalization: evidence the rep actually researched this specific company vs. a generic template
- valueProposition: is the value to THIS prospect clear and specific, not generic feature-dumping
- cta: is there one clear, low-friction call to action

Respond with ONLY a JSON object, no other text:
{{"scores": {{"grammar": <0-100>, "professionalism": <0-100>, "personalization": <0-100>, "valueProposition": <0-100>, "cta": <0-100>}}, "overall": <0-100>, "feedback": "<2-4 sentence summary>"}}

Subject: {subject}

Body:
{body}

Call to action: {cta}
"""

PIPELINE_STAGES = ["Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]

MOOD_OPTIONS = ["excited", "neutral", "annoyed", "curious", "impatient", "analytical", "price_sensitive", "enterprise_buyer"]

STAGE_QUIZZES = {
    1: [
        {"question": "What is Atlas Forge Manufacturing's approximate annual revenue?", "options": ["$8.5M", "$85M", "$850M", "$8.5B"], "correct": 1},
        {"question": "What does Atlas Forge currently use to track deals?", "options": ["Salesforce", "HubSpot", "Spreadsheets + a legacy on-prem CRM", "No CRM at all"], "correct": 2},
        {"question": "What recent product line did Atlas Forge launch?", "options": ["Consumer electronics", "Precision components for EV manufacturers", "Enterprise software", "Renewable energy"], "correct": 1},
        {"question": "Which of these is a genuine buying signal from the lead file?", "options": ["A random cold call", 'An inbound demo request after searching "CRM for manufacturers"', "A competitor referral", "Nothing stood out"], "correct": 1},
        {"question": "Why does buying intent matter more than firmographics alone when scoring a lead?", "options": ["It doesn't matter", "It signals urgency and readiness to act, not just company fit", "Firmographics are always more important", "Intent only matters after the sale"], "correct": 1},
    ],
    2: [
        {"question": "Who is the primary economic buyer at Atlas Forge?", "options": ["Marcus Webb", "Elena Kade, the new VP of Sales", "Ray Dominguez", "Priya Anand"], "correct": 1},
        {"question": "Which competitor did Atlas Forge already evaluate and reject?", "options": ["Zoho", "HubSpot", "Microsoft Dynamics", "Salesforce"], "correct": 1},
        {"question": "Why was that competitor rejected?", "options": ["Too expensive", "Too marketing-focused, not built for long industrial sales cycles", "Poor customer support", "Security concerns"], "correct": 1},
        {"question": "What creates real urgency in this deal?", "options": ["End of fiscal year", "Elena's 90-day mandate from the CEO to show pipeline improvement", "A limited-time discount", "Nothing in particular"], "correct": 1},
        {"question": "Who runs the competing-vendor evaluation process at Atlas Forge?", "options": ["Marcus Webb", "Ray Dominguez", "Priya Anand, Head of Procurement", "Elena Kade"], "correct": 2},
    ],
    3: [
        {"question": "What should a cold email's opening line focus on?", "options": ["Your product's features", "The prospect's problem", "Your company's history", "A generic greeting"], "correct": 1},
        {"question": "How many calls-to-action should a good cold email have?", "options": ["As many as possible", "Zero", "Exactly one, clear and low-friction", "Three, to give options"], "correct": 2},
        {"question": "What actually makes an email feel personalized rather than generic?", "options": ["Using the prospect's first name", "Referencing specific research about their business", "A longer subject line", "Bold text"], "correct": 1},
        {"question": "Which AI grading category checks whether the email is tailored to Atlas Forge specifically?", "options": ["Grammar", "Personalization", "CTA strength", "Professionalism"], "correct": 1},
        {"question": 'Why is a vague CTA like "let me know if you have questions" weak?', "options": ["It's too short", "It puts the burden of the next step on the prospect instead of proposing one", "It's grammatically incorrect", "It's too personalized"], "correct": 1},
    ],
    4: [
        {"question": "What should a discovery call open with?", "options": ["A pitch", "A question, not a pitch", "Pricing information", "A product demo"], "correct": 1},
        {"question": "Which is the stronger discovery question?", "options": ['"Do you like our product?"', '"What\'s the cost of not solving this problem?"', '"Can I get your email?"', '"Are you the decision maker?"'], "correct": 1},
        {"question": 'What does "speaking ratio" measure in this stage?', "options": ["How fast you talk", "The balance of talk time between rep and prospect", "Your typing speed", "Call duration"], "correct": 1},
        {"question": "If the prospect mentions a specific budget number, what should you do?", "options": ["Ignore it", "Note it — it's a buying signal", "Change the subject", "End the call"], "correct": 1},
        {"question": "What is the actual goal of a discovery call?", "options": ["Close the deal immediately", "Uncover real pain, budget, and timeline", "Send a proposal on the spot", "Argue with the prospect"], "correct": 1},
    ],
    5: [
        {"question": "What should an opportunity's probability reflect?", "options": ["A random guess", "Consistency with its pipeline stage", "Always 100%", "Always 50%"], "correct": 1},
        {"question": "Why does every opportunity need a follow-up task?", "options": ["It doesn't", "An opportunity with no next step is a deal that stalls", "Tasks are optional busywork", "Only for deals you already lost"], "correct": 1},
        {"question": "What does a well-formed opportunity need at minimum?", "options": ["A name only", "A stage, probability, and expected close date", "Just a dollar amount", "A signature"], "correct": 1},
        {"question": "Why log every activity in the CRM instead of just remembering it?", "options": ["It's legally required", "Your manager — and the scoring engine — reads the CRM, not your memory", "It's not really necessary", "Only for large deals"], "correct": 1},
        {"question": 'What does "CRM Accuracy" actually get scored on?', "options": ["How colorful your pipeline looks", "Whether the records you created are complete and consistent with reality", "Number of logins", "Typing speed"], "correct": 1},
    ],
    6: [
        {"question": "What should you do first when a prospect raises an objection?", "options": ["Ignore it and keep pitching", "Acknowledge it before responding", "Argue immediately", "End the call"], "correct": 1},
        {"question": "What makes an objection response credible?", "options": ["Confidence alone", "Specific evidence — a number, a case study, a concrete feature", "Repeating the same point louder", "Changing the subject"], "correct": 1},
        {"question": "If you can't fully resolve an objection in the moment, what should you do?", "options": ["Give up on the deal", "Offer a concrete next step", "Pretend it's resolved", "Immediately drop the price"], "correct": 1},
        {"question": "Who is Ray Dominguez in this deal?", "options": ["The VP of Sales", "The CFO", "Head of Procurement", "The CEO"], "correct": 1},
        {"question": "What kind of objection is Ray, as CFO, most likely to raise?", "options": ["The product's color scheme", "Price versus the competing ERP-bundled bid", "Office location", "Font choice in the proposal"], "correct": 1},
    ],
    7: [
        {"question": "What should the Expected ROI section tie back to?", "options": ["A random industry statistic", "Something the buyer actually told you in discovery", "Your company's own revenue", "Nothing in particular"], "correct": 1},
        {"question": "Why should proposal pricing match the CRM opportunity amount?", "options": ["It doesn't need to", "Contradicting your own CRM data undermines your credibility", "Pricing is irrelevant to the proposal", "CRM data is just a placeholder"], "correct": 1},
        {"question": "What is the Implementation Plan section actually for?", "options": ["Padding the document", "Reducing perceived risk with a clear rollout plan", "Listing your team's job titles", "It's optional filler"], "correct": 1},
        {"question": "What should the Executive Summary do?", "options": ["List every product feature", "Give the one-paragraph version of the whole deal", "Include legal disclaimers", "Repeat the pricing three times"], "correct": 1},
        {"question": 'Why base "Business Problems" on discovery notes rather than assumptions?', "options": ["Assumptions work just as well", "A defensible proposal reflects what you actually learned from the buyer", "It doesn't really matter", "Because it's faster to write"], "correct": 1},
    ],
    8: [
        {"question": "What actually confirms a deal is closed?", "options": ["A verbal agreement", "Updating the opportunity stage in the CRM", "A handshake", "Nothing further is needed"], "correct": 1},
        {"question": "Why book a follow-up regardless of whether you won or lost the deal?", "options": ["It's not necessary", "It keeps the relationship and pipeline accurate either way", "Only winning deals need follow-ups", "Follow-ups happen automatically"], "correct": 1},
        {"question": "What turns a signature into a happy customer?", "options": ["Nothing more is needed", "The onboarding handoff task", "A single thank-you email", "Waiting until renewal"], "correct": 1},
        {"question": 'What is the risk of skipping "request signature" as an explicit action?', "options": ["None", "The deal can stall indefinitely with no forcing function", "It actually speeds things up", "It's automatic anyway"], "correct": 1},
        {"question": "What should your negotiation notes actually capture?", "options": ["Nothing, they're optional", "Final terms, concessions made, and sticking points", "Just the final price", "Whatever comes to mind"], "correct": 1},
    ],
}


def _quiz(stage_index: int) -> dict:
    return {"questions": STAGE_QUIZZES[stage_index]}


def sales_crm_sim():
    sim = dict(
        slug="sales-crm-sim",
        title="Enterprise SaaS Sales Representative",
        description="A full sales cycle at Nimbus CRM: qualify a lead, research the account, send cold outreach, run a discovery call, work the deal in a real CRM, handle objections, write a proposal, and close.",
        company="Nimbus CRM",
        domain="Sales",
        category="Sales",
        accent_color="bg-primary",
        difficulty="Intermediate",
        estimated_hours="3–5 hrs",
        skills=["Discovery", "CRM Accuracy", "Objection Handling", "Negotiation", "Closing"],
        rating=4.9, rating_count=756,
        logo_url="/static/seed/nimbus-logo.png",
        manager={"name": "Derek Holt", "role": "VP of Sales", "avatar": "DH", "photo_url": "/static/seed/derek-holt.jpg"},
        onboarding={
            "company": {
                "name": "Nimbus CRM", "industry": "CRM SaaS",
                "size": "~60 employees", "location": "Remote-first · US",
                "about": "Nimbus CRM builds an AI-powered sales platform for mid-market and enterprise sales teams. "
                         "The sales org is expanding into industrial and manufacturing accounts, which is exactly "
                         "the kind of deal you're about to run.",
            },
            "intro": (
                "Welcome to the team — glad to have you on board.\n\n"
                "Here's how I work: I hand my reps a real deal, start to finish, and I expect you to run the whole "
                "cycle yourself — qualify it, research it, work it, and close it. I'm not going to hover over "
                "every email, but I will read your CRM, your transcripts, and your proposal the way I'd read any "
                "rep's on my team.\n\n"
                "Your first deal is Atlas Forge Manufacturing — a real inbound lead that just came in. Let's get "
                "you into it."
            ),
            "learn": [
                "Qualifying an inbound lead and defending your scoring with real reasoning",
                "Researching an account like a rep who actually wants to win the deal",
                "Writing cold outreach that earns a reply, not a delete",
                "Running a discovery call that uncovers real pain, budget, and timeline",
                "Working a deal in a real CRM — accounts, contacts, opportunities, pipeline",
                "Handling real objections with substance, not scripted reassurance",
                "Building a proposal that makes an honest business case",
                "Closing — demo, signature, negotiation, and a clean handoff to onboarding",
            ],
            "offer": {
                "title": "Enterprise SaaS Sales Representative — Job Simulation",
                "role": "Enterprise SaaS Sales Representative", "team": "Sales", "company": "Nimbus CRM",
                "body": (
                    "We're delighted to offer you a place on the Nimbus CRM Enterprise SaaS Sales Representative "
                    "Job Simulation. You'll run one real deal start to finish — lead qualification, research, "
                    "outreach, a discovery call, working the pipeline in a real CRM, objection handling, a "
                    "proposal, and the close — building the exact skills an enterprise sales rep needs on the "
                    "job. By accepting, you're committing to give each stage a genuine attempt and to learn by "
                    "doing. We're excited to see you close."
                ),
            },
        },
        onboarding_xp_award=0,
    )

    tasks = [
        dict(task_index=1, title="Stage 1 — Lead Qualification", type="structured_form", week=1,
             objective="Review the inbound lead and decide if it is worth pursuing.",
             briefing="A new inbound lead just landed in your queue. Before you spend a minute on outreach, figure "
                      "out whether this is worth pursuing — score it, judge buying intent, and write down your "
                      "reasoning.",
             hints=["Revenue and employee count tell you if this deal is even worth your time.",
                    "Recent news and buying signals often matter more than firmographics alone.",
                    "A lead score without written reasoning is not defensible to your manager."],
             success_criteria=["Lead score is set", "Buying intent is judged", "Reasoning notes are written (40+ characters)"],
             reference_data={
                 "title": "Lead File — Atlas Forge Manufacturing",
                 "fields": [
                     {"label": "Contact", "value": "Marcus Webb, VP of Operations"},
                     {"label": "Industry", "value": "Industrial Manufacturing"},
                     {"label": "Revenue", "value": "$85M annual revenue"},
                     {"label": "Employees", "value": "420 employees"},
                     {"label": "Existing CRM", "value": "Spreadsheets + a legacy on-prem CRM (last updated 2016)"},
                     {"label": "Pain points", "value": [
                         "Sales reps track deals in personal spreadsheets — leadership has no real pipeline visibility",
                         "Manual data entry means the CRM (when used at all) is chronically out of date",
                         "Forecast accuracy is poor — Q3 forecast missed actual revenue by 34%",
                     ]},
                     {"label": "Recent news", "value": [
                         "Announced a new product line (precision-machined components for EV manufacturers) three months ago",
                         "Hired a new VP of Sales six weeks ago, tasked with \"modernizing the sales org\"",
                     ]},
                     {"label": "Website summary", "value":
                         "Atlas Forge Manufacturing is a 40-year-old industrial manufacturer based in Ohio, supplying "
                         "precision-machined components to automotive and, increasingly, EV manufacturers. Their site "
                         "emphasizes reliability and long-term client relationships but has almost no modern digital "
                         "sales/marketing presence."},
                     {"label": "Buying signals", "value": [
                         "Filled out a \"Request a Demo\" form on the Nimbus CRM website after searching \"CRM for manufacturers\"",
                         "New VP of Sales publicly posted on LinkedIn about wanting better pipeline visibility",
                         "Job posting up for a \"Sales Operations Analyst\" — suggests budget for tooling/process investment",
                     ]},
                 ],
             },
             model_solution={
                 "steps": [
                     dict(title="Weigh firmographics against buying intent",
                          detail="$85M revenue and 420 employees clears any minimum-deal-size bar comfortably — "
                                 "but the stronger signal is the inbound demo request plus a new VP publicly asking "
                                 "for better pipeline visibility. Score the intent higher than firmographics alone would suggest.",
                          example=None),
                     dict(title="Read the pain points as the deal's actual shape",
                          detail="Chronic pipeline blindness and a blown forecast aren't abstract — they're the "
                                 "exact wedge Nimbus solves. Note that explicitly instead of just restating the fields.",
                          example=None),
                     dict(title="Write reasoning a manager could act on without re-reading the file",
                          detail="State the score, the one or two facts driving it, and the recommended priority — "
                                 "in that order.", example=None),
                 ],
                 "key_principle": "A lead score without written reasoning isn't a decision — it's a guess with a number on it.",
                 "great_looks_like": "leadScore ~75-85, buyingIntent High, priority High — reasoning that names the "
                                      "one or two facts actually driving the score.",
                 "example_solution":
                     "Lead score: 82/100. Buying intent: High. Priority: High.\n\n"
                     "Reasoning: Atlas Forge fits on paper ($85M revenue, 420 employees) but the real signal is "
                     "intent: they filled out a demo request after actively searching \"CRM for manufacturers,\" and "
                     "their newly-hired VP of Sales has publicly said she wants better pipeline visibility. That "
                     "combination — inbound interest plus an internal champion with a mandate — is worth more than "
                     "firmographic fit alone. The open Sales Ops Analyst req suggests budget exists. Prioritizing "
                     "high because a new VP under pressure to show results in her first 90 days moves faster than a "
                     "typical evaluation cycle.",
             },
             rubric={"research": 0.4, "discovery": 0.3, "professionalism": 0.3},
             config={"fields": [
                 {"key": "leadScore", "label": "Lead score", "type": "slider", "min": 0, "max": 100, "required": True},
                 {"key": "buyingIntent", "label": "Buying intent", "type": "select", "options": ["Low", "Medium", "High"], "required": True},
                 {"key": "priority", "label": "Priority", "type": "select", "options": ["Low", "Medium", "High"], "required": True},
                 {"key": "notes", "label": "Notes", "type": "textarea", "required": False},
                 {"key": "reasoning", "label": "Reasoning", "type": "textarea", "required": True, "min_length": 40},
             ], "post_task_quiz": _quiz(1)},
             xp_award=40, skill_awards={"sales_research": 13, "crm_accuracy": 8}),
        dict(task_index=2, title="Stage 2 — Research", type="structured_form", week=1,
             objective="Build a real picture of the account before you reach out.",
             briefing="Dig into the account — company profile, products, competitors, challenges, decision "
                      "makers, budget, and timeline. Everything you learn here makes your outreach and discovery "
                      "call sharper.",
             hints=["Look for what a competitor is already doing there — it shapes your angle.",
                    "Note who the likely economic buyer is versus who you'll actually be talking to.",
                    "Specific pain points beat generic industry pain points."],
             success_criteria=["At least one pain point identified", "At least one opportunity identified", "At least one risk identified"],
             reference_data={
                 "title": "Account Research — Atlas Forge Manufacturing",
                 "fields": [
                     {"label": "Company profile", "value":
                         "Atlas Forge Manufacturing — founded 1984, Youngstown, OH. ~420 employees, ~$85M revenue. "
                         "Core business is precision-machined components for automotive OEMs; expanding into EV "
                         "supply chains as of this year."},
                     {"label": "Products", "value": [
                         "CNC-machined structural components (core business, ~70% of revenue)",
                         "New: precision battery-enclosure components for EV manufacturers (launched this quarter)",
                     ]},
                     {"label": "Competitors", "value": [
                         "HubSpot CRM — evaluated 8 months ago, rejected as \"too marketing-focused, not built for "
                         "long industrial sales cycles\"",
                         "Local ERP vendor is pitching a bolt-on CRM module as part of a larger ERP upgrade",
                     ]},
                     {"label": "Challenges", "value": [
                         "No shared pipeline visibility — leadership finds out deals slipped only after they slip",
                         "Long sales cycles (6-9 months) make spreadsheet tracking especially error-prone",
                         "New EV product line means the sales team is prospecting a buyer persona they have no playbook for",
                     ]},
                     {"label": "Decision makers", "value": [
                         "Marcus Webb — VP of Operations (champion / initial contact)",
                         "Elena Kade — VP of Sales, new 6 weeks (primary economic buyer — mandate to modernize)",
                         "Ray Dominguez — CFO (budget approval, will scrutinize ROI and contract terms)",
                         "Priya Anand — Head of Procurement (runs vendor evaluation, manages competing bids)",
                     ]},
                     {"label": "Budget signal", "value":
                         "Open sales-ops headcount suggests budget exists for process/tooling investment this fiscal year."},
                     {"label": "Timeline signal", "value":
                         "New VP of Sales has a 90-day mandate from the CEO to show pipeline improvement — urgency is real."},
                 ],
             },
             model_solution={
                 "steps": [
                     dict(title="Separate what you know from what you're inferring",
                          detail="Write down the four confirmed decision-makers and their likely roles before "
                                 "anything else — discovery goes faster when you already know who to reach and why.",
                          example=None),
                     dict(title="Turn each challenge into an opening angle",
                          detail="\"No shared pipeline visibility\" isn't just a fact, it's your opening line in "
                                 "Stage 3.", example=None),
                     dict(title="Flag the timeline signal as your urgency lever",
                          detail="A 90-day executive mandate is real urgency you can reference — not manufactured "
                                 "urgency you have to invent.", example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "Someone who read only your research brief could walk into the discovery "
                                      "call knowing who to ask for, what's broken, and why now.",
                 "example_solution":
                     "Company profile: Atlas Forge Manufacturing, ~420 employees, ~$85M revenue, founded 1984 in "
                     "Youngstown OH. Core business is CNC-machined components for automotive OEMs, now expanding "
                     "into EV battery-enclosure parts.\n\n"
                     "Pain points: No shared pipeline visibility; deals tracked in personal spreadsheets; Q3 "
                     "forecast missed by 34%; the new EV line means reps are prospecting a buyer persona with no "
                     "existing playbook.\n\n"
                     "Opportunities: A new VP of Sales with a 90-day mandate to modernize is a built-in internal "
                     "champion. An open Sales Ops Analyst req signals budget for tooling.\n\n"
                     "Risks: HubSpot was already evaluated and rejected as too marketing-focused — don't repeat "
                     "that positioning mistake. A local ERP vendor is pitching a bundled CRM module as a competing, "
                     "and possibly cheaper-feeling, bid.",
             },
             rubric={"research": 0.7, "professionalism": 0.3},
             config={"fields": [
                 {"key": "companyProfile", "label": "Company profile", "type": "textarea", "required": True},
                 {"key": "products", "label": "Products", "type": "textarea", "required": False},
                 {"key": "competitors", "label": "Competitors", "type": "textarea", "required": False},
                 {"key": "challenges", "label": "Challenges", "type": "textarea", "required": False},
                 {"key": "decisionMakers", "label": "Decision makers", "type": "textarea", "required": False},
                 {"key": "budget", "label": "Budget", "type": "textarea", "required": False},
                 {"key": "timeline", "label": "Timeline", "type": "textarea", "required": False},
                 {"key": "painPoints", "label": "Pain points", "type": "textarea", "required": True},
                 {"key": "opportunities", "label": "Opportunities", "type": "textarea", "required": True},
                 {"key": "risks", "label": "Risks", "type": "textarea", "required": True},
             ], "post_task_quiz": _quiz(2)},
             xp_award=50, skill_awards={"sales_research": 27}),
        dict(task_index=3, title="Stage 3 — Cold Outreach", type="text_rubric", week=1,
             objective="Write a cold email that earns a reply.",
             briefing="Turn your research into a cold email — a clear subject line, a personalized body that "
                      "shows you did your homework, and one specific call to action.",
             hints=["Lead with their problem, not your product.",
                    'One CTA. Not "let me know if you have any questions."',
                    "Reference something specific from your research — generic emails get deleted."],
             success_criteria=["Subject line written", "Email body written", "Call to action written", "Email graded by AI"],
             model_solution={
                 "steps": [
                     dict(title="Open with their problem, not your product",
                          detail="Reference the pipeline-visibility pain point from research in the first "
                                 "sentence, before Nimbus is even mentioned.", example=None),
                     dict(title="Personalize with one specific, real detail",
                          detail="The new VP of Sales hire or the EV product line launch — either proves you did "
                                 "the research, a generic template can't fake it.", example=None),
                     dict(title="End with exactly one low-friction CTA",
                          detail='"Worth 15 minutes Thursday?" beats "let me know if you have any questions."',
                          example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "A prospect reading it thinks \"this person actually looked at my company\" "
                                      "within the first two sentences.",
                 "example_solution":
                     "Subject: Pipeline visibility for Atlas Forge's new EV line?\n\n"
                     "Hi Marcus — noticed Atlas Forge brought on a new VP of Sales recently, and that you're "
                     "expanding into EV battery-enclosure components. Teams making that kind of move often hit a "
                     "wall with spreadsheet-tracked pipelines — forecast accuracy tends to fall apart right when "
                     "the business is changing fastest.\n\n"
                     "Nimbus CRM helps industrial sales teams get real pipeline visibility without forcing reps "
                     "into a heavier system than they'll actually use. Worth 15 minutes this week to see if it's "
                     "relevant to what you're building?\n\n"
                     "CTA: Worth 15 minutes this week?",
             },
             rubric={"email": 1.0},
             config={"grading_mode": "llm", "llm_judge_prompt": EMAIL_GRADING_PROMPT, "min_words": 0,
                     "fields": [
                         {"key": "subject", "label": "Subject line", "type": "text", "required": True},
                         {"key": "body", "label": "Email body", "type": "textarea", "required": True},
                         {"key": "cta", "label": "Call to action", "type": "text", "required": False},
                     ],
                     "post_task_quiz": _quiz(3)},
             xp_award=70, skill_awards={"email_writing": 40, "communication": 16}),
        dict(task_index=4, title="Stage 4 — Discovery Call", type="ai_roleplay_chat", week=1,
             objective="Get the prospect talking and uncover what actually matters to them.",
             briefing="You're live with the prospect now. Build rapport, ask real discovery questions, and come "
                      "out of this call understanding their challenges, goals, budget, and timeline — not just "
                      "pitching features.",
             hints=["Open with a question, not a pitch.",
                    "Ask about the cost of the status quo, not just their goals.",
                    "If they mention a specific number or date, that's a buying signal — don't let it pass by."],
             success_criteria=["At least 6 messages exchanged", "Call notes written", "Budget and timeline noted"],
             reference_data={
                 "title": "Who You're Talking To",
                 "fields": [
                     {"label": "Contact", "value": "Marcus Webb, VP of Operations, Atlas Forge Manufacturing"},
                     {"label": "Known pain points (from research)", "value": [
                         "Sales reps track deals in personal spreadsheets — leadership has no real pipeline visibility",
                         "Manual data entry means the CRM (when used at all) is chronically out of date",
                         "Forecast accuracy is poor — Q3 forecast missed actual revenue by 34%",
                     ]},
                     {"label": "Tip", "value":
                         "This is early discovery — Marcus has not been sold yet. Earn information with good "
                         "questions rather than pitching."},
                 ],
             },
             model_solution={
                 "steps": [
                     dict(title="Open with a question, not a pitch",
                          detail="\"Walk me through how deals get tracked today?\" beats any Nimbus talking point "
                                 "in the first minute.", example=None),
                     dict(title="Follow the pain, don't recite your research",
                          detail="You already know about the forecast miss — let Marcus bring it up, then dig one "
                                 "layer deeper: what does a missed forecast actually cost the business?", example=None),
                     dict(title="Listen for numbers and dates",
                          detail="A specific budget figure or a deadline is a buying signal — write it down "
                                 "verbatim, don't paraphrase it away.", example=None),
                 ],
                 "key_principle": "Discovery calls exist to earn information, not to deliver a pitch — the rep who "
                                   "talks least often learns most.",
                 "great_looks_like": "Your call notes contain a specific budget range or figure, a timeline, and "
                                      "at least one pain point in Marcus's own words, not your paraphrase of it.",
                 "example_solution":
                     "Example opening: \"Before I say anything about what we do — walk me through how a deal moves "
                     "from first contact to closed today?\" Then follow up on whatever gap he names (usually "
                     "visibility or forecast accuracy) with \"what does that actually cost you when it happens?\" "
                     "rather than jumping to a feature pitch.",
             },
             rubric={"discovery": 0.6, "communication": 0.4},
             config={
                 "persona": {
                     "name": "Marcus Webb", "role": "VP of Operations, Atlas Forge Manufacturing",
                     "personality_prompt": "Warm, chatty, happy to share context, easy to build rapport with. Can "
                                           "drift off-topic and needs gentle steering back to the discovery "
                                           "agenda. This is an early discovery call — you have not been sold yet. "
                                           "Let the rep earn information; reward good, specific open-ended "
                                           "questions with real answers, and punish generic pitching with short "
                                           "or deflecting replies.",
                     "mood_options": MOOD_OPTIONS, "opening_mood": "neutral",
                 },
                 "context": {"company": "Atlas Forge Manufacturing", "product": "Nimbus AI Sales Platform"},
                 "mode": "discovery", "min_messages_for_completion": 6,
                 "post_task_quiz": _quiz(4),
             },
             xp_award=100, skill_awards={"discovery": 50, "communication": 24}),
        dict(task_index=5, title="Stage 5 — CRM — Work the Deal", type="crm_workspace", week=1,
             objective="Get the deal properly logged and moving through your pipeline.",
             briefing="Time to work the CRM like it's your job — because it is. Create the account, contact, and "
                      "opportunity, set a realistic pipeline stage and close date, and leave yourself a clear next "
                      "step.",
             hints=["An opportunity with no next task is a deal that stalls.",
                    'Probability should match pipeline stage — a 90% "Discovery" deal is not defensible.',
                    "Log every activity — your manager (and the scoring engine) reads the CRM, not your memory."],
             success_criteria=["Account created", "Contact created",
                                "Opportunity created with stage, probability, and close date",
                                "At least one follow-up task created"],
             model_solution={
                 "steps": [
                     dict(title="Match probability to stage honestly",
                          detail="A brand-new opportunity at 90% probability isn't defensible — align the number "
                                 "to where the deal actually sits.", example=None),
                     dict(title="Never leave an opportunity without a next step",
                          detail="A task with a real due date is what keeps a deal from going cold.", example=None),
                     dict(title="Log activities as you go, not from memory later",
                          detail="Your manager — and the scoring engine — reads the CRM, not what you remember doing.",
                          example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "Someone else could open this account and know exactly what's happened and "
                                      "what happens next, without asking you.",
                 "example_solution":
                     "Account: Atlas Forge Manufacturing. Contact: Marcus Webb, VP of Operations. Opportunity: "
                     "\"Atlas Forge — Nimbus CRM (Sales Team)\", stage Qualification, probability 20-30%, close "
                     "date ~90 days out (matching the VP's mandate window). Follow-up task: \"Send discovery call "
                     "recap + proposal timeline to Marcus\", due in 2 days.",
             },
             rubric={"crmAccuracy": 1.0},
             config={
                 "enabled_modules": ["dashboard", "leads", "accounts", "contacts", "opportunities", "pipeline",
                                      "activities", "tasks", "calendar", "reports"],
                 "required_entities": {"accounts": 1, "contacts": 1, "opportunities": 1, "tasks": 1},
                 "pipeline_stages": PIPELINE_STAGES,
                 "seed_data_key": "atlas-forge-manufacturing",
                 "post_task_quiz": _quiz(5),
             },
             xp_award=90, skill_awards={"crm_accuracy": 42}),
        dict(task_index=6, title="Stage 6 — Objection Handling", type="ai_roleplay_chat", week=1,
             objective="Handle real pushback without losing the deal.",
             briefing="The prospect has concerns — price, a competitor, approval, security, whatever comes up. "
                      "Address them directly and specifically. Generic reassurance loses deals; substance wins "
                      "them.",
             hints=["Acknowledge the objection before you answer it — don't just steamroll past it.",
                    "Bring receipts: a number, a case study, a specific feature — not just confidence.",
                    "An objection you don't fully resolve should get a concrete next step, not a hand-wave."],
             success_criteria=["At least 4 messages exchanged", "At least one objection explicitly addressed"],
             reference_data={
                 "title": "Who You're Talking To",
                 "fields": [
                     {"label": "Contact", "value": "Ray Dominguez, CFO, Atlas Forge Manufacturing"},
                     {"label": "Competing bid", "value":
                         "A local ERP vendor is pitching a bolt-on CRM module as part of a larger ERP upgrade — "
                         "likely to look cheaper line-by-line."},
                     {"label": "Budget signal", "value":
                         "Open sales-ops headcount suggests budget exists for process/tooling investment this fiscal year."},
                     {"label": "Tip", "value":
                         "Ray is numbers-first — total cost of ownership and payback period land better with him "
                         "than feature talk."},
                 ],
             },
             model_solution={
                 "steps": [
                     dict(title="Acknowledge before you answer",
                          detail="\"That's fair, let's look at the numbers\" beats jumping straight into a rebuttal.",
                          example=None),
                     dict(title="Bring a specific number, not just confidence",
                          detail="Ray is CFO — total cost of ownership and payback period land better than feature talk.",
                          example=None),
                     dict(title="If you can't fully resolve it, propose a concrete next step",
                          detail="\"Let me get you a TCO comparison by Friday\" is stronger than a hand-wave.",
                          example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "Ray leaves the conversation with a specific number or a specific next step "
                                      "attached to his objection — not just reassurance.",
                 "example_solution":
                     "Example response to a price objection: \"That's a fair concern — the ERP bundle probably "
                     "does look cheaper line-by-line. What it doesn't include is dedicated pipeline reporting built "
                     "for a 6-9 month industrial sales cycle, which is exactly what's causing the forecast miss "
                     "today. Let me put together a real TCO comparison, including what the forecast miss actually "
                     "cost you last quarter, and get it to you by Friday.\"",
             },
             rubric={"objectionHandling": 0.7, "negotiation": 0.3},
             config={
                 "persona": {
                     "name": "Ray Dominguez", "role": "CFO, Atlas Forge Manufacturing",
                     "personality_prompt": "Numbers-first — total cost of ownership, payback period, budget "
                                           "cycle, contract terms. Pushes back hard on vague ROI claims and wants "
                                           "a defensible business case. You are further along in the deal — raise "
                                           "real objections naturally (price, an incumbent competitor, needing "
                                           "management approval, implementation risk, security concerns, budget, "
                                           "contract terms), one at a time. Only soften an objection when the rep "
                                           "actually addresses its substance.",
                     "mood_options": MOOD_OPTIONS, "opening_mood": "neutral",
                 },
                 "context": {"company": "Atlas Forge Manufacturing", "product": "Nimbus AI Sales Platform"},
                 "mode": "objection", "min_messages_for_completion": 4,
                 "post_task_quiz": _quiz(6),
             },
             xp_award=100, skill_awards={"objection_handling": 45, "negotiation": 10}),
        dict(task_index=7, title="Stage 7 — Proposal", type="structured_form", week=1,
             objective="Put together a proposal that makes the business case.",
             briefing="Write the proposal you'd actually send: the business problem, your recommended solution, "
                      "an implementation plan, the expected ROI, a timeline, and pricing.",
             hints=["Tie the ROI number back to something the buyer told you in discovery.",
                    "Implementation plan should reduce risk, not just list steps.",
                    "Pricing should match what you scoped in the opportunity — don't contradict your own CRM."],
             success_criteria=["All 7 proposal sections completed"],
             model_solution={
                 "steps": [
                     dict(title="Tie the ROI section to something Marcus or Elena actually said",
                          detail="The 34% forecast miss is a real, quantifiable number to build the ROI case "
                                 "around — don't invent a generic industry statistic.", example=None),
                     dict(title="Make the implementation plan reduce risk, not just list steps",
                          detail="A phased rollout (pilot with one team, then expand) reads as lower-risk than a "
                                 "big-bang company-wide switch.", example=None),
                     dict(title="Match the pricing to what's in the CRM opportunity",
                          detail="If the proposal number doesn't match your own CRM record, it undermines the "
                                 "whole document's credibility.", example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "Someone who never sat in on discovery could read the proposal and "
                                      "understand exactly why Atlas Forge needs this, priced consistently with the CRM.",
                 "example_solution":
                     "Executive summary: Atlas Forge is scaling into a new EV product line while running pipeline "
                     "on spreadsheets — Nimbus gives the sales org the visibility to hit its 90-day modernization "
                     "mandate without adding process overhead reps won't use.\n\n"
                     "Expected ROI: last quarter's forecast missed actual revenue by 34%; even halving that gap is "
                     "worth more than the platform's annual cost.\n\n"
                     "Implementation plan: 2-week pilot with the core sales team, full rollout by end of quarter, "
                     "matching Elena's mandate window.",
             },
             rubric={"negotiation": 0.5, "communication": 0.5},
             config={"fields": [
                 {"key": "executiveSummary", "label": "Executive summary", "type": "textarea", "required": True},
                 {"key": "businessProblems", "label": "Business problems", "type": "textarea", "required": True},
                 {"key": "recommendedSolution", "label": "Recommended solution", "type": "textarea", "required": True},
                 {"key": "implementationPlan", "label": "Implementation plan", "type": "textarea", "required": True},
                 {"key": "expectedROI", "label": "Expected ROI", "type": "textarea", "required": True},
                 {"key": "timeline", "label": "Timeline", "type": "textarea", "required": True},
                 {"key": "pricingSummary", "label": "Pricing summary", "type": "textarea", "required": True},
             ], "post_task_quiz": _quiz(7)},
             xp_award=80, skill_awards={"negotiation": 15, "communication": 15}),
        dict(task_index=8, title="Stage 8 — Close", type="structured_form", week=1,
             objective="Take the concrete actions that actually close a deal.",
             briefing="This is where deals actually close or stall. Schedule the demo, request the signature, "
                      "log your negotiation notes, book the follow-up, create the onboarding task, and move the "
                      "opportunity to its final stage.",
             hints=["A deal isn't closed until the CRM says so — update the opportunity stage.",
                    "Always leave a follow-up on the calendar, win or lose.",
                    "The onboarding task is what turns a signature into a happy customer."],
             success_criteria=["Demo scheduled", "Signature requested", "Follow-up booked",
                                "Onboarding task created", "Opportunity stage updated to Closed Won or Closed Lost"],
             model_solution={
                 "steps": [
                     dict(title="Update the CRM the moment something happens",
                          detail="A deal isn't closed until the opportunity stage says so — a verbal yes doesn't "
                                 "count for reporting.", example=None),
                     dict(title="Always book a follow-up, win or lose",
                          detail="Keeps the pipeline honest and the relationship alive either way.", example=None),
                     dict(title="Create the onboarding handoff immediately after signature",
                          detail="That task is what actually turns a signed deal into a retained customer.", example=None),
                 ],
                 "key_principle": None,
                 "great_looks_like": "Every box is checked, the opportunity stage reflects reality, and the next "
                                      "person to open this account knows exactly what happens next.",
                 "example_solution":
                     "Demo scheduled ✓. Signature requested ✓. Negotiation notes: \"Agreed to annual billing in "
                     "exchange for a 10% discount; Ray wanted a 60-day out clause, settled on 90 days.\" Follow-up "
                     "booked ✓ (30-day check-in). Onboarding task created ✓, assigned to CS. Opportunity stage "
                     "updated to Closed Won.",
             },
             rubric={"closing": 0.6, "negotiation": 0.4},
             config={"fields": [
                 {"key": "demoScheduled", "label": "Demo scheduled", "type": "checkbox", "required": False},
                 {"key": "signatureRequested", "label": "Signature requested", "type": "checkbox", "required": False},
                 {"key": "negotiationNotes", "label": "Negotiation notes", "type": "textarea", "required": True},
                 {"key": "followUpBooked", "label": "Follow-up booked", "type": "checkbox", "required": False},
                 {"key": "onboardingTaskCreated", "label": "Onboarding task created", "type": "checkbox", "required": False},
                 {"key": "opportunityStageUpdated", "label": "Opportunity stage updated", "type": "checkbox", "required": False},
             ], "post_task_quiz": _quiz(8)},
             xp_award=120, skill_awards={"closing": 45, "negotiation": 15}),
    ]
    return sim, tasks


async def _insert_sim(db, sim_kwargs: dict, task_kwargs_list: list[dict]):
    exists = await db.execute(select(Simulation).where(Simulation.slug == sim_kwargs["slug"]))
    if exists.scalar_one_or_none():
        print(f"  skip {sim_kwargs['slug']} — already migrated")
        return
    sim = Simulation(status=SimulationStatus.PUBLISHED, published_at=datetime.now(timezone.utc), **sim_kwargs)
    db.add(sim)
    await db.flush()
    for t in task_kwargs_list:
        db.add(SimulationTask(simulation_id=sim.id, **t))
    await db.commit()
    print(f"  migrated {sim_kwargs['slug']} ({len(task_kwargs_list)} tasks)")


async def run():
    async with AsyncSessionLocal() as db:
        for builder in (da_job_sim, frontend_dev_sim, sales_crm_sim):
            sim_kwargs, task_kwargs_list = builder()
            await _insert_sim(db, sim_kwargs, task_kwargs_list)


if __name__ == "__main__":
    asyncio.run(run())
