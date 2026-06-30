import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import JupyterPlayground from './JupyterPlayground'
import { downloadLumenOrders } from '../../shared/utils/generateDataset'

// ── Lumen Commerce brand ──────────────────────────────────────────────────────
function LumenLogo({ size = 'md' }) {
  const s = { sm: 'w-7 h-7 rounded-lg', md: 'w-9 h-9 rounded-xl', lg: 'w-12 h-12 rounded-2xl' }[size]
  const icon = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }[size]
  return (
    <div className={`bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 shadow-sm ${s}`}>
      <svg viewBox="0 0 20 22" fill="none" className={icon}>
        <ellipse cx="10" cy="8.5" rx="6.5" ry="7" fill="white" fillOpacity="0.95" />
        <rect x="7" y="14" width="6" height="2.5" rx="1" fill="white" fillOpacity="0.8" />
        <rect x="7.5" y="16.5" width="5" height="1.5" rx="0.75" fill="white" fillOpacity="0.6" />
        <circle cx="10" cy="2" r="1" fill="white" fillOpacity="0.55" />
        <circle cx="16.5" cy="5" r="1" fill="white" fillOpacity="0.55" />
        <circle cx="3.5" cy="5" r="1" fill="white" fillOpacity="0.55" />
      </svg>
    </div>
  )
}

// ── Python starter code for Task 2 ───────────────────────────────────────────
const TASK2_STARTER = `import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# ── lumen_orders is pre-loaded as \`df\` ───────────────────────────────────
# Figures are captured automatically — no plt.savefig() or plt.show() needed
# Use print() to display DataFrames and values

# ── Step 1: Profile the raw data ─────────────────────────────────────────
print(f"Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
print(f"\\nMissing values:")
print(df.isnull().sum()[df.isnull().sum() > 0].to_string())
print(f"\\ndiscount_pct range: {df['discount_pct'].min():.1f} → {df['discount_pct'].max():.1f}")
print("unit_price range:   $" + f"{df['unit_price'].min():.2f}" + " to $" + f"{df['unit_price'].max():,.2f}")

# ── Step 2: Clean for revenue calculation ────────────────────────────────
df_clean = df.copy()
df_clean = df_clean[df_clean['quantity'] > 0]           # exclude returns
df_clean = df_clean[df_clean['unit_price'] > 0]         # exclude $0 promos / outlier
df_clean['disc'] = df_clean['discount_pct'].apply(
    lambda x: x / 100 if x > 1 else x                  # fix 0-100 scale entries
)
df_clean['net_revenue'] = (
    df_clean['quantity'] * df_clean['unit_price'] * (1 - df_clean['disc'])
)

# ── Step 3: Headline KPIs ─────────────────────────────────────────────────
rev    = df_clean['net_revenue'].sum()
orders = df_clean['order_id'].nunique()
aov    = rev / orders
upo    = df_clean['quantity'].sum() / orders

print("\\n" + "=" * 46)
print("  LUMEN COMMERCE — SALES OVERVIEW  (net)")
print("=" * 46)
print("  Total Revenue     $" + f"{rev:>14,.0f}")
print(f"  Order Count       {orders:>14,}")
print("  Avg Order Value   $" + f"{aov:>14.2f}")
print(f"  Units per Order   {upo:>14.2f}")
print("=" * 46)

# ── Step 4: Revenue by Channel ────────────────────────────────────────────
ch = (
    df_clean.groupby('channel', dropna=False)['net_revenue']
    .agg(revenue='sum', orders='count')
    .assign(aov=lambda x: x['revenue'] / x['orders'])
    .sort_values('revenue', ascending=False)
)
ch.index = ch.index.fillna('(no channel)')
print("\\nRevenue by Channel:")
print(ch.round(2).to_string())

# ── Step 5: Revenue by Category ───────────────────────────────────────────
cat = (
    df_clean.groupby('product_category')['net_revenue']
    .agg(revenue='sum', orders='count')
    .sort_values('revenue', ascending=False)
)
print("\\nRevenue by Category:")
print(cat.to_string())

# ── Step 6: Charts ────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

# Chart 1 — Revenue by Channel
ch['revenue'].plot(kind='bar', ax=axes[0], color='#6366f1', edgecolor='white', width=0.6)
axes[0].set_title('Net Revenue by Channel', fontsize=12, fontweight='bold', pad=10)
axes[0].set_xlabel('')
axes[0].set_ylabel('Revenue ($)')
axes[0].yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'$\{v/1e6:.1f\}M'))
axes[0].tick_params(axis='x', rotation=25)

# Chart 2 — AOV by Channel (volume vs value insight)
ch['aov'].plot(kind='bar', ax=axes[1], color='#f59e0b', edgecolor='white', width=0.6)
axes[1].set_title('Avg Order Value by Channel', fontsize=12, fontweight='bold', pad=10)
axes[1].set_xlabel('')
axes[1].set_ylabel('AOV ($)')
axes[1].yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'$\{v:.0f\}'))
axes[1].tick_params(axis='x', rotation=25)

plt.suptitle('Lumen Commerce — Channel Performance', fontsize=13, y=1.02)
plt.tight_layout()
# Figure is captured automatically
`

