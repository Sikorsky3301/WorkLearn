import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import JupyterPlayground from '../components/JupyterPlayground'

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

const TASKS = [
  {
    id: 0,
    title: 'Onboarding',
    icon: '👋',
    isOnboarding: true,
    subject: 'Welcome to Growth & Analytics 👋',
    message: `Hey, and welcome to the team! Really glad to have you.\n\nHere's how I work: I'll send you a task as if you were any other analyst on my team. Take a real swing at it before you peek at how I'd have approached it — that's where the learning is. Don't worry about perfect; worry about defensible. Every number you give leadership, you should be able to explain.\n\nYour first few weeks are about earning trust with data. We're a lean team, so the analyst who can clean data, find the story, and explain it simply is worth their weight in gold. Let's get into it.`,
    whatToDo: null,
    whatToSubmit: [
      'Set up your tool of choice — Excel / Google Sheets, SQL, or a Python notebook',
      'Download and load lumen_orders.csv (~10,000 rows). Explore its shape: how many columns, what are the types, anything obviously off?',
    ],
    hints: null,
    modelSolution: null,
    skills: null,
  },
  {
    id: 1,
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
      { value: 1, label: 'Solid', desc: 'Mostly correct, minor gaps' },
      { value: 2, label: 'Strong', desc: 'Verified and reproducible' },
    ],
  },
  {
    id: 'reasoning',
    label: 'Reasoning',
    ratings: [
      { value: 0, label: 'Not yet', desc: 'Decisions unexplained' },
      { value: 1, label: 'Solid', desc: 'Choices justified' },
      { value: 2, label: 'Strong', desc: 'Trade-offs considered' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    ratings: [
      { value: 0, label: 'Not yet', desc: 'Hard to follow' },
      { value: 1, label: 'Solid', desc: 'Clear and structured' },
      { value: 2, label: 'Strong', desc: 'Non-expert acts on it' },
    ],
  },
  {
    id: 'judgment',
    label: 'Judgment',
    ratings: [
      { value: 0, label: 'Not yet', desc: 'Took data at face value' },
      { value: 1, label: 'Solid', desc: 'Caught obvious issues' },
      { value: 2, label: 'Strong', desc: 'Flagged what was not asked' },
    ],
  },
]

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
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [modelRevealed, setModelRevealed] = useState(false)
  const [rubricRatings, setRubricRatings] = useState({})
  const [reflections, setReflections] = useState({})
  const [showCertificate, setShowCertificate] = useState(false)

  const task = TASKS[currentTaskIdx]
  const taskRatings = rubricRatings[task.id] || {}
  const taskReflection = reflections[task.id] || ''
  const completedWorkTasks = [...completedTasks].filter(id => id > 0).length
  const isCurrentDone = completedTasks.has(task.id)
  const canComplete = !task.modelSolution || modelRevealed

  const handleTaskSelect = (idx) => {
    setCurrentTaskIdx(idx)
    setModelRevealed(false)
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
    }
  }

  const handleRating = (criterionId, value) => {
    setRubricRatings(prev => ({
      ...prev,
      [task.id]: { ...(prev[task.id] || {}), [criterionId]: value },
    }))
  }

  if (showCertificate) {
    return <CertificateView onBack={() => setShowCertificate(false)} />
  }

  return (
    <div className="max-w-container mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
        <button className="hover:text-primary" onClick={() => navigate('/courses')}>Courses</button>
        <span>/</span>
        <button className="hover:text-primary" onClick={() => navigate('/courses/da-job-sim')}>
          Junior Data Analyst Job Simulation
        </button>
        <span>/</span>
        <span className="text-on-surface font-medium">{task.title}</span>
      </div>

      {/* Task navigation tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {TASKS.map((t, idx) => {
          const isDone = completedTasks.has(t.id)
          const isActive = currentTaskIdx === idx
          return (
            <button
              key={t.id}
              onClick={() => handleTaskSelect(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : isDone
                  ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                  : 'bg-surface-low text-on-surface-variant border-border hover:text-on-surface hover:border-primary/40'
              }`}
            >
              <span>{isDone ? '✓' : t.icon}</span>
              <span>{t.title}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="col-span-2 space-y-4">
          {/* Email-style brief from Priya */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">PN</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">From: Priya Nair</p>
                <p className="text-xs text-on-surface-variant truncate">Subject: {task.subject}</p>
              </div>
              <span className="chip bg-orange-100 text-orange-700 text-xs shrink-0">Sr. Analytics Manager</span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{task.message}</p>
          </div>

          {/* What to do */}
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

          {/* What to submit */}
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

          {/* Hints */}
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

          {/* Python Playground — Task 2 (Sales Report) only */}
          {task.id === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🐍</span>
                <h3 className="font-bold text-on-surface text-sm">Write & Run Your Analysis</h3>
                <span className="chip text-[10px] bg-green-100 text-green-700">Runs in your browser</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                The starter code below calculates all four KPIs and produces two channel-performance charts.
                Edit it freely — try adding a monthly trend, a category breakdown, or your own insight.
                Figures are captured automatically; use <code className="font-mono bg-surface-low px-1 rounded">print()</code> for DataFrames and values.
              </p>
              <JupyterPlayground starterCode={TASK2_STARTER} />
            </div>
          )}

          {/* Model solution reveal */}
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
        </div>

        {/* Right panel */}
        <div className="col-span-1 space-y-4">
          {/* Progress */}
          <div className="card bg-primary text-white">
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-1">Progress</p>
            <p className="text-2xl font-bold">
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

          {/* Self-assessment rubric — only after model is revealed */}
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

          {/* Reflection prompt — only after model is revealed */}
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

          {/* Complete button */}
          <div>
            <button
              onClick={handleMarkComplete}
              disabled={!canComplete || isCurrentDone}
              className={`btn-primary w-full py-3 text-sm transition-opacity ${
                !canComplete || isCurrentDone ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {isCurrentDone
                ? '✓ Task Complete'
                : currentTaskIdx === TASKS.length - 1
                ? 'Complete & Earn Certificate →'
                : 'Mark Complete & Next Task →'}
            </button>
            {!canComplete && !isCurrentDone && (
              <p className="text-xs text-on-surface-variant text-center mt-2">
                Reveal the model solution above first
              </p>
            )}
          </div>

          {/* Dataset reminder */}
          <div className="card bg-surface-low">
            <div className="flex items-start gap-2">
              <span className="text-base">📂</span>
              <div>
                <p className="text-xs font-semibold text-on-surface">Working dataset</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  <span className="font-mono text-primary">lumen_orders.csv</span> · ~10,000 rows · 11 columns
                </p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Complete this in your own tool — Excel, Google Sheets, SQL, or Python all work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI · Lumen Commerce Simulation</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Help Center</a>
          <a href="#" className="hover:text-primary">Support</a>
        </div>
        <span>© 2025 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}
