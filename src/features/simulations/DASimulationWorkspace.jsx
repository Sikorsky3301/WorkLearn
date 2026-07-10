import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import JupyterPlayground from './JupyterPlayground'
import { useEnrollment, useEnroll, useCompleteTask, useOnboarding, useSubmitSandbox } from '../../shared/api/hooks'
import SimOnboarding from './SimOnboarding'
import lumenLogoImg from '../../assets/lumen-logo.png'

// ── Lumen Corporation brand mark — a wordmark image, sized by height only
// (the source asset is a wide logo, not a square icon) ──────────────────────
function LumenLogo({ size = 'md' }) {
  const h = { sm: 'h-5', md: 'h-7', lg: 'h-9' }[size]
  return <img src={lumenLogoImg} alt="Lumen Corporation" className={`${h} w-auto object-contain shrink-0`} />
}

// ── Icon set (SVG, no emoji) ──────────────────────────────────────────────────
const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

function MapPinIcon(props) {
  return <svg {...iconProps} {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
}
function UsersIcon(props) {
  return <svg {...iconProps} {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function ArrowLeftIcon(props) {
  return <svg {...iconProps} {...props}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
}
function CleanIcon(props) {
  return <svg {...iconProps} {...props}><path d="m3 21 5-5"/><path d="M20.5 3.5 15 9M9 15l6.5-6.5"/><path d="M21 8V3h-5"/><path d="M14 4 5 13a3 3 0 0 0 0 4l2 2a3 3 0 0 0 4 0l9-9"/></svg>
}
function ChartIcon(props) {
  return <svg {...iconProps} {...props}><path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/></svg>
}
function TargetIcon(props) {
  return <svg {...iconProps} {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>
}
function BeakerIcon(props) {
  return <svg {...iconProps} {...props}><path d="M9 2v6.5L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L15 8.5V2"/><path d="M8 2h8M9 15h6"/></svg>
}
function ClipboardIcon(props) {
  return <svg {...iconProps} {...props}><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V2.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5V4"/><path d="M9 11h6M9 15h6"/></svg>
}
function CheckIcon(props) {
  return <svg {...iconProps} {...props}><path d="M20 6 9 17l-5-5"/></svg>
}
function ChevronDownIcon(props) {
  return <svg {...iconProps} {...props}><polyline points="6 9 12 15 18 9"/></svg>
}
function MinimizeIcon(props) {
  return <svg {...iconProps} {...props}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
}
function RestoreIcon(props) {
  return <svg {...iconProps} {...props}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
}
function LockIcon(props) {
  return <svg {...iconProps} {...props}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
}
function DatabaseIcon(props) {
  return <svg {...iconProps} {...props}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
}

export const TASK_ICONS = { 1: CleanIcon, 2: ChartIcon, 3: TargetIcon, 4: BeakerIcon, 5: ClipboardIcon }

// The sandbox's output filename per task — used to decide whether the
// "Upload output.csv" affordance applies (only tasks whose sandbox produces
// a CSV, i.e. Task 1; tasks 2-4 produce output.json).
const TASK_OUTPUT_FILE = { 1: 'output.csv', 2: 'output.json', 3: 'output.json', 4: 'output.json' }

// One accent color per task — used for its tab, icon badge, and section
// headers, so the workspace reads as a distinct "module" per task instead of
// everything sharing the same indigo. Full class names (not interpolated) so
// Tailwind's JIT scanner can find them.
export const TASK_COLORS = {
  1: { bg: 'bg-emerald-600', bgSoft: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  2: { bg: 'bg-blue-600',    bgSoft: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  3: { bg: 'bg-violet-600',  bgSoft: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  4: { bg: 'bg-amber-600',   bgSoft: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  5: { bg: 'bg-rose-600',    bgSoft: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
}

// ── Python starter code — one per sandboxed task ─────────────────────────────
// All read/write real files (dataset.csv / output.csv|json) so the same code
// that runs in the instant browser preview also works when submitted to the
// server sandbox for grading.
const TASK1_STARTER = `import pandas as pd

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
print("✅  output.csv written")
`

const TASK2_STARTER = `import pandas as pd
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

print(f"Total Revenue: \${total_revenue:,.0f}")
print(f"Order Count:   {order_count:,}")
print(f"AOV:           \${aov:.2f}")

# ── Write your report — THIS is what gets graded, not printed text ───────
report = {
    "total_revenue": total_revenue,
    "order_count": order_count,
    "aov": aov,
    "by_channel": {k: float(v) for k, v in by_channel.items() if k},
    "by_category": {k: float(v) for k, v in by_category.items()},
}
with open('output.json', 'w') as f:
    json.dump(report, f)
print("✅  output.json written")
`

const TASK3_STARTER = `import pandas as pd
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
print("✅  output.json written")
`

const TASK4_STARTER = `import pandas as pd
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

print(f"Control mean: \${mean_control:.2f}")
print(f"Variant mean: \${mean_variant:.2f}")
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
print("✅  output.json written")
`

const SANDBOX_STARTERS = { 1: TASK1_STARTER, 2: TASK2_STARTER, 3: TASK3_STARTER, 4: TASK4_STARTER }

// ── Dataset schema for onboarding ─────────────────────────────────────────────
const SCHEMA = [
  { col: 'order_id',          type: 'string',  note: 'Unique per order — watch for duplicates' },
  { col: 'order_date',        type: 'date',    note: 'Mixed formats (YYYY-MM-DD & DD/MM/YYYY), some blank' },
  { col: 'customer_id',       type: 'string',  note: 'Null = guest checkout (~7%)' },
  { col: 'customer_email',    type: 'string',  note: 'Identifier for guest linkage' },
  { col: 'product_category',  type: 'string',  note: 'Typos present: "Lightng", "Accessoires"' },
  { col: 'quantity',          type: 'integer', note: 'Negative = return / refund' },
  { col: 'unit_price',        type: 'float',   note: 'Zeros = promo freebie; one $99,999 outlier' },
  { col: 'discount_pct',      type: 'float',   note: '12% of rows on 0–100 scale (should be 0–1)' },
  { col: 'channel',           type: 'string',  note: 'Acquisition channel; ~4% null' },
  { col: 'country',           type: 'string',  note: 'US, CA, UK, AU, ZZ (unknown)' },
  { col: 'experiment_group',  type: 'string',  note: 'control / variant / null (pre-experiment)' },
]

// ── Tasks ────────────────────────────────────────────────────────────────────
// Onboarding is no longer a task — it's a separate pre-Week-1 experience
// (see SimOnboarding.jsx). Week 1 = tasks 1–2, Week 2 = tasks 3–5.
// Exported so SimulationOverview.jsx can show the real curriculum instead of
// a second, hand-duplicated (and inevitably drifting) copy of it.
export const TASKS = [
  {
    id: 1,
    week: 1,
    title: 'Task 1 — Clean the Data',
    icon: '🧹',
    subject: 'Data quality check — raw order data needs a pass',
    message: `Before anyone trusts our reports, the data has to be trustworthy. I pulled the last 18 months of orders straight from the warehouse and it's… raw. Can you clean it and give me a one-page data-quality summary? I want to know what you fixed and what you chose not to fix, and why.`,
    whatToDo: [
      'Profile the dataset: row count, columns, % missing per column, data types.',
      'Identify and resolve each quality issue: duplicate order_ids, mixed date formats, negative quantities, zero/outlier prices, inconsistent category text, and the discount_pct scale problem.',
      'Document every decision (fix / drop / flag) with a one-line rationale.',
    ],
    whatToSubmit: [
      'Your cleaned dataset (same tool you started in)',
      'A data-quality log — a table with columns: Issue | Rows Affected | Action Taken | Rationale',
    ],
    hints: [
      "Don't silently delete rows. A returned order with negative quantity might be valid data, just mislabeled. Ask yourself what it represents before deleting it.",
      '"Fix" vs "drop" is a judgment call — the rationale matters more than the choice itself.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Remove duplicate orders',
          detail: 'De-dupe on order_id, keeping the first occurrence — but look before deleting: verify the dupes are true copies, not legitimately distinct order lines.',
          code: `dupes = df[df.duplicated(subset='order_id', keep=False)]
print(f"{dupes['order_id'].nunique()} order_ids appear more than once")
df = df.drop_duplicates(subset='order_id', keep='first')`,
        },
        {
          title: 'Standardize the dates',
          detail: 'Parse every date format to ISO. Blank or unparseable dates get flagged, not dropped — they may still carry valid revenue data.',
          code: `df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce', format='mixed')
df['date_missing'] = df['order_date'].isna()`,
        },
        {
          title: 'Flag returns instead of deleting them',
          detail: 'Negative quantities are returns, not errors. Add an is_return boolean flag so any downstream analysis can include or exclude them deliberately.',
          code: `df['is_return'] = df['quantity'] < 0`,
        },
        {
          title: 'Handle promo and outlier prices',
          detail: 'unit_price = 0 is likely a promotional freebie — flag it as promo. The $99,999 entry is clearly a data-entry error — it doesn\'t represent a real order, so exclude it rather than let it distort any average.',
          code: `df['is_promo'] = df['unit_price'] == 0
df = df[df['unit_price'] < 99999]`,
        },
        {
          title: 'Fix category typos',
          detail: 'Build a mapping table ("Lightng" → "Lighting", "lighting" → "Lighting") and apply it programmatically. Never hand-edit row by row — it\'s not reproducible.',
          code: `category_fixes = {'Lightng': 'Lighting', 'lighting': 'Lighting', 'Accessoires': 'Accessories'}
df['product_category'] = df['product_category'].replace(category_fixes)`,
        },
        {
          title: 'Normalize the discount scale',
          detail: 'Any discount_pct value greater than 1 was entered on the 0–100 scale instead of 0–1 — divide those values by 100 to normalize.',
          code: `df['discount_pct'] = df['discount_pct'].apply(lambda x: x / 100 if x > 1 else x)`,
        },
      ],
      keyPrinciple: 'A good analyst makes data auditable, not just clean. The log is the real deliverable — anyone should be able to reproduce your cleaned file by reading it.',
      greatLooksLike: 'You can defend every decision and explicitly flagged ambiguity instead of hiding it. Your cleaning log is a document someone else could hand to a new analyst and get the same result.',
      fullSolutionCode: `import pandas as pd

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
print("output.csv written")`,
    },
    skills: ['Data profiling', 'Data cleaning', 'Judgment under ambiguity', 'Documentation'],
  },
  {
    id: 2,
    week: 1,
    title: 'Task 2 — Sales Report',
    icon: '📊',
    subject: 'Monthly business review numbers — needed by Friday EOD',
    message: `Leadership's monthly business review is Friday. I need the core numbers: how are we doing on revenue, orders, and average order value, and where is the growth coming from? Build me the report. Make it skimmable — exec attention span is about 30 seconds per slide.`,
    whatToDo: [
      'Calculate the four headline KPIs: Total Revenue, Order Count, Average Order Value (AOV), and Units per Order.',
      'Break revenue down three ways: by channel, by product_category, and by month (trend line).',
      'Surface at least two insights with business framing — not just "Email AOV is $142" but what that means.',
    ],
    whatToSubmit: [
      'A one-page report or dashboard: headline KPI tiles + 2–3 charts (trend, channel breakdown, category breakdown)',
      'A 3–5 bullet "what this means" section underneath the numbers',
    ],
    hints: [
      'Revenue per order line = quantity × unit_price × (1 − discount_pct). Decide upfront whether returns are included or excluded, and state your definition.',
      'A KPI with no comparison tells no story. Anchor every number: vs. last month, vs. the same channel average, vs. the total.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Define net revenue upfront',
          detail: 'Gross minus discounts, with returns and $0 promo rows excluded (not just zeroed). Leadership needs to know exactly what definition they\'re looking at.',
          code: `df = df[df['quantity'] > 0]
df = df[df['unit_price'] > 0]
df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])`,
        },
        {
          title: 'Calculate the headline KPIs',
          detail: 'Total Revenue, Order Count, and Average Order Value — the three numbers leadership expects before anything else.',
          code: `total_revenue = float(df['net_revenue'].sum())
order_count   = int(df['order_id'].nunique())
aov           = total_revenue / order_count`,
        },
        {
          title: 'Break revenue down by channel and category',
          detail: 'A channel/category bar chart covers most of what execs ask in a first pass. Group by each dimension separately.',
          code: `by_channel  = df.groupby('channel')['net_revenue'].sum().to_dict()
by_category = df.groupby('product_category')['net_revenue'].sum().to_dict()`,
        },
        {
          title: 'Find the volume-vs-value insight',
          detail: 'Strong insight pattern: the channel with the most orders is almost never the one with the highest AOV — that tension is the story worth surfacing, not just the raw totals.',
          code: `orders_by_channel = df.groupby('channel')['order_id'].nunique()
aov_by_channel = df.groupby('channel')['net_revenue'].sum() / orders_by_channel
print(orders_by_channel.sort_values(ascending=False))
print(aov_by_channel.sort_values(ascending=False))`,
        },
        {
          title: 'Annotate the revenue definition',
          detail: 'State the definition on the chart itself, not buried in a footnote. If someone screenshots your slide for a deck, the definition travels with it.',
        },
      ],
      keyPrinciple: null,
      greatLooksLike: 'An exec could read it in 30 seconds and walk away with one clear, decision-worthy insight — not a page of numbers to interpret themselves.',
      fullSolutionCode: `import pandas as pd
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

print(f"Total Revenue: \${total_revenue:,.0f}")
print(f"Order Count:   {order_count:,}")
print(f"AOV:           \${aov:.2f}")

# Step 5 — Write the report — THIS is what gets graded, not printed text
report = {
    "total_revenue": total_revenue,
    "order_count": order_count,
    "aov": aov,
    "by_channel": {k: float(v) for k, v in by_channel.items() if k},
    "by_category": {k: float(v) for k, v in by_category.items()},
}
with open('output.json', 'w') as f:
    json.dump(report, f)
print("output.json written")`,
    },
    skills: ['KPI definition', 'Data aggregation', 'Data visualization', 'Business framing'],
  },
  {
    id: 3,
    week: 2,
    title: 'Task 3 — RFM Segmentation',
    icon: '🎯',
    subject: 'Customer segmentation — Marketing wants to stop spray-and-pray',
    message: `Marketing wants to stop blasting the same email to everyone. Can you segment our customers so they can target smartly? I keep hearing about "RFM" — give it a shot and tell me which segments we should care about most.`,
    whatToDo: [
      'For each customer_id, compute three metrics: Recency (days since their last order), Frequency (total number of orders), Monetary (total spend across all orders).',
      'Score each dimension on a 1–5 scale (quintiles work well) and combine the scores to assign customers to named segments.',
      'Define 3–4 actionable segment names (e.g., Champions, At-Risk, New Customers, Hibernating) and describe what makes each segment distinct.',
    ],
    whatToSubmit: [
      'A customer table with columns: customer_id | R_score | F_score | M_score | Segment',
      'A segment brief (half a page): which 1–2 segments deserve investment right now, and what specific action you\'d recommend for each',
    ],
    hints: [
      'Guest-checkout orders (missing customer_id) cannot be segmented by definition — state explicitly that they are excluded and estimate their share of revenue as a caveat.',
      'A segment is only useful if it implies an action. "High value, lapsing" should immediately suggest "win-back email campaign with a personalized offer."',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Aggregate to the customer level',
          detail: 'Group by customer_id and compute the most recent order date, order count, and total net revenue for each customer. Drop any customer whose date couldn\'t be parsed at all — you can\'t score a recency you don\'t have.',
          code: `df['net_revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'])
snapshot_date = df['order_date'].max()
rfm = df.groupby('customer_id').agg(
    recency=('order_date', lambda d: (snapshot_date - d.max()).days),
    frequency=('order_id', 'count'),
    monetary=('net_revenue', 'sum'),
).reset_index()
rfm = rfm.dropna(subset=['recency'])`,
        },
        {
          title: 'Quintile-score each dimension',
          detail: 'For Recency, a lower raw value (more recent) should map to a higher score. For Frequency and Monetary, higher is better. Ranking first before qcut avoids errors when many customers tie on the same raw value.',
          code: `rfm['R_score'] = pd.qcut(rfm['recency'].rank(method='first', ascending=False), 5, labels=[1, 2, 3, 4, 5]).astype(int)
rfm['F_score'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)
rfm['M_score'] = pd.qcut(rfm['monetary'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)`,
        },
        {
          title: 'Name the segments from the R/F/M scores',
          detail: '"Champions" = high on all three → reward with loyalty perks and referral asks. "At-Risk" = high monetary but low recency → win-back campaign with a time-limited offer. "New" = high recency but only one order → nurture toward a second purchase. Everyone else is "Hibernating" — low investment or suppress.',
          code: `def assign_segment(row):
    if row['R_score'] >= 4 and row['F_score'] >= 4 and row['M_score'] >= 4:
        return 'Champions'
    if row['M_score'] >= 4 and row['R_score'] <= 2:
        return 'At-Risk'
    if row['R_score'] >= 4 and row['F_score'] == 1:
        return 'New'
    return 'Hibernating'

rfm['segment'] = rfm.apply(assign_segment, axis=1)`,
        },
        {
          title: 'Prioritize the highest-leverage segment',
          detail: 'The highest-leverage segment is almost always high-value-but-lapsing (At-Risk): cheapest to win back, biggest revenue downside if permanently lost. Lead your recommendation with this segment.',
        },
        {
          title: 'Quantify the guest-checkout blind spot',
          detail: 'Guest checkouts are excluded from RFM by definition (no customer_id to group on). Quantify them anyway: "Guests represent X% of revenue and are a measurable blind spot — a login incentive could convert them."',
        },
      ],
      keyPrinciple: null,
      greatLooksLike: 'Every segment ends in a concrete recommended action, not just a label. Marketing can take your brief straight into a campaign brief without asking follow-up questions.',
      fullSolutionCode: `import pandas as pd
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
print("output.json written")`,
    },
    skills: ['Feature engineering', 'Customer analytics', 'Segmentation', 'Analysis-to-action'],
  },
  {
    id: 4,
    week: 2,
    title: 'Task 4 — A/B Test Analysis',
    icon: '🧪',
    subject: 'Check the free-shipping experiment before we roll it out',
    message: `We tested a new free-shipping threshold on half of traffic last quarter — experiment_group = "control" vs "variant". The growth PM is sure it won and wants to roll it out Monday. Before we do, tell me: did it actually work? Be the person in the room who checks the math.`,
    whatToDo: [
      'Filter to rows where experiment_group is "control" or "variant" (ignore nulls — those orders predate the test).',
      'Compare the two groups on a primary metric: AOV, revenue per customer, or both.',
      'Make a ship / don\'t-ship recommendation with your reasoning — and list any caveats the PM may not have considered.',
    ],
    whatToSubmit: [
      'A comparison table: Group | Sample Size | Primary Metric | Difference | % Lift',
      'A 150–200 word recommendation with your reasoning and at least one second-order risk flagged',
    ],
    hints: [
      'A higher number in the variant is necessary but not sufficient. Ask: how big is the sample, could the difference be random noise, and is the lift economically meaningful?',
      'Classic trap: free-shipping thresholds often raise AOV (people add items to hit the threshold) but also raise fulfillment costs. Revenue ≠ profit. Flag it even if no one asked.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Sanity-check the group split',
          detail: 'Are the two groups roughly the same size? A 60/40 split is a yellow flag. A 90/10 split is a red one — the assignment logic may have been flawed.',
          code: `group_sizes = df['experiment_group'].value_counts()
balance_ratio = group_sizes.min() / group_sizes.max()
if balance_ratio < 0.7:
    print(f"WARNING: groups are imbalanced ({balance_ratio:.0%} ratio)")`,
        },
        {
          title: 'Compare the primary metric',
          detail: 'Then ask: is the lift practically significant? A 0.3% AOV increase on 500 users is noise. A 12% AOV increase on 4,000 users is worth discussing.',
          code: `control = df[df['experiment_group'] == 'control']['net_revenue']
variant = df[df['experiment_group'] == 'variant']['net_revenue']
mean_control = float(control.mean())
mean_variant = float(variant.mean())
lift_pct = (mean_variant - mean_control) / mean_control`,
        },
        {
          title: 'Run a significance test',
          detail: 'Welch\'s t-test doesn\'t assume equal variance between the two groups, which is the safer default for revenue data. No stats background? Reason about sample size and magnitude instead — a 5% lift with n > 2,000 per group is a reasonable signal.',
          code: `from scipy import stats
t_stat, p_value = stats.ttest_ind(control, variant, equal_var=False)`,
        },
        {
          title: 'Flag the margin risk',
          detail: 'The senior move: free-shipping raises AOV by incentivizing cart padding, but also raises fulfillment costs on every qualifying order. A real AOV lift can still be margin-negative. Flag this even if the PM didn\'t ask.',
        },
        {
          title: 'Default to "measure first" when the signal is weak',
          detail: '"Don\'t ship yet — here\'s what I\'d measure first" is often the correct, mature answer. Saying so makes you more trusted, not less.',
          code: `if p_value < 0.05 and lift_pct > 0.03:
    recommendation = "ship"
elif p_value < 0.05:
    recommendation = "hold"
else:
    recommendation = "no-ship"`,
        },
      ],
      keyPrinciple: null,
      greatLooksLike: "You resisted the PM's certainty, reasoned from evidence, and considered profit not just revenue. The recommendation is defensible even if the PM disagrees.",
      fullSolutionCode: `import pandas as pd
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

print(f"Control mean: \${mean_control:.2f}  (n={len(control):,})")
print(f"Variant mean: \${mean_variant:.2f}  (n={len(variant):,})")
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
print("output.json written")`,
    },
    skills: ['Experiment analysis', 'Statistical reasoning', 'Business skepticism', 'Trade-off framing'],
  },
  {
    id: 5,
    week: 2,
    title: 'Task 5 — Executive Brief',
    icon: '📋',
    subject: 'One-pager for the VP — due EOD today',
    message: `Pull it all together. Our VP gets one page from us this week. Tell her what's working, what's at risk, and what we should do next — in language a non-data person acts on. This is the skill that gets analysts promoted.`,
    whatToDo: [
      'Synthesize your findings from Tasks 1–4 into a one-page executive summary. Structure: Situation → Key Findings → Recommendations.',
      'Lead with the recommendation, then support it with the data. Keep all jargon out — if a word requires a definition, replace it.',
    ],
    whatToSubmit: [
      'A one-page memo, ≤ 400 words, with exactly 3 prioritized recommendations',
    ],
    hints: [
      'Executives read top-down. Your first two sentences must answer "so what?" — the rest is support.',
      'Each recommendation needs three things: the action, the expected business impact, and your confidence level.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Use the four-part structure',
          detail: '(1) One-sentence bottom line. (2) Three findings, each with a supporting data point. (3) Three recommendations, ranked by impact × confidence. (4) One sentence on what you\'d track to know if it worked.',
        },
        {
          title: 'Translate metrics into business consequences',
          detail: 'Not "Email AOV is 22% higher" but "shifting 10% of Paid Search budget toward Email could grow revenue without increasing traffic costs." The number only matters once it\'s tied to an action.',
        },
        {
          title: 'Order recommendations by impact × confidence',
          detail: 'Highest confidence × highest impact goes first. Don\'t bury the lead — a VP reading top-down should hit your best idea in the first line, not the third paragraph.',
        },
        {
          title: 'Include one honest caveat',
          detail: 'A risk or caveat shows judgment, not weakness. Executives distrust memos that have no caveats — it reads as either naive or hiding something.',
        },
        {
          title: 'Remember the actual skill being tested',
          detail: 'An analyst who makes the VP\'s decision easier is worth more than one with prettier charts. Your job is to reduce the cognitive load, not increase it — that\'s the promotion skill.',
        },
      ],
      keyPrinciple: null,
      greatLooksLike: "A non-technical VP reads it once and knows exactly what to approve, what to question, and what to watch. She doesn't need to ask a follow-up.",
    },
    skills: ['Synthesis', 'Executive communication', 'Prioritization', 'Data storytelling'],
  },
]