// ── Evaluation logic for Task 2 ──────────────────────────────────────────────
function scoreTask2Output(stdout, figCount) {
  const t = stdout.toLowerCase()
  const checks = [
    {
      id: 'revenue',
      label: 'Total Revenue calculated',
      pts: 20,
      pass: /total revenue|net revenue/.test(t) || (/revenue/.test(t) && /\$[\s\d,]+/.test(stdout)),
    },
    {
      id: 'orders',
      label: 'Order Count calculated',
      pts: 15,
      pass: /order count|num orders|total orders/.test(t) || (/order/.test(t) && /\d{3,4}/.test(stdout)),
    },
    {
      id: 'aov',
      label: 'Average Order Value (AOV)',
      pts: 15,
      pass: /avg order value|average order|aov/.test(t),
    },
    {
      id: 'upo',
      label: 'Units per Order',
      pts: 10,
      pass: /units per order|units\/order|\bupo\b/.test(t),
    },
    {
      id: 'channel',
      label: 'Revenue by Channel breakdown',
      pts: 15,
      pass: t.includes('channel') && (t.includes('paid search') || t.includes('email') || t.includes('organic') || t.includes('social')),
    },
    {
      id: 'category',
      label: 'Revenue by Category breakdown',
      pts: 15,
      pass: t.includes('categor') && (t.includes('lighting') || t.includes('furniture') || t.includes('outdoor') || t.includes('décor') || t.includes('accessories')),
    },
    {
      id: 'charts',
      label: 'Charts / visualizations produced',
      pts: 10,
      pass: figCount > 0,
    },
  ]
  const score = checks.reduce((sum, c) => sum + (c.pass ? c.pts : 0), 0)
  return { score, checks, total: 100 }
}

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
const TASKS = [
  {
    id: 0,
    week: 0,
    title: 'Onboarding',
    icon: '👋',
    isOnboarding: true,
    subject: 'Welcome to Growth & Analytics 👋',
    message: `Hey, and welcome to the team! Really glad to have you.\n\nHere's how I work: I'll send you a task as if you were any other analyst on my team. Take a real swing at it before you peek at how I'd have approached it — that's where the learning is. Don't worry about perfect; worry about defensible. Every number you give leadership, you should be able to explain.\n\nYour first few weeks are about earning trust with data. We're a lean team, so the analyst who can clean data, find the story, and explain it simply is worth their weight in gold. Let's get into it.`,
    whatToDo: null,
    whatToSubmit: [
      'Set up your tool of choice — Excel / Google Sheets, SQL, or a Python notebook',
      'Download and load lumen_orders.csv (~9,850 rows). Explore its shape: how many columns, what are the types, anything obviously off?',
    ],
    hints: null,
    modelSolution: null,
    skills: null,
  },
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
      points: [
        'Duplicates: De-dupe on order_id, keeping the first occurrence — but verify the dupes are true copies (same customer, same timestamp), not legitimately distinct order lines.',
        'Dates: Parse all formats to ISO YYYY-MM-DD. Blank dates get flagged, not dropped — they may still carry valid revenue data.',
        'Negative quantities: These are returns, not errors. Add an is_return boolean flag so any downstream analysis can include or exclude them deliberately.',
        'Prices: unit_price = 0 is likely a promotional freebie → flag as promo. The $99,999 entry is clearly a data-entry error → cap at a sensible ceiling (e.g. 99th percentile) or exclude with a note.',
        'Categories: Build a mapping table ("Lightng" → "Lighting", "lighting" → "Lighting") and apply it programmatically. Never hand-edit row by row — it\'s not reproducible.',
        'discount_pct: Any value > 1 was entered on the 0–100 scale → divide by 100 to normalize.',
      ],
      keyPrinciple: 'A good analyst makes data auditable, not just clean. The log is the real deliverable — anyone should be able to reproduce your cleaned file by reading it.',
      greatLooksLike: 'You can defend every decision and explicitly flagged ambiguity instead of hiding it. Your cleaning log is a document someone else could hand to a new analyst and get the same result.',
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
      points: [
        'Define net revenue upfront: gross minus discounts, returns excluded (or shown separately). Leadership needs to know what definition they\'re looking at.',
        'A monthly trend line + a channel/category bar chart covers 90% of what execs ask in a first pass.',
        'Strong insight pattern: volume vs. value. The channel with the most orders is almost never the one with the highest AOV — that tension is the story worth surfacing.',
        'Always annotate the revenue definition on the chart itself, not buried in a footnote. If someone screenshots your slide for a deck, the definition travels with it.',
      ],
      keyPrinciple: null,
      greatLooksLike: 'An exec could read it in 30 seconds and walk away with one clear, decision-worthy insight — not a page of numbers to interpret themselves.',
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
      points: [
        'Aggregate to the customer level first: GROUP BY customer_id, then compute MAX(order_date), COUNT(order_id), SUM(net_revenue).',
        'Quintile-score each dimension. For Recency, a lower raw value (more recent) should map to a higher score. For F and M, higher is better.',
        '"Champions" = high on all three (e.g., R≥4, F≥4, M≥4) → reward with loyalty perks and referral asks. "At-Risk" = high M but low R (M≥4, R≤2) → win-back campaign with a time-limited offer. "New" = high R but low F (R≥4, F=1) → nurture toward second purchase. "Hibernating" = low on all three → low investment or suppress.',
        'Highest-leverage segment is almost always high-value-but-lapsing (At-Risk): cheapest to win back, biggest revenue downside if permanently lost.',
        'Guest checkouts excluded from RFM should be quantified: "Guests represent X% of revenue and are a measurable blind spot — a login incentive could convert them."',
      ],
      keyPrinciple: null,
      greatLooksLike: 'Every segment ends in a concrete recommended action, not just a label. Marketing can take your brief straight into a campaign brief without asking follow-up questions.',
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
      points: [
        'Start with a sanity check: are the two groups roughly the same size? A 60/40 split is a yellow flag. A 90/10 split is a red one — the assignment logic may have been flawed.',
        'Compare the primary metric. Then ask: is the lift practically significant? A 0.3% AOV increase on 500 users is noise. A 12% AOV increase on 4,000 users is worth discussing.',
        'Analysts with stats background: run a Welch\'s t-test or Mann-Whitney U. No stats background: reason about sample size and magnitude — a 5% lift with n > 2,000 per group is a reasonable signal.',
        'The senior move: free-shipping raises AOV by incentivizing cart padding, but also raises fulfillment costs on every qualifying order. A real AOV lift can still be margin-negative. Flag this even if the PM didn\'t ask.',
        '"Don\'t ship yet — here\'s what I\'d measure first" is often the correct, mature answer. Saying so makes you more trusted, not less.',
      ],
      keyPrinciple: null,
      greatLooksLike: "You resisted the PM's certainty, reasoned from evidence, and considered profit not just revenue. The recommendation is defensible even if the PM disagrees.",
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
      points: [
        'Structure that works every time: (1) one-sentence bottom line, (2) 3 findings with supporting data points, (3) 3 recommendations ranked by impact × confidence, (4) one sentence on what you\'d track to know if it worked.',
        'Translate every metric into a business consequence: not "Email AOV is 22% higher" but "shifting 10% of Paid Search budget toward Email could grow revenue $X without increasing traffic costs."',
        'Order recommendations: highest confidence × highest impact goes first. Don\'t bury the lead.',
        'Include one risk or caveat — it shows judgment, not weakness. Executives distrust memos that have no caveats.',
        'The promotion skill: an analyst who makes the VP\'s decision easier is worth more than one with prettier charts. Your job is to reduce the cognitive load, not increase it.',
      ],
      keyPrinciple: null,
      greatLooksLike: "A non-technical VP reads it once and knows exactly what to approve, what to question, and what to watch. She doesn't need to ask a follow-up.",
    },
    skills: ['Synthesis', 'Executive communication', 'Prioritization', 'Data storytelling'],
  },
]