// ── Per-task quiz questions ───────────────────────────────────────────────────
const TASK_QUIZZES = {
  1: {
    questions: [
      {
        q: 'You notice discount_pct has values like 0, 5, 10, 15 mixed with 0.05, 0.10, 0.15. What is the issue and correct fix?',
        options: [
          'Both scales are valid — no action needed',
          '12% of rows are on a 0–100 scale instead of 0–1; divide those values by 100 to normalize',
          'Drop all rows where discount_pct > 1 as data errors',
          'Multiply all values by 100 to standardize to the larger scale',
        ],
        correct: 1,
      },
      {
        q: 'The dataset has 250 rows where the same order_id appears twice. What is the best approach?',
        options: [
          'Delete all 500 rows immediately to be safe',
          'Keep all duplicates — they might represent different order lines',
          'De-duplicate on order_id, verify they are true copies, keep the first occurrence, and document the decision',
          'Ask IT to fix the source system before any analysis',
        ],
        correct: 2,
      },
    ],
  },
  2: {
    questions: [
      {
        q: 'Net revenue per order line is correctly calculated as:',
        options: [
          'quantity × unit_price',
          'unit_price − discount_pct',
          'quantity × unit_price × (1 − discount_pct)',
          '(quantity × unit_price) / discount_pct',
        ],
        correct: 2,
      },
      {
        q: 'Paid Search drives the most orders but Email has the highest AOV. What insight does this surface?',
        options: [
          'Email is underperforming; budget should be reallocated away from it',
          'Volume and value are decoupled — the highest-order channel is not the highest-value one',
          'AOV is always more important than order volume',
          'Paid Search customers are more loyal and more valuable long-term',
        ],
        correct: 1,
      },
    ],
  },
  3: {
    questions: [
      {
        q: 'A customer placed an order 2 days ago. What Recency (R) score should they receive on a 1–5 scale?',
        options: [
          '1 (low) — recent orders are riskier to target',
          '3 (medium) — neutral until more purchase history accumulates',
          '5 (high) — low days-since-order maps to a high recency score',
          'It depends on their Monetary score before assigning R',
        ],
        correct: 2,
      },
      {
        q: 'Which RFM segment is typically the highest-leverage for a win-back campaign?',
        options: [
          'New Customers (high R, low F) — they are easiest to convert to repeat buyers',
          'Champions (high R, F, M) — they already buy frequently and at high value',
          'Hibernating (low R, F, M) — they need the most encouragement',
          'At-Risk (high M, low R) — high spenders who are lapsing; cheapest to win back with the most upside',
        ],
        correct: 3,
      },
    ],
  },
  4: {
    questions: [
      {
        q: 'The variant shows +8% AOV over control. Before recommending a full rollout, what must you verify?',
        options: [
          'Whether the VP of Product has signed off on the rollout plan',
          'Whether sample sizes are large enough for the lift to be statistically and practically significant',
          'Whether the charts display correctly in the business review dashboard',
          'Whether both groups have the same product-category distribution',
        ],
        correct: 1,
      },
      {
        q: 'Free-shipping thresholds can increase AOV but still hurt the business. Why?',
        options: [
          'Customers will game the threshold and then immediately return items',
          'Higher fulfillment costs on every qualifying order can make a real AOV lift margin-negative',
          'Free shipping reduces the perceived value of the products',
          'It creates noise in the marketing attribution model',
        ],
        correct: 1,
      },
    ],
  },
  5: {
    questions: [
      {
        q: 'Which structure makes an executive memo most effective?',
        options: [
          'Methodology → Analysis → Findings → Recommendations',
          'Charts first, then supporting text, then a conclusion',
          'Bottom line up front → 3 supporting findings → 3 ranked recommendations → one caveat',
          'Comprehensive data tables first, executive summary at the end',
        ],
        correct: 2,
      },
      {
        q: 'Why should an executive memo always include at least one risk or caveat?',
        options: [
          'Legal and compliance require it',
          'It demonstrates analytical judgment — executives distrust analysis with no acknowledged uncertainty',
          'It makes the memo appear more thorough and comprehensive',
          'Caveats give the analyst cover if the recommendation does not pan out',
        ],
        correct: 1,
      },
    ],
  },
}