const RUBRIC = [
  {
    id: 'correctness',
    label: 'Correctness',
    ratings: [
      { value: 0, label: 'Not yet', desc: "Numbers don't reconcile" },
      { value: 1, label: 'Solid',   desc: 'Mostly correct, minor gaps' },
      { value: 2, label: 'Strong',  desc: 'Verified and reproducible' },
    ],
  },
  {
    id: 'reasoning',
    label: 'Reasoning',
    ratings: [
      { value: 0, label: 'Not yet', desc: 'Decisions unexplained' },
      { value: 1, label: 'Solid',   desc: 'Choices justified' },
      { value: 2, label: 'Strong',  desc: 'Trade-offs considered' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    ratings: [
      { value: 0, label: 'Not yet', desc: 'Hard to follow' },
      { value: 1, label: 'Solid',   desc: 'Clear and structured' },
      { value: 2, label: 'Strong',  desc: 'Non-expert acts on it' },
    ],
  },
  {
    id: 'judgment',
    label: 'Judgment',
    ratings: [
      { value: 0, label: 'Not yet', desc: 'Took data at face value' },
      { value: 1, label: 'Solid',   desc: 'Caught obvious issues' },
      { value: 2, label: 'Strong',  desc: 'Flagged what was not asked' },
    ],
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
        <p className="text-sm text-on-surface-variant mb-6">Job Simulation · Lumen Commerce</p>
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
      <button onClick={() => navigate('/courses')} className="mt-6 text-xs text-on-surface-variant hover:text-primary transition-colors">
        ← Back to Course Catalog
      </button>
    </div>
  )
}

export default function DASimulationWorkspace() {
  const navigate = useNavigate()
  const [currentTaskIdx, setCurrentTaskIdx]   = useState(0)
  const [completedTasks, setCompletedTasks]   = useState(new Set())
  const [modelRevealed, setModelRevealed]     = useState(false)
  const [rubricRatings, setRubricRatings]     = useState({})
  const [reflections, setReflections]         = useState({})
  const [showCertificate, setShowCertificate] = useState(false)
  const [task2Eval, setTask2Eval]             = useState(null)
  const [showQuiz, setShowQuiz]               = useState(false)
  const [quizAnswers, setQuizAnswers]         = useState({})
  const [quizSubmitted, setQuizSubmitted]     = useState(false)

  const task             = TASKS[currentTaskIdx]
  const taskRatings      = rubricRatings[task.id] || {}
  const taskReflection   = reflections[task.id] || ''
  const completedWorkTasks = [...completedTasks].filter(id => id > 0).length
  const isCurrentDone    = completedTasks.has(task.id)
  const canComplete      = !task.modelSolution || modelRevealed

  const resetQuiz = () => { setShowQuiz(false); setQuizAnswers({}); setQuizSubmitted(false) }

  const handleTaskSelect = (idx) => {
    setCurrentTaskIdx(idx)
    setModelRevealed(false)
    resetQuiz()
  }

  const handleMarkComplete = () => {
    const updated = new Set(completedTasks)
    updated.add(task.id)
    setCompletedTasks(updated)
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
    const workDone = [...updated].filter(id => id > 0).length
    if (workDone === 5) {
      setShowCertificate(true)
    } else if (currentTaskIdx < TASKS.length - 1) {
      setCurrentTaskIdx(currentTaskIdx + 1)
      setModelRevealed(false)
      resetQuiz()
    }
  }

  const handleRating = (criterionId, value) => {
    setRubricRatings(prev => ({
      ...prev,
      [task.id]: { ...(prev[task.id] || {}), [criterionId]: value },
    }))
  }

  const handleEvaluate = ({ stdout, figCount }) => {
    setTask2Eval(scoreTask2Output(stdout, figCount))
  }

  if (showCertificate) {
    return <CertificateView onBack={() => setShowCertificate(false)} />
  }

  // ── Group tasks by week — Week 2 unlocks after Week 1 is complete ──────────
  const week1Done = TASKS.filter(t => t.week === 1).every(t => completedTasks.has(t.id))
  const weekGroups = [
    { label: 'Onboarding', tasks: TASKS.filter(t => t.week === 0) },
    { label: 'Week 1',     tasks: TASKS.filter(t => t.week === 1) },
    ...(week1Done ? [{ label: 'Week 2', tasks: TASKS.filter(t => t.week === 2) }] : []),
  ]

  return (
    <div className="max-w-container mx-auto px-6 py-6">

      {/* ── Company header ── */}
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
        <LumenLogo size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-base leading-tight">Lumen Commerce</span>
            <span className="chip bg-orange-100 text-orange-700 text-[10px]">Home & Lighting</span>
          </div>
          <p className="text-xs text-on-surface-variant">Growth & Analytics · Junior Data Analyst Job Simulation</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          <span>📍 Remote-first · US/UK</span>
          <span className="hidden sm:block">👥 ~120 employees</span>
          <button className="hover:text-primary" onClick={() => navigate('/courses')}>← Catalog</button>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
        <button className="hover:text-primary" onClick={() => navigate('/courses')}>Courses</button>
        <span>/</span>
        <button className="hover:text-primary" onClick={() => navigate('/courses/da-job-sim')}>Junior DA Sim</button>
        <span>/</span>
        <span className="text-on-surface font-medium">{task.title}</span>
      </div>

      {/* ── Week-grouped task tabs ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        {weekGroups.map(({ label, tasks: wTasks }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">{label}</span>
            <span className="text-border">›</span>
            {wTasks.map(t => {
              const idx    = TASKS.indexOf(t)
              const isDone = completedTasks.has(t.id)
              const isActive = currentTaskIdx === idx
              return (
                <button
                  key={t.id}
                  onClick={() => handleTaskSelect(idx)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    isActive
                      ? 'bg-primary text-white border-primary'
                      : isDone
                      ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                      : 'bg-surface-low text-on-surface-variant border-border hover:text-on-surface hover:border-primary/40'
                  }`}
                >
                  <span className="text-[11px]">{isDone ? '✓' : t.icon}</span>
                  <span>{t.title}</span>
                </button>
              )
            })}
          </div>
        ))}
        {!week1Done && (
          <div className="flex items-center gap-1.5 opacity-40">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Week 2</span>
            <span className="text-border">›</span>
            <span className="text-xs text-on-surface-variant px-2 py-1 rounded-lg border border-dashed border-border">🔒 Unlocks after Week 1</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Main panel ── */}
        <div className="col-span-2 space-y-4">

          {/* ── Email brief from Priya ── */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">PN</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-on-surface">Priya Nair</p>
                  <span className="chip bg-orange-100 text-orange-700 text-[10px] shrink-0">Sr. Analytics Manager</span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">Subject: {task.subject}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{task.message}</p>
          </div>

          {/* ── Onboarding: setup checklist + schema ── */}
          {task.isOnboarding && (
            <>
              {/* Setup checklist */}
              <div className="card">
                <h3 className="font-bold text-on-surface text-sm mb-4">Your First Day Checklist</h3>
                <div className="space-y-4">
                  {[
                    {
                      n: 1,
                      title: 'Choose your analysis tool',
                      desc: 'Excel, Google Sheets, SQL, or Python — all work. Stick with what you know; the skill is in the thinking, not the tool.',
                    },
                    {
                      n: 2,
                      title: 'Download lumen_orders.csv',
                      desc: '~9,850 rows of 18-month order history for Lumen Commerce. Has intentional messiness — that\'s the point.',
                      action: (
                        <button
                          onClick={downloadLumenOrders}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 2v9M4 8l4 4 4-4" /><path d="M2 14h12" />
                          </svg>
                          Download lumen_orders.csv
                        </button>
                      ),
                    },
                    {
                      n: 3,
                      title: 'Read Priya\'s welcome note (above) and scan the dataset schema',
                      desc: 'Understand every column before you touch the data. Then click "Begin Week 1" to start Task 1.',
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs shrink-0 mt-0.5">
                        {step.n}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface text-sm">{step.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{step.desc}</p>
                        {step.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dataset schema */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-on-surface text-sm">Dataset Schema — lumen_orders.csv</h3>
                  <span className="chip text-[10px]">11 columns</span>
                </div>
                <div className="overflow-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-low border-b border-border">
                        <th className="text-left px-3 py-2 font-semibold text-on-surface">Column</th>
                        <th className="text-left px-3 py-2 font-semibold text-on-surface">Type</th>
                        <th className="text-left px-3 py-2 font-semibold text-on-surface">Notes / Known Issues</th>
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
                <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
                  The italicized notes above are your first data-quality clues — use them to plan your cleaning pass in Task 1.
                </p>
              </div>

              {/* Reference dataset card */}
              <div className="card border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">🔗</span>
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-0.5">Real-World Reference Dataset</p>
                    <p className="text-xs text-blue-800 leading-relaxed mb-3">
                      Finished with lumen_orders and want to practice on real data? The <strong>UCI Online Retail II</strong> dataset
                      contains ~1 million real transactions from a UK-based online gift retailer (2009–2011) — similar
                      schema, same cleaning challenges.
                    </p>
                    <a
                      href="https://archive.ics.uci.edu/dataset/502/online+retail+ii"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-blue-300 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M10 3h3v3M6 10l7-7M5 5H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1v-2" />
                      </svg>
                      UCI Online Retail II — archive.ics.uci.edu
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── What to do ── */}
          {task.whatToDo && (
            <div className="card">
              <h3 className="font-bold text-on-surface text-sm mb-3">What to do</h3>
              <ol className="space-y-3">
                {task.whatToDo.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">{i + 1}</span>
                    </div>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── What to submit ── */}
          {task.whatToSubmit && (
            <div className="card bg-surface-low">
              <h3 className="font-bold text-on-surface text-sm mb-2">What to submit</h3>
              <ul className="space-y-2">
                {task.whatToSubmit.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                    <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Hints ── */}
          {task.hints && (
            <div className="card border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-2">
                <span>💡</span>
                <h3 className="font-bold text-amber-800 text-sm">Hints from Priya</h3>
              </div>
              <ul className="space-y-2">
                {task.hints.map((hint, i) => (
                  <li key={i} className="text-xs text-amber-700 leading-relaxed flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">•</span>
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Python Playground + Evaluation — Task 2 only ── */}
          {task.id === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🐍</span>
                  <h3 className="font-bold text-on-surface text-sm">Write & Run Your Analysis</h3>
                  <span className="chip text-[10px] bg-green-100 text-green-700">Runs in your browser</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                  The starter code below calculates all four KPIs and produces two channel-performance charts.
                  Edit freely — try adding a monthly trend, a category breakdown, or your own insight.
                  Figures are captured automatically; use{' '}
                  <code className="font-mono bg-surface-low px-1 rounded">print()</code> for DataFrames and values.
                </p>
                <JupyterPlayground starterCode={TASK2_STARTER} onEvaluate={handleEvaluate} />
              </div>

              {/* ── Auto-evaluation panel ── */}
              {task2Eval && (
                <div className="card border-primary/20">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📋</span>
                      <h3 className="font-bold text-on-surface text-sm">Code Evaluation</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-2xl font-bold ${
                        task2Eval.score >= 80 ? 'text-green-600'
                        : task2Eval.score >= 50 ? 'text-amber-600'
                        : 'text-red-500'
                      }`}>
                        {task2Eval.score}
                      </div>
                      <span className="text-sm text-on-surface-variant">/ {task2Eval.total}</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-2 bg-surface-low rounded-full mb-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        task2Eval.score >= 80 ? 'bg-green-500'
                        : task2Eval.score >= 50 ? 'bg-amber-400'
                        : 'bg-red-400'
                      }`}
                      style={{ width: `${task2Eval.score}%` }}
                    />
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2">
                    {task2Eval.checks.map(check => (
                      <div key={check.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            check.pass ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'
                          }`}>
                            {check.pass ? '✓' : '✗'}
                          </span>
                          <span className={check.pass ? 'text-on-surface' : 'text-on-surface-variant'}>{check.label}</span>
                        </div>
                        <span className={`font-semibold ${check.pass ? 'text-green-600' : 'text-on-surface-variant/40'}`}>
                          +{check.pts}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Grade message */}
                  <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed ${
                    task2Eval.score === 100 ? 'bg-green-50 text-green-800'
                    : task2Eval.score >= 80  ? 'bg-green-50 text-green-800'
                    : task2Eval.score >= 50  ? 'bg-amber-50 text-amber-800'
                    : 'bg-red-50 text-red-800'
                  }`}>
                    {task2Eval.score === 100
                      ? '🏆 Perfect score — all KPIs calculated, both breakdowns, and charts produced. Excellent work!'
                      : task2Eval.score >= 80
                      ? '✅ Strong submission. Check which items scored 0 and see if you can add them.'
                      : task2Eval.score >= 50
                      ? '⚡ Good start. Review the missing checks above — they\'re the core of any sales report.'
                      : '💪 Keep going. Run the starter code first to see the expected output, then customise from there.'}
                  </div>

                  <p className="text-[11px] text-on-surface-variant mt-3">
                    Evaluation is based on keywords detected in your code's output. Re-run after edits to update your score.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Model solution reveal ── */}
          {task.modelSolution && (
            <div className="card">
              {!modelRevealed ? (
                <button
                  onClick={() => setModelRevealed(true)}
                  className="w-full flex items-center justify-between p-4 bg-surface-low rounded-lg hover:bg-primary/5 transition-colors border border-dashed border-border group"
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
                      <span className="text-white text-xs font-bold">PN</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">Priya's model approach</p>
                      <p className="text-xs text-on-surface-variant">How an experienced analyst would think through this</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-4">
                    {task.modelSolution.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                        <span className="text-primary font-bold mt-0.5 shrink-0">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  {task.modelSolution.keyPrinciple && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-3">
                      <p className="text-xs font-semibold text-primary mb-1">Key principle</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{task.modelSolution.keyPrinciple}</p>
                    </div>
                  )}
                  {task.modelSolution.greatLooksLike && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-semibold text-green-700 mb-1">What "great" looks like</p>
                      <p className="text-xs text-green-700 leading-relaxed">{task.modelSolution.greatLooksLike}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Quiz / Next button ── */}
          {!isCurrentDone && (
            !showQuiz ? (
              <button
                onClick={() => {
                  if (!TASK_QUIZZES[task.id]) { handleMarkComplete() }
                  else { setShowQuiz(true) }
                }}
                className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2"
              >
                {task.id === 0
                  ? 'Begin Week 1 →'
                  : currentTaskIdx === TASKS.length - 1
                  ? 'Take Final Quiz & Earn Certificate →'
                  : `Take Quiz & Continue to ${TASKS[currentTaskIdx + 1]?.title} →`}
              </button>
            ) : (
              <div className="card border-primary/20">
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
                      <button onClick={handleContinueAfterQuiz} className="w-full btn-primary py-3 text-sm">
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

          {isCurrentDone && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 font-semibold">
              <span>✓</span> Task complete
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="col-span-1 space-y-4">

          {/* Progress */}
          <div className="card bg-primary text-white">
            <div className="flex items-center gap-2 mb-1">
              <LumenLogo size="sm" />
              <div>
                <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wide">Lumen Commerce</p>
                <p className="text-[10px] opacity-50">Junior DA Simulation</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">
              {completedWorkTasks} <span className="text-sm font-normal opacity-70">of 5 tasks done</span>
            </p>
            <div className="mt-3 bg-white/20 rounded-full h-1.5">
              <div
                className="bg-white rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${(completedWorkTasks / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs opacity-60 mt-2">
              {completedWorkTasks === 0
                ? 'Complete tasks to earn your certificate'
                : completedWorkTasks === 5
                ? 'All tasks complete!'
                : `${5 - completedWorkTasks} tasks remaining`}
            </p>
          </div>

          {/* Self-assessment rubric */}
          {task.modelSolution && modelRevealed && (
            <div className="card">
              <h3 className="font-bold text-on-surface text-sm mb-3">Self-Assessment</h3>
              <p className="text-xs text-on-surface-variant mb-3">Rate your submission against each criterion.</p>
              <div className="space-y-3">
                {RUBRIC.map(criterion => (
                  <div key={criterion.id}>
                    <p className="text-xs font-semibold text-on-surface mb-1.5">{criterion.label}</p>
                    <div className="flex gap-1">
                      {criterion.ratings.map(rating => {
                        const selected = taskRatings[criterion.id] === rating.value
                        const colors = [
                          'border-red-300 bg-red-50 text-red-700',
                          'border-blue-300 bg-blue-50 text-blue-700',
                          'border-green-300 bg-green-50 text-green-700',
                        ]
                        return (
                          <button
                            key={rating.value}
                            onClick={() => handleRating(criterion.id, rating.value)}
                            title={rating.desc}
                            className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold text-center transition-colors border ${
                              selected
                                ? colors[rating.value]
                                : 'bg-surface-low text-on-surface-variant border-border hover:border-primary/40'
                            }`}
                          >
                            {rating.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflection */}
          {task.modelSolution && modelRevealed && (
            <div className="card">
              <h3 className="font-bold text-on-surface text-sm mb-1">Reflection</h3>
              <p className="text-xs text-on-surface-variant mb-2 leading-relaxed">
                What would you do differently with another day? What's one thing you're now unsure about?
              </p>
              <textarea
                value={taskReflection}
                onChange={e => setReflections(prev => ({ ...prev, [task.id]: e.target.value }))}
                rows={4}
                placeholder="Write your reflection here..."
                className="input resize-none text-xs w-full"
              />
            </div>
          )}

          {/* Skills practiced */}
          {task.skills && (
            <div className="card">
              <span className="section-label">Skills Practiced</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.skills.map(skill => (
                  <span key={skill} className="chip text-xs">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Dataset card */}
          <div className="card bg-surface-low">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-base">📂</span>
              <div>
                <p className="text-xs font-semibold text-on-surface">Working dataset</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  <span className="font-mono text-primary">lumen_orders.csv</span> · ~9,850 rows · 11 columns
                </p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Excel, Google Sheets, SQL, or Python — your choice.
                </p>
              </div>
            </div>
            <button
              onClick={downloadLumenOrders}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5 active:bg-primary/10 rounded-lg py-2 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v9M4 8l4 4 4-4" /><path d="M2 14h12" />
              </svg>
              Download lumen_orders.csv
            </button>
          </div>

          {/* Week 2 preview — shown during Week 1 tasks */}
          {task.week === 1 && (
            <div className="card border-primary/15 bg-primary/3">
              <p className="text-xs font-semibold text-on-surface mb-2">Coming in Week 2</p>
              <div className="space-y-1.5">
                {TASKS.filter(t => t.week === 2).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="text-[11px]">{t.icon}</span>
                    <span>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <LumenLogo size="sm" />
          <span>Lumen Commerce · Junior DA Job Simulation</span>
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