function CertificateView({ onBack }) {
  const navigate = useNavigate()
  return (
    <div className="max-w-container mx-auto px-6 py-8 flex flex-col items-center">
      <div className="card max-w-2xl w-full text-center py-12 px-10">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Certificate of Completion</p>
        <h1 className="text-2xl font-bold text-on-surface mb-1">Junior Data Analyst</h1>
        <p className="text-sm text-on-surface-variant mb-6">Job Simulation · Lumen Corporation</p>
        <div className="w-16 h-px bg-border mx-auto mb-6" />
        <p className="text-sm text-on-surface leading-relaxed mb-8">
          This certifies completion of the Junior Data Analyst Job Simulation,
          demonstrating hands-on experience in data cleaning, KPI reporting,
          customer segmentation, experiment analysis, and executive communication
          using a realistic commercial dataset.
        </p>
        <div className="bg-surface-low rounded-xl p-4 text-left mb-8">
          <p className="text-xs font-bold text-on-surface mb-2">LinkedIn shareable summary</p>
          <p className="text-xs text-on-surface-variant leading-relaxed italic">
            "Completed a virtual job simulation as a Junior Data Analyst: cleaned a 10k-row sales dataset,
            built a KPI dashboard, performed RFM customer segmentation, evaluated an A/B test, and
            delivered an executive brief — all using realistic commercial data."
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary px-6 py-2.5" onClick={() => navigate('/portfolio')}>
            Add to Portfolio
          </button>
          <button className="btn-secondary px-5 py-2.5" onClick={onBack}>
            Review Tasks
          </button>
        </div>
      </div>
      <button onClick={() => navigate('/simulations/da-job-sim/overview')} className="mt-6 text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
        ← Back to Overview
      </button>
    </div>
  )
}

export default function DASimulationWorkspace() {
  const navigate = useNavigate()
  const [currentTaskIdx, setCurrentTaskIdx]   = useState(0)
  const [completedTasks, setCompletedTasks]   = useState(new Set())
  const [modelRevealed, setModelRevealed]     = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [showQuiz, setShowQuiz]               = useState(false)
  const [quizAnswers, setQuizAnswers]         = useState({})
  const [quizSubmitted, setQuizSubmitted]     = useState(false)
  const [onboardingGate, setOnboardingGate]   = useState(null) // null=undecided, true=show onboarding, false=workspace
  const [leftTab, setLeftTab]                 = useState('Instructions') // Instructions | Hints | Solution
  const [gradeResult, setGradeResult]         = useState(null) // last sandbox/brief grading result for the active task
  const [instructionsWidth, setInstructionsWidth] = useState(34) // Instructions column width, in % — Editor always fills the rest
  const [progressOpen, setProgressOpen]       = useState(false) // task-list-with-progress popover
  const [solutionCopied, setSolutionCopied]   = useState(false) // "Copy code" button feedback in the Solution tab
  const [sandboxMinimized, setSandboxMinimized] = useState(false) // collapses the whole editor/sandbox column
  const paneRowRef = useRef(null)
  const progressRef = useRef(null)

  // Progress popover: close on outside click
  useEffect(() => {
    function handle(e) {
      if (progressRef.current && !progressRef.current.contains(e.target)) setProgressOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Drag-to-resize the divider between Instructions and the Editor
  const startPaneResize = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = instructionsWidth
    const totalWidth = paneRowRef.current?.offsetWidth || window.innerWidth
    const onMove = (moveEvent) => {
      const deltaPct = ((moveEvent.clientX - startX) / totalWidth) * 100
      setInstructionsWidth(Math.min(55, Math.max(18, startWidth + deltaPct)))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Backend sync: enrollment + task completions ────────────────────────────
  const { data: enrollment, isError: notEnrolled } = useEnrollment('da-job-sim')
  const { data: onboarding, isLoading: onboardingLoading } = useOnboarding('da-job-sim')
  const enroll        = useEnroll('da-job-sim')
  const completeTask  = useCompleteTask(enrollment?.id)
  const seededRef     = useRef(false)

  // Auto-enroll the first time a user opens the simulation
  useEffect(() => {
    if (notEnrolled && !enroll.isPending && !enroll.isSuccess) {
      enroll.mutate()
    }
  }, [notEnrolled])  // eslint-disable-line react-hooks/exhaustive-deps

  // Latch the onboarding gate once on first load (so accepting doesn't yank the
  // celebration screen out from under the user)
  useEffect(() => {
    if (onboarding && onboardingGate === null) {
      setOnboardingGate(!onboarding.accepted)
    }
  }, [onboarding, onboardingGate])

  // Restore progress from the DB once, and resume at the next unfinished task
  useEffect(() => {
    if (!enrollment?.task_completions || seededRef.current) return
    seededRef.current = true
    const doneIds = enrollment.task_completions.map(tc => tc.task_id)
    if (doneIds.length === 0) return
    setCompletedTasks(new Set(doneIds))
    const nextWork = [1, 2, 3, 4, 5].find(id => !doneIds.includes(id))
    const resumeIdx = nextWork != null ? TASKS.findIndex(t => t.id === nextWork) : TASKS.length - 1
    if (resumeIdx >= 0) setCurrentTaskIdx(resumeIdx)
  }, [enrollment])

  // Persist a completion to the backend (records it in task_completions)
  const persistCompletion = (taskId, { score = null, quizScore = null } = {}) => {
    if (!enrollment?.id) return
    completeTask.mutate({ taskId, score, quizScore, rubricRating: null })
  }

  const task             = TASKS[currentTaskIdx]
  const TaskIcon         = TASK_ICONS[task.id]
  const taskColor        = TASK_COLORS[task.id]
  const completedWorkTasks = [...completedTasks].filter(id => id > 0).length
  const isCurrentDone    = completedTasks.has(task.id)
  const canComplete      = !task.modelSolution || modelRevealed

  const resetQuiz = () => { setShowQuiz(false); setQuizAnswers({}); setQuizSubmitted(false) }

  const handleTaskSelect = (idx) => {
    setCurrentTaskIdx(idx)
    setModelRevealed(false)
    setLeftTab('Instructions')
    setGradeResult(null)
    setSandboxMinimized(false)
    resetQuiz()
  }

  const handleMarkComplete = () => {
    const updated = new Set(completedTasks)
    updated.add(task.id)
    setCompletedTasks(updated)
    persistCompletion(task.id, {})
    const workDone = [...updated].filter(id => id > 0).length
    if (workDone === 5) {
      setShowCertificate(true)
    } else if (currentTaskIdx < TASKS.length - 1) {
      setCurrentTaskIdx(currentTaskIdx + 1)
      setModelRevealed(false)
      resetQuiz()
    }
  }

  const handleContinueAfterQuiz = () => {
    const updated = new Set(completedTasks)
    updated.add(task.id)
    setCompletedTasks(updated)
    // Compute quiz score to store alongside the completion
    const quiz = TASK_QUIZZES[task.id]
    let quizScore = null
    if (quiz) {
      const correct = quiz.questions.filter((q, i) => quizAnswers[i] === q.correct).length
      quizScore = Math.round((correct / quiz.questions.length) * 100)
    }
    persistCompletion(task.id, { quizScore })
    const workDone = [...updated].filter(id => id > 0).length
    if (workDone === 5) {
      setShowCertificate(true)
    } else if (currentTaskIdx < TASKS.length - 1) {
      setCurrentTaskIdx(currentTaskIdx + 1)
      setModelRevealed(false)
      resetQuiz()
    }
  }

  // The sandbox endpoint already calls award_task_completion server-side
  // (real XP/skills for the verified score) — this just displays the result.
  // Never also call persistCompletion here, or XP/skills would be double-awarded.
  // Doesn't auto-advance: the student reviews the Preview/Result panel and
  // moves on manually via the task tabs, same as the Udemy exercise pattern.
  // "Run" (isSubmit: false) only previews — it never marks the task complete;
  // only "Submit for Grading" (isSubmit: true, the default) does.
  const handleSandboxGraded = (result, { isSubmit = true } = {}) => {
    setGradeResult(result)
    if (!isSubmit) return
    const updated = new Set(completedTasks)
    updated.add(task.id)
    setCompletedTasks(updated)
  }

  const goToNextTask = () => {
    const workDone = completedWorkTasks
    if (workDone >= 5) {
      setShowCertificate(true)
    } else if (currentTaskIdx < TASKS.length - 1) {
      handleTaskSelect(currentTaskIdx + 1)
    }
  }

  if (showCertificate) {
    return <CertificateView onBack={() => setShowCertificate(false)} />
  }

  // ── Onboarding gate: offer must be accepted before Week 1 starts ───────────
  // `onboardingGate` is latched on first load so accepting (which flips the
  // query's `accepted` flag) doesn't unmount the celebration mid-animation.
  if (onboardingLoading || onboardingGate === null) {
    return (
      <div className="max-w-container mx-auto px-6 py-24 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (onboardingGate) {
    return <SimOnboarding sim="da-job-sim" onAccept={() => setOnboardingGate(false)} />
  }

  // ── Group tasks by week — Week 2 unlocks after Week 1 is complete ──────────
  const week1Done = TASKS.filter(t => t.week === 1).every(t => completedTasks.has(t.id))
  const weekGroups = [
    { label: 'Week 1', tasks: TASKS.filter(t => t.week === 1) },
    ...(week1Done ? [{ label: 'Week 2', tasks: TASKS.filter(t => t.week === 2) }] : []),
  ]

  return (
    <div className="w-full px-6 py-6">

      {/* ── Company header ── */}
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
        <LumenLogo size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-base leading-tight">Lumen Corporation</span>
            <span className="chip bg-orange-100 text-orange-700 text-[10px]">Home & Lighting</span>
          </div>
          <p className="text-xs text-on-surface-variant">Growth & Analytics · Junior Data Analyst Job Simulation</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5"><MapPinIcon width={13} height={13} className="text-on-surface-variant/60" /> Remote-first · US/UK</span>
          <span className="hidden sm:flex items-center gap-1.5"><UsersIcon width={13} height={13} className="text-on-surface-variant/60" /> ~120 employees</span>
          <button className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/simulations/da-job-sim/overview')}>
            <ArrowLeftIcon width={12} height={12} /> Overview
          </button>
        </div>
      </div>

      {/* ── Breadcrumb + Progress ── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant min-w-0">
          <button className="hover:text-primary transition-colors cursor-pointer shrink-0" onClick={() => navigate('/simulations/da-job-sim/overview')}>Junior Data Analyst — Job Simulation</button>
          <span className="text-border shrink-0">/</span>
          <span className="text-on-surface font-medium truncate">{task.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(SANDBOX_STARTERS[task.id] || task.id === 5) && (
            <button
              onClick={() => setSandboxMinimized(m => !m)}
              className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer"
            >
              {sandboxMinimized ? <><RestoreIcon width={12} height={12} /> Restore Sandbox</> : <><MinimizeIcon width={12} height={12} /> Minimize Sandbox</>}
            </button>
          )}

          <div className="relative" ref={progressRef}>
          <button
            onClick={() => setProgressOpen(o => !o)}
            className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="w-16 h-1.5 bg-surface-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedWorkTasks / TASKS.length) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-on-surface whitespace-nowrap">{completedWorkTasks} of {TASKS.length} tasks</span>
            <ChevronDownIcon width={12} height={12} className={`text-on-surface-variant transition-transform duration-150 ${progressOpen ? 'rotate-180' : ''}`} />
          </button>

          {progressOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 py-3 px-3 animate-[fadeIn_0.15s_ease]">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest px-1 mb-2">Progress &amp; Completion</p>
              <div className="space-y-3">
                {weekGroups.map(({ label, tasks: wTasks }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1 mb-1">{label}</p>
                    <div className="space-y-1">
                      {wTasks.map(t => {
                        const idx      = TASKS.indexOf(t)
                        const isDone   = completedTasks.has(t.id)
                        const isActive = currentTaskIdx === idx
                        const Icon     = TASK_ICONS[t.id]
                        const color    = TASK_COLORS[t.id]
                        return (
                          <button
                            key={t.id}
                            onClick={() => { handleTaskSelect(idx); setProgressOpen(false) }}
                            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                              isActive ? 'bg-primary/8' : 'hover:bg-surface-low'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 text-white' : `${color.bgSoft} ${color.text}`}`}>
                              {isDone ? <CheckIcon width={12} height={12} /> : <Icon width={12} height={12} />}
                            </span>
                            <span className={isActive ? 'text-primary font-semibold' : 'text-on-surface'}>{t.title}</span>
                            {isDone && <span className="ml-auto text-[10px] font-semibold text-green-600 shrink-0">Done</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {!week1Done && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1 mb-1">Week 2</p>
                    <div className="flex items-center gap-2 px-2 py-2 text-xs text-on-surface-variant opacity-60">
                      <LockIcon width={13} height={13} /> Unlocks after Week 1
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <div ref={paneRowRef} className="flex items-stretch" style={{ height: 'calc(100vh - 260px)', minHeight: 640 }}>

        {/* ── Column 1: Instructions / Hints / Solution ── */}
        {/* width subtracts 9px so the divider handle (18px) doesn't push the row past 100% —
            expands to fill the row when the sandbox is minimized */}
        <div style={{ width: sandboxMinimized ? '100%' : `calc(${instructionsWidth}% - 9px)` }} className="shrink-0 flex flex-col min-h-0 transition-all duration-200">
          <div className="card overflow-hidden p-0 flex flex-col flex-1 min-h-0">
            {/* Task identity header — colored per task so each module reads as distinct */}
            <div className={`flex items-center gap-2.5 px-5 py-3 border-b border-border shrink-0 ${taskColor.bgSoft}`}>
              <div className={`w-8 h-8 rounded-lg ${taskColor.bg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <TaskIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${taskColor.text}`}>Task {task.id} of {TASKS.length}</p>
                <p className="text-sm font-bold text-on-surface truncate">{task.title.replace(/^Task \d+ — /, '')}</p>
              </div>
            </div>
            {/* Tab bar */}
            <div className="flex items-center gap-5 px-5 pt-4 border-b border-border shrink-0">
              {['Instructions', 'Hints', 'Solution'].map(tabName => {
                const disabled = (tabName === 'Hints' && !task.hints) || (tabName === 'Solution' && !task.modelSolution)
                if (disabled) return null
                return (
                  <button
                    key={tabName}
                    onClick={() => setLeftTab(tabName)}
                    className={`text-sm font-semibold pb-3 -mb-px border-b-2 transition-colors cursor-pointer ${
                      leftTab === tabName ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tabName}
                  </button>
                )
              })}
            </div>

            <div className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {/* ── Instructions tab ── */}
              {leftTab === 'Instructions' && (
                <>
                  {/* Email brief from Priya */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-50 to-transparent border-b border-border">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm ring-2 ring-white">
                        PS
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-on-surface">Priya Sharma</p>
                          <span className="chip bg-orange-100 text-orange-700 text-[10px] shrink-0">Manager</span>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">{task.subject}</p>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line px-4 py-3">{task.message}</p>
                  </div>

                  {/* Task 1: dataset schema + reference */}
                  {task.id === 1 && (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <DatabaseIcon width={17} height={17} />
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface text-sm mb-0.5">Your dataset — lumen_orders.csv</h3>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            ~9,850 rows of 18-month order history, pre-loaded as <code className="font-mono bg-surface-low px-1 rounded">dataset.csv</code> in your sandbox.
                            It has intentional messiness — that's the point.
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-on-surface text-sm">Dataset Schema</h3>
                          <span className="chip text-[10px]">11 columns</span>
                        </div>
                        <div className="overflow-auto rounded-lg border border-border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-surface-low border-b border-border">
                                <th className="text-left px-3 py-2 font-semibold text-on-surface">Column</th>
                                <th className="text-left px-3 py-2 font-semibold text-on-surface">Type</th>
                                <th className="text-left px-3 py-2 font-semibold text-on-surface">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {SCHEMA.map((row, i) => (
                                <tr key={row.col} className={i % 2 === 0 ? 'bg-white' : 'bg-surface-low/40'}>
                                  <td className="px-3 py-2 font-mono text-primary font-medium">{row.col}</td>
                                  <td className="px-3 py-2 text-on-surface-variant">{row.type}</td>
                                  <td className="px-3 py-2 text-on-surface-variant leading-relaxed">{row.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-base mt-0.5">🔗</span>
                          <div>
                            <p className="text-sm font-bold text-blue-900 mb-0.5">Real-World Reference Dataset</p>
                            <p className="text-xs text-blue-800 leading-relaxed mb-2">
                              The <strong>UCI Online Retail II</strong> dataset has ~1M real transactions — similar schema, same cleaning challenges.
                            </p>
                            <a
                              href="https://archive.ics.uci.edu/dataset/502/online+retail+ii"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-blue-300 hover:bg-blue-100 rounded-lg px-2.5 py-1 transition-colors"
                            >
                              UCI Online Retail II ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {task.whatToDo && (
                    <div>
                      <h3 className="font-bold text-on-surface text-sm mb-2">What to do</h3>
                      <ol className="space-y-2.5">
                        {task.whatToDo.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-white text-[10px] font-bold">{i + 1}</span>
                            </div>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {task.whatToSubmit && (
                    <div className="bg-surface-low rounded-lg p-3.5">
                      <h3 className="font-bold text-on-surface text-sm mb-2">What to submit</h3>
                      <ul className="space-y-1.5">
                        {task.whatToSubmit.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                            <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* ── Hints tab ── */}
              {leftTab === 'Hints' && task.hints && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span>💡</span>
                    <h3 className="font-bold text-amber-800 text-sm">Hints from Priya</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {task.hints.map((hint, i) => (
                      <li key={i} className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <span className="shrink-0 mt-0.5 text-amber-600">•</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Solution tab ── */}
              {leftTab === 'Solution' && task.modelSolution && (
                !modelRevealed ? (
                  <button
                    onClick={() => setModelRevealed(true)}
                    className="w-full flex items-center justify-between p-4 bg-surface-low rounded-lg hover:bg-primary/5 transition-colors border border-dashed border-border group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-primary group-hover:translate-x-0.5 transition-transform">▶</span>
                      <span className="font-semibold text-on-surface text-sm">Reveal Priya's model approach</span>
                    </div>
                    <span className="text-xs text-on-surface-variant">Open only after your own attempt</span>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                      <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">PS</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">Priya's model approach</p>
                        <p className="text-xs text-on-surface-variant">Walked through step by step, with the full working solution at the end</p>
                      </div>
                    </div>

                    {/* Step-by-step walkthrough */}
                    <div className="space-y-3 mb-5">
                      {task.modelSolution.solutionSteps.map((step, i) => (
                        <div key={i} className="border border-border rounded-lg overflow-hidden">
                          <div className="flex items-start gap-2.5 p-3 bg-surface-low">
                            <span className={`w-5 h-5 rounded-full ${TASK_COLORS[task.id].bg} text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-on-surface">{step.title}</p>
                              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">{step.detail}</p>
                            </div>
                          </div>
                          {step.code && (
                            <pre className="text-[11px] font-mono leading-relaxed text-on-surface bg-white p-3 overflow-x-auto whitespace-pre">{step.code}</pre>
                          )}
                        </div>
                      ))}
                    </div>

                    {task.modelSolution.keyPrinciple && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-3">
                        <p className="text-xs font-semibold text-primary mb-1">Key principle</p>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{task.modelSolution.keyPrinciple}</p>
                      </div>
                    )}
                    {task.modelSolution.greatLooksLike && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                        <p className="text-xs font-semibold text-green-700 mb-1">What "great" looks like</p>
                        <p className="text-xs text-green-700 leading-relaxed">{task.modelSolution.greatLooksLike}</p>
                      </div>
                    )}

                    {/* Full working solution, all steps combined */}
                    {task.modelSolution.fullSolutionCode && (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-surface-low border-b border-border">
                          <p className="text-xs font-bold text-on-surface">Full Solution Code</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(task.modelSolution.fullSolutionCode)
                              setSolutionCopied(true)
                              setTimeout(() => setSolutionCopied(false), 1500)
                            }}
                            className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                          >
                            {solutionCopied ? 'Copied ✓' : 'Copy code'}
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono leading-relaxed text-on-surface bg-white p-3 overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">{task.modelSolution.fullSolutionCode}</pre>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* ── Quiz / Next button — only for tasks with no sandbox/text submission ── */}
              {/* (sandboxed tasks 1–4 and the Task 5 brief complete via onGraded instead,
                  so this never double-completes / double-awards XP for those tasks) */}
              {leftTab === 'Instructions' && !isCurrentDone && !SANDBOX_STARTERS[task.id] && task.id !== 5 && (
                !showQuiz ? (
                  <button
                    onClick={() => {
                      if (!TASK_QUIZZES[task.id]) { handleMarkComplete() }
                      else { setShowQuiz(true) }
                    }}
                    className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {currentTaskIdx === TASKS.length - 1
                      ? 'Take Final Quiz & Earn Certificate →'
                      : `Take Quiz & Continue to ${TASKS[currentTaskIdx + 1]?.title} →`}
                  </button>
                ) : (
                  <div className="border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border">
                      <span className="text-base">📝</span>
                      <h3 className="font-bold text-on-surface text-sm">Knowledge Check</h3>
                      <span className="chip text-[10px] bg-primary/10 text-primary ml-auto">
                        {TASK_QUIZZES[task.id].questions.length} questions
                      </span>
                    </div>

                    <div className="space-y-7">
                      {TASK_QUIZZES[task.id].questions.map((q, qi) => {
                        const chosen    = quizAnswers[qi]
                        const submitted = quizSubmitted
                        return (
                          <div key={qi}>
                            <p className="text-sm font-semibold text-on-surface mb-3 leading-snug">
                              <span className="text-primary mr-1.5">{qi + 1}.</span>{q.q}
                            </p>
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => {
                                const isChosen  = chosen === oi
                                const isCorrect = oi === q.correct
                                let base = 'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-start gap-3 '
                                let dot  = 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold '
                                if (submitted) {
                                  if (isCorrect)               { base += 'bg-green-50 border-green-400 text-green-800'; dot += 'border-green-500 bg-green-500 text-white' }
                                  else if (isChosen)           { base += 'bg-red-50 border-red-300 text-red-700';       dot += 'border-red-400 bg-red-400 text-white' }
                                  else                         { base += 'bg-surface-low border-border text-on-surface-variant opacity-60'; dot += 'border-border' }
                                } else {
                                  if (isChosen)                { base += 'bg-primary/8 border-primary text-on-surface'; dot += 'border-primary bg-primary text-white' }
                                  else                         { base += 'bg-surface-low border-border hover:border-primary/40 text-on-surface-variant'; dot += 'border-border' }
                                }
                                return (
                                  <button
                                    key={oi}
                                    disabled={submitted}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                    className={base}
                                  >
                                    <span className={dot}>
                                      {submitted && isCorrect ? '✓' : submitted && isChosen ? '✗' : String.fromCharCode(65 + oi)}
                                    </span>
                                    <span className="leading-snug">{opt}</span>
                                  </button>
                                )
                              })}
                            </div>
                            {submitted && chosen !== q.correct && (
                              <p className="text-xs text-green-700 mt-2 ml-1">
                                ✓ Correct answer: {q.options[q.correct]}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {!quizSubmitted ? (
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(quizAnswers).length < TASK_QUIZZES[task.id].questions.length}
                        className="w-full btn-primary mt-6 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Submit Quiz
                      </button>
                    ) : (() => {
                      const quiz    = TASK_QUIZZES[task.id]
                      const correct = quiz.questions.filter((q, i) => quizAnswers[i] === q.correct).length
                      const pct     = Math.round((correct / quiz.questions.length) * 100)
                      return (
                        <div className="mt-6 space-y-3">
                          <div className={`p-3 rounded-lg text-sm font-semibold ${
                            pct === 100 ? 'bg-green-50 text-green-700 border border-green-200'
                            : pct >= 50  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {correct}/{quiz.questions.length} correct
                            {pct === 100 ? ' — Perfect! 🎉' : pct >= 50 ? ' — Good work!' : ' — Review the correct answers above.'}
                          </div>
                          <button onClick={handleContinueAfterQuiz} className="w-full btn-primary py-3 text-sm cursor-pointer">
                            {currentTaskIdx === TASKS.length - 1
                              ? 'Complete & Earn Certificate →'
                              : `Continue to ${TASKS[currentTaskIdx + 1]?.title} →`}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )
              )}

              {leftTab === 'Instructions' && isCurrentDone && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 font-semibold">
                  <CheckIcon width={14} height={14} /> Task complete
                </div>
              )}
            </div>
          </div>
        </div>

        {!sandboxMinimized && (
          <>
            {/* Drag handle: Instructions ↔ Editor */}
            <div
              onMouseDown={startPaneResize}
              title="Drag to resize"
              className="w-1.5 shrink-0 mx-1.5 rounded-full cursor-col-resize bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors"
            />

            {/* ── Column 2: Sandbox editor — always fills the remaining row width ── */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto">
              {isCurrentDone && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-semibold mb-3 shrink-0">
                  <CheckIcon width={13} height={13} /> Submitted & graded — resubmitting will re-grade
                </div>
              )}

              {SANDBOX_STARTERS[task.id] && (
                <JupyterPlayground
                  key={task.id}
                  starterCode={SANDBOX_STARTERS[task.id]}
                  enrollmentId={enrollment?.id}
                  taskId={task.id}
                  outputFilename={TASK_OUTPUT_FILE[task.id]}
                  onGraded={handleSandboxGraded}
                />
              )}
              {task.id === 5 && (
                <ExecutiveBriefSubmission key={task.id} enrollmentId={enrollment?.id} onGraded={handleSandboxGraded} />
              )}
              {!SANDBOX_STARTERS[task.id] && task.id !== 5 && (
                <div className="card text-center py-16">
                  <p className="text-xs text-on-surface-variant">No sandbox for this step.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Preview + Result — full-width section below the sandbox, only once Run/Submit produces a result ── */}
      {gradeResult && (
        <div className="mt-6 animate-[fadeIn_0.3s_ease]">
          <SandboxResultPanel
            gradeResult={gradeResult}
            taskId={task.id}
            onNext={goToNextTask}
            hasNext={isCurrentDone}
          />
        </div>
      )}

      <footer className="mt-8 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <LumenLogo size="sm" />
          <span>Lumen Corporation · Junior DA Job Simulation</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Help Center</a>
          <a href="#" className="hover:text-primary">Support</a>
        </div>
        <span>© 2025 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}

// ── Task 5: text submission graded by structural checks + an LLM judge ──────
function ExecutiveBriefSubmission({ enrollmentId, onGraded }) {
  const [text, setText] = useState('')
  const submitSandbox = useSubmitSandbox(enrollmentId, 5)

  const handleSubmit = async () => {
    if (!enrollmentId || !text.trim() || submitSandbox.isPending) return
    try {
      const result = await submitSandbox.mutateAsync({ text })
      onGraded?.({ ...result, submittedText: text })
    } catch { /* surfaced via submitSandbox.isError below */ }
  }

  return (
    <div className="rounded-xl border border-primary/20 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-950 border-b border-white/5">
        <ClipboardIcon width={14} height={14} className="text-violet-400" />
        <span className="text-xs font-semibold text-gray-200">Executive Brief</span>
        <span className="chip text-[10px] bg-violet-500/20 text-violet-300 ml-2">Reviewed by AI</span>
      </div>
      <div className="p-4 bg-white">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={14}
          placeholder="Situation → Key Findings → Recommendations. Aim for ≤ 400 words with exactly 3 prioritized recommendations…"
          className="input w-full text-sm resize-y leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-on-surface-variant">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitSandbox.isPending}
            className="btn-primary text-sm px-5 py-2 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitSandbox.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitSandbox.isPending ? 'Grading…' : 'Submit for Grading'}
          </button>
        </div>
        {submitSandbox.isError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
            {submitSandbox.error?.message || 'Could not grade this brief. Please try again.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Preview + Result panel (right column) — Udemy-style test output ────────
function PreviewContent({ gradeResult, taskId }) {
  const details = gradeResult.details || {}

  if (details.error) {
    return <p className="text-xs text-red-600">{details.error}</p>
  }

  if (taskId === 1 && details.preview_rows?.length) {
    return (
      <div className="overflow-auto">
        <table className="text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {details.preview_columns.map(c => (
                <th key={c} className="text-left px-2.5 py-1.5 font-semibold text-on-surface whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {details.preview_rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? '' : 'bg-surface-low/60'}>
                {details.preview_columns.map(c => (
                  <td key={c} className="px-2.5 py-1.5 whitespace-nowrap text-on-surface-variant">{String(row[c] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (details.submitted) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(details.submitted).map(([key, value]) => (
          typeof value === 'object' && value !== null ? (
            <div key={key} className="col-span-2 border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">{key.replace(/_/g, ' ')}</p>
              <div className="space-y-1">
                {Object.entries(value).map(([k2, v2]) => (
                  <div key={k2} className="flex justify-between text-sm gap-3">
                    <span className="text-on-surface-variant truncate">{k2}</span>
                    <span className="font-mono text-on-surface shrink-0">{typeof v2 === 'number' ? v2.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(v2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key={key} className="border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">{key.replace(/_/g, ' ')}</p>
              <p className="text-base font-bold text-on-surface font-mono truncate">
                {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value)}
              </p>
            </div>
          )
        ))}
      </div>
    )
  }

  if (gradeResult.submittedText) {
    return <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{gradeResult.submittedText}</p>
  }

  return <p className="text-sm text-on-surface-variant">No preview data available for this submission.</p>
}

const VERIFY_STEP_MS = 350

function VerifyIcon() {
  return <span className="w-[14px] h-[14px] border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
}

// Test-case checklist row — supports 3 states as the sequential reveal
// progresses: done (final pass/fail), current (spinner, actively "verifying"),
// pending (not reached yet, dimmed placeholder).
function CheckRow({ check, status }) {
  if (status === 'pending') {
    return (
      <div className="flex items-start gap-2.5 text-[13px] px-2.5 py-2 rounded-lg opacity-40">
        <span className="w-[18px] h-[18px] rounded-full border-2 border-border shrink-0 mt-0.5" />
        <span className="text-on-surface-variant">{check.label}</span>
      </div>
    )
  }
  if (status === 'current') {
    return (
      <div className="flex items-start gap-2.5 text-[13px] px-2.5 py-2 rounded-lg bg-primary/5">
        <span className="mt-0.5"><VerifyIcon /></span>
        <span className="text-on-surface">{check.label}<span className="text-on-surface-variant"> — verifying…</span></span>
      </div>
    )
  }
  return (
    <div className={`flex items-start gap-2.5 text-[13px] px-2.5 py-2 rounded-lg transition-colors ${check.pass ? '' : 'bg-red-50'}`}>
      <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${check.pass ? 'bg-green-500 text-white' : 'bg-red-200 text-red-700'}`}>
        {check.pass ? <CheckIcon width={10} height={10} /> : <span className="text-[10px] font-bold">✕</span>}
      </span>
      <span className={check.pass ? 'text-on-surface' : 'text-red-700'}>{check.label}</span>
    </div>
  )
}

function LogRow({ check, status }) {
  if (status === 'pending') {
    return (
      <div className="flex items-start gap-2 text-[13px] opacity-40">
        <span className="text-on-surface-variant">·</span>
        <span className="text-on-surface-variant">Waiting to verify — {check.label}</span>
      </div>
    )
  }
  if (status === 'current') {
    return (
      <div className="flex items-start gap-2 text-[13px]">
        <span className="mt-0.5"><VerifyIcon /></span>
        <span className="text-on-surface-variant">Verifying — {check.label}…</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2 text-[13px]">
      <span className={check.pass ? 'text-green-600' : 'text-red-600'}>{check.pass ? '✓' : '✗'}</span>
      <span className="text-on-surface-variant">Your code {check.pass ? 'passed' : 'failed'} this test — {check.label}</span>
    </div>
  )
}

function SandboxResultPanel({ gradeResult, taskId, onNext, hasNext }) {
  const [logTab, setLogTab] = useState('result') // 'result' | 'logs'
  const [revealedCount, setRevealedCount] = useState(0)
  const checks = gradeResult?.checks || []
  const total = checks.length

  // Every fresh Run/Submit produces a new gradeResult object, so this reveals
  // test cases one at a time (spinner → pass/fail) instead of dumping the
  // whole (already-known) result on screen at once — like a CI test runner.
  useEffect(() => {
    if (!gradeResult || total === 0) { setRevealedCount(total); return }
    setRevealedCount(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setRevealedCount(i)
      if (i >= total) clearInterval(id)
    }, VERIFY_STEP_MS)
    return () => clearInterval(id)
  }, [gradeResult, total])

  // Nothing renders in this section until the student clicks Run or Submit.
  if (!gradeResult) return null

  const verifying = revealedCount < total
  const passed    = checks.filter(c => c.pass).length
  const success   = gradeResult.score >= 70
  const isDryRun  = gradeResult.dry_run === true
  const color     = TASK_COLORS[taskId]

  const statusFor = (i) => (i < revealedCount ? 'done' : i === revealedCount ? 'current' : 'pending')

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className={`card overflow-hidden p-0 border-l-[3px] ${color.border}`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-low">
          <span className="text-sm font-bold text-on-surface">Preview</span>
          {verifying ? (
            <span className="text-sm font-semibold text-on-surface-variant/50 font-mono">···<span className="opacity-60">/100</span></span>
          ) : (
            <span className="text-sm font-semibold text-on-surface-variant animate-[fadeIn_0.25s_ease]">{gradeResult.score}<span className="opacity-60">/100</span></span>
          )}
        </div>
        <div className="p-5 max-h-72 overflow-auto text-[13px]">
          <PreviewContent gradeResult={gradeResult} taskId={taskId} />
        </div>
      </div>

      {/* Result */}
      <div className={`card overflow-hidden p-0 border-l-[3px] ${color.border}`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-bold text-on-surface">Result</span>
          {verifying ? (
            <span className="chip text-xs bg-surface-low text-on-surface-variant flex items-center gap-1.5">
              <VerifyIcon /> Verifying {revealedCount}/{total}…
            </span>
          ) : isDryRun ? (
            <span className="chip text-xs bg-blue-100 text-blue-700 animate-[fadeIn_0.25s_ease]">Preview run — not submitted</span>
          ) : (
            <span className={`chip text-xs animate-[fadeIn_0.25s_ease] ${success ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {success ? 'Success' : 'Needs Work'}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="sm:w-1/2 p-5">
            <p className="text-sm font-bold text-on-surface mb-1">Test Cases</p>
            <p className="text-xs text-on-surface-variant mb-3">
              {verifying ? `Verifying ${revealedCount} of ${total}…` : `Passed ${passed} of ${total} · Failed ${total - passed}`}
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checks.map((c, i) => <CheckRow key={c.id} check={c} status={statusFor(i)} />)}
            </div>
          </div>
          <div className="sm:w-1/2 p-5">
            <div className="flex items-center gap-4 mb-3 border-b border-border">
              <button onClick={() => setLogTab('result')} className={`text-sm font-semibold pb-2 -mb-px border-b-2 transition-colors cursor-pointer ${logTab === 'result' ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                Test result
              </button>
              <button onClick={() => setLogTab('logs')} className={`text-sm font-semibold pb-2 -mb-px border-b-2 transition-colors cursor-pointer ${logTab === 'logs' ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                User logs
              </button>
            </div>
            {logTab === 'result' ? (
              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {checks.map((c, i) => <LogRow key={c.id} check={c} status={statusFor(i)} />)}
                {!verifying && gradeResult.details?.justification && (
                  <div className="mt-2 p-3 rounded-lg text-[13px] leading-relaxed bg-violet-50 text-violet-800 animate-[fadeIn_0.25s_ease]">
                    AI review: {gradeResult.details.justification}
                  </div>
                )}
              </div>
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap text-on-surface-variant max-h-52 overflow-y-auto">
                {gradeResult.details?.stdout || '(no output)'}
                {gradeResult.details?.stderr && <span className="text-red-600">{'\n' + gradeResult.details.stderr}</span>}
              </pre>
            )}
          </div>
        </div>
        {hasNext && !verifying && (
          <div className="px-5 py-3.5 border-t border-border animate-[fadeIn_0.25s_ease]">
            <button onClick={onNext} className="btn-primary w-full text-sm py-2.5 cursor-pointer">
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
