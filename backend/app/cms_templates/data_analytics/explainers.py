"""Task explainers for the Junior Data Analyst simulation.

CONTENT SHAPE — identical contract to the Frontend Developer sim; see
app/cms_templates/engineering/__init__.py for the full description. The short
version: every task explains itself twice. `plain` is written for somebody who
has genuinely never done this, in words, with no assumed vocabulary. `deeper`
is the sentence a senior analyst would add — the trade-off, the failure mode,
the reason it is done this way and not the other way. Neither is a summary of
the other, and a reader can skip either one and still have a complete task.

Only `explainer` lives here. Each task's briefing, what_to_do, hints and
grading config are already authoritative in the database (seeded by
migrate_legacy_sims.py::da_job_sim) and are deliberately left alone — this
module adds the reading layer the task page renders, nothing else. See
sync_da_content.py.

The `contract` block on each task mirrors the real grader in
app/services/graders/ — the point sums there are what the student is actually
measured on, and a contract that drifts from them is worse than none, because
it teaches the wrong target. tests/unit/test_da_template.py pins the pairing.
"""

# Keyed by the task's CURRENT index. The simulation was renumbered when it
# moved to a three-week shape (see new_tasks.RENUMBER), so the comment above
# each block names the task, not a position that has already changed once.
_ORIGINAL: dict[int, dict] = {

    # ── Clean the Data (task 1) ──────────────────────────────────────────────
    1: {
        "situation": (
            "Lumen's order data comes out of three systems that were never designed to agree with "
            "each other: the web store, the phone-sales CRM, and a spreadsheet the wholesale team "
            "still maintains by hand. Nobody has reconciled them. Every number anyone at this "
            "company has quoted this quarter was computed on top of this file, and you are the "
            "first person to actually look at it."
        ),
        "outcome": (
            "One cleaned CSV — output.csv — plus a written record of every decision you made to "
            "produce it. The file is what the next three tasks read, so a mistake here propagates "
            "into every number you report later."
        ),
        "preview": (
            "raw dataset.csv                    output.csv\n"
            "─────────────────────           ─────────────────────\n"
            "  5,000 rows                       ~4,850 rows\n"
            "  duplicate order_ids       →      one row per order\n"
            "  '2024-03-01', '01/03/24'  →      one date format\n"
            "  discount_pct: 0.15 and 15 →      one scale\n"
            "  'Lightng', 'lighting'     →      'Lighting'\n"
            "  unit_price: 99999         →      capped or removed\n"
            "  quantity: -3              →      kept, flagged as a return"
        ),
        "concepts": [
            {"term": "Profiling",
             "plain": "Looking at the shape of the data before changing any of it — how many rows, "
                      "what the columns are, how much is missing, what type each column holds.",
             "why": "You cannot judge whether a fix is safe until you know how much of the data it "
                    "touches. A rule that repairs four rows and a rule that rewrites four thousand "
                    "look identical in code."},
            {"term": "NaN / NaT",
             "plain": "pandas' markers for a missing number and a missing date. They are not zero "
                      "and not an empty string — they are the absence of a value.",
             "why": "They propagate: almost any arithmetic touching a NaN produces a NaN. That is a "
                    "feature — it stops a missing value quietly becoming a zero in your revenue total."},
            {"term": "Flagging vs dropping",
             "plain": "Adding a True/False column that marks a row as unusual, instead of deleting it.",
             "why": "A deletion is a decision made once, invisibly, on behalf of every analysis that "
                    "will ever use this file. A flag leaves the choice to each of them."},
            {"term": "Reproducibility",
             "plain": "Someone else running your script on the same input gets the same output.",
             "why": "It is what separates an analysis from an anecdote. If a number cannot be "
                    "reproduced, it cannot be defended when somebody senior disagrees with it."},
        ],
        "steps": [
            {"title": "Load the file and look at it before touching anything",
             "plain": "Read dataset.csv into a DataFrame. Print the row count, the column names, and "
                      "how many values are missing in each column. Do not fix anything yet — the "
                      "point of this step is to know what you are dealing with.",
             "code": "import pandas as pd\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "print(f\"{len(df):,} rows, {len(df.columns)} columns\")\n"
                     "print(df.dtypes)\n"
                     "print(df.isna().sum())",
             "deeper": "`df.isna().sum()` counts missing values per column; `df.describe()` adds the "
                       "numeric distribution, which is usually where an outlier announces itself as a "
                       "max wildly detached from the 75th percentile. Reading both before writing any "
                       "transform is the habit that separates cleaning from guessing."},

            {"title": "Find the duplicate orders — then decide what they mean",
             "plain": "Compare the number of rows to the number of distinct order_ids. If they "
                      "differ, some ids appear more than once. Look at those rows before removing "
                      "anything.",
             "code": "dupes = df[df.duplicated(subset='order_id', keep=False)]\n"
                     "print(f\"{dupes['order_id'].nunique()} order_ids appear more than once\")\n"
                     "print(dupes.sort_values('order_id').head(10))\n\n"
                     "df = df.drop_duplicates(subset='order_id', keep='first')",
             "deeper": "`keep=False` marks EVERY copy, not just the repeats — that is what you want "
                       "when inspecting, and the wrong thing when deleting. And note that "
                       "`keep='first'` means first in the frame's CURRENT order: if you want the most "
                       "recent version of each order, sort by timestamp before de-duplicating. That "
                       "sort is a decision worth writing down."},

            {"title": "Parse the dates without losing the rows that fail",
             "plain": "The order_date column mixes formats. Convert it to real dates, letting "
                      "anything unparseable become NaT rather than raising an error, then record how "
                      "many failed.",
             "code": "df['order_date'] = pd.to_datetime(\n"
                     "    df['order_date'], errors='coerce', format='mixed'\n"
                     ")\n"
                     "df['date_missing'] = df['order_date'].isna()\n"
                     "print(f\"{df['date_missing'].sum()} dates could not be parsed\")",
             "deeper": "`errors='coerce'` is what stops one malformed string halting the script — but "
                       "it makes failures silent, so the isna() count on the next line is not optional. "
                       "If that count is large, do not accept it: one unexpected format (DD/MM against "
                       "MM/DD is the classic) usually explains most of it, and a targeted parse recovers "
                       "data that coercion would have thrown away."},

            {"title": "Flag the returns instead of deleting them",
             "plain": "Negative quantities are almost certainly returns. They are real events that "
                      "affect revenue, so keep the rows and mark them.",
             "code": "df['is_return'] = df['quantity'] < 0\n"
                     "print(f\"{df['is_return'].sum()} rows look like returns\")",
             "deeper": "Delete these and every revenue figure downstream is overstated, quietly and "
                       "permanently. Keeping them with a flag means Task 2 can choose: net revenue "
                       "includes returns, gross revenue excludes them, and the flag is what makes both "
                       "computable from one file."},

            {"title": "Deal with the price outlier and the zero prices separately",
             "plain": "A price of $99,999 among values averaging around $50 is a typo. Prices of $0 "
                      "are more likely promotions. They are different problems and deserve different "
                      "treatment.",
             "code": "df['is_promo'] = df['unit_price'] == 0\n"
                     "df = df[df['unit_price'] < 99999]   # or cap it instead",
             "deeper": "Capping and removing are both defensible; picking one silently is not. A single "
                       "value three orders of magnitude out will dominate any mean it touches, which is "
                       "also the argument for reporting a median alongside the mean in Task 2. Whichever "
                       "you choose, the log needs the sentence 'one order at $99,999 was removed as a "
                       "data-entry error' — because somebody will eventually ask why the total moved."},

            {"title": "Normalise the category text and the discount scale",
             "plain": "The same category is spelled several ways, and discount_pct mixes fractions "
                      "(0.15) with whole percentages (15). Map the typos explicitly, and put every "
                      "discount on one scale.",
             "code": "category_fixes = {\n"
                     "    'Lightng': 'Lighting', 'lighting': 'Lighting',\n"
                     "    'Accessoires': 'Accessories',\n"
                     "}\n"
                     "df['product_category'] = df['product_category'].replace(category_fixes)\n\n"
                     "over_one = df['discount_pct'] > 1\n"
                     "df.loc[over_one, 'discount_pct'] = df.loc[over_one, 'discount_pct'] / 100",
             "deeper": "An explicit mapping beats fuzzy matching here: it is auditable, and a new typo "
                       "next quarter fails loudly as an unmapped value rather than being silently "
                       "matched to the wrong category. The discount rule carries an assumption — that "
                       "no genuine discount exceeds 100% — which is almost always true and should still "
                       "be written down, because the day it is false a 150% refund adjustment becomes "
                       "1.5% without a sound."},

            {"title": "Write output.csv and the log that goes with it",
             "plain": "Save the cleaned frame, and print a short line for every decision you made "
                      "and why.",
             "code": "df.to_csv('output.csv', index=False)\n"
                     "print(f\"Wrote {len(df):,} rows to output.csv\")",
             "deeper": "`index=False` matters: without it pandas writes its row numbers as an unnamed "
                       "first column, which the next read_csv picks up as real data. The log is not "
                       "ceremony — every choice above moved the final revenue number, and without the "
                       "log nobody, including you in three months, can reconstruct why the total is "
                       "what it is."},
        ],
        "contract": [
            {"name": "output.csv exists and is readable", "must": "Written to the working directory with index=False"},
            {"name": "Row count reflects de-duplication", "must": "Duplicates removed without over- or under-deleting"},
            {"name": "No duplicate order_id remains", "must": "Each order_id appears exactly once"},
            {"name": "discount_pct on a 0–1 scale", "must": "Whole-percentage values converted to fractions"},
            {"name": "Category typos normalised", "must": "Lightng/lighting → Lighting, Accessoires → Accessories"},
            {"name": "The $99,999 outlier handled", "must": "Capped or removed — either is accepted"},
        ],
        "mistakes": [
            "Dropping the negative-quantity rows. They are returns; deleting them overstates every revenue figure computed from this file afterwards.",
            "Calling to_csv() without index=False, which adds a phantom unnamed column that the next task reads back as data.",
            "Removing duplicates before deciding what a duplicate means — a repeated order_id can be a double submission or the second line of one order.",
            "Fixing category typos with .str.lower() alone. It merges 'lighting' and 'Lighting' but leaves 'Lightng' as its own category.",
            "Trusting the printed row count instead of the file. Grading reads output.csv, never your stdout.",
        ],
        "further": [
            "pandas: Working with missing data — https://pandas.pydata.org/docs/user_guide/missing_data.html",
            "pandas.to_datetime, and why format='mixed' is slower but safer than inferring",
        ],
    },

    # ── Sales Report (task 3)─────────────────────────────────────────────────
    3: {
        "situation": (
            "The monthly business review is Friday. Leadership wants the headline numbers and, more "
            "than that, wants to know where growth is coming from. Last month somebody presented "
            "revenue by channel that did not add up to total revenue and the meeting spent twenty "
            "minutes on the discrepancy instead of the business."
        ),
        "outcome": (
            "output.json holding four headline KPIs and three breakdowns — by channel, by category, "
            "by month — plus at least two insights stated in business terms rather than as numbers."
        ),
        "preview": (
            "output.json\n"
            "{\n"
            '  "total_revenue": 412750.40,\n'
            '  "order_count":   4850,\n'
            '  "aov":           85.10,\n'
            '  "units_per_order": 2.3,\n'
            '  "by_channel":  { "Email": 128400.0, "Paid Search": 96200.0, ... },\n'
            '  "by_category": { "Lighting": 141000.0, "Accessories": 88300.0, ... },\n'
            '  "by_month":    { "2024-01": 31200.0, "2024-02": 29800.0, ... }\n'
            "}"
        ),
        "concepts": [
            {"term": "KPI",
             "plain": "A single number a business watches because it summarises something it cares "
                      "about — revenue, order count, average order value.",
             "why": "A KPI is only useful next to a comparison. '$412k' means nothing; '$412k, up 8% "
                    "on last quarter' is a finding."},
            {"term": "AOV (Average Order Value)",
             "plain": "Total revenue divided by the number of distinct ORDERS — not rows, not "
                      "customers.",
             "why": "Rows over-count whenever an order spans several line items. Getting the "
                    "denominator wrong here is the most common way this number is quietly incorrect."},
            {"term": "groupby",
             "plain": "Splitting the data into groups by some column, then computing one number per "
                      "group.",
             "why": "It silently drops rows whose group key is missing — which is why grouped totals "
                    "can fall short of the overall total, and why that gap is itself a finding."},
            {"term": "Business framing",
             "plain": "Saying what a number means for a decision, not just what it is.",
             "why": "'Email AOV is $142' is a measurement. 'Email orders are 20% larger, so the "
                    "abandoned-cart flow is worth more per recovery there than anywhere else' is "
                    "something a person can act on."},
        ],
        "steps": [
            {"title": "Read the cleaned data — yours, not the raw file",
             "plain": "This task reads dataset.csv, which for Tasks 2–4 is the output.csv you "
                      "produced in Task 1. Your cleaning decisions carry forward.",
             "code": "import pandas as pd, json\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "print(f\"{len(df):,} rows\")",
             "deeper": "This chaining is deliberate. If Task 1 deleted the returns, this task cannot "
                       "compute net revenue, and no amount of care here recovers it — which is exactly "
                       "why cleaning decisions deserved a written log."},

            {"title": "Compute a revenue column if there isn't one",
             "plain": "Revenue per line is quantity × unit price, less any discount.",
             "code": "df['revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'].fillna(0))",
             "deeper": "`fillna(0)` treats a missing discount as no discount. That is the right default "
                       "and it is still an assumption — without it, every row with a null discount "
                       "produces NaN revenue and silently vanishes from every sum below."},

            {"title": "The four headline KPIs",
             "plain": "Total revenue, the number of distinct orders, average order value, and average "
                      "units per order.",
             "code": "total_revenue = float(df['revenue'].sum())\n"
                     "order_count   = int(df['order_id'].nunique())\n"
                     "aov           = total_revenue / order_count\n"
                     "units_per_order = float(df['quantity'].sum() / order_count)",
             "deeper": "`nunique()` not `len()` — the distinction only shows up when an order spans "
                       "multiple rows, which is precisely when getting it wrong matters. The `float()` "
                       "and `int()` casts are not cosmetic: json.dump refuses NumPy scalars outright, "
                       "and that failure surfaces at the very end, after everything else worked."},

            {"title": "Break revenue down three ways",
             "plain": "Group by channel, by category, and by month, summing revenue in each.",
             "code": "by_channel  = df.groupby('channel')['revenue'].sum().to_dict()\n"
                     "by_category = df.groupby('product_category')['revenue'].sum().to_dict()\n\n"
                     "df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce')\n"
                     "by_month = (df.dropna(subset=['order_date'])\n"
                     "              .groupby(df['order_date'].dt.to_period('M').astype(str))\n"
                     "              ['revenue'].sum().to_dict())",
             "deeper": "Check that each breakdown sums to roughly the total. Where it falls short, the "
                       "gap is rows with a null key, which groupby excludes by default — `dropna=False` "
                       "surfaces them as their own group. That shortfall is the discrepancy that "
                       "derailed last month's meeting, and reporting it as 'uncategorised: $X' is "
                       "stronger than letting somebody else find it."},

            {"title": "Write output.json",
             "plain": "Assemble one dictionary and write it out.",
             "code": "out = {\n"
                     "    'total_revenue': round(total_revenue, 2),\n"
                     "    'order_count': order_count,\n"
                     "    'aov': round(aov, 2),\n"
                     "    'units_per_order': round(units_per_order, 2),\n"
                     "    'by_channel': by_channel,\n"
                     "    'by_category': by_category,\n"
                     "    'by_month': by_month,\n"
                     "}\n"
                     "with open('output.json', 'w') as f:\n"
                     "    json.dump(out, f, indent=2)",
             "deeper": "The key names are the contract — the grader looks for `total_revenue`, not "
                       "`revenue_total`. Numbers are compared to a server-computed reference within a "
                       "tolerance (2% on revenue and AOV, 5% on the breakdowns), so small differences "
                       "in how you treat returns will not fail you; a wrong denominator will."},

            {"title": "Say what the numbers mean",
             "plain": "Print at least two insights, each framed as something a person could act on.",
             "code": "top_channel = max(by_channel, key=by_channel.get)\n"
                     "print(f\"{top_channel} drives {by_channel[top_channel]/total_revenue:.0%} of revenue\")",
             "deeper": "The test for a real insight: could someone disagree with it? 'Email is 31% of "
                       "revenue' is a fact. 'Email is 31% of revenue on 18% of orders, so it is our "
                       "highest-value channel per order and worth protecting in the budget review' is a "
                       "claim — and claims are what get acted on."},
        ],
        "contract": [
            {"name": "output.json is valid JSON", "must": "Written with json.dump, parseable"},
            {"name": "total_revenue", "must": "Matches the reference within 2%"},
            {"name": "order_count", "must": "Distinct orders, within 1%"},
            {"name": "aov", "must": "Revenue ÷ distinct orders, within 2%"},
            {"name": "by_channel", "must": "Object keyed by channel; most values within 5%"},
            {"name": "by_category", "must": "Object keyed by category; most values within 5%"},
        ],
        "mistakes": [
            "Dividing by len(df) instead of nunique('order_id') for AOV — correct only when every order is exactly one row.",
            "Passing NumPy types to json.dump. Cast with float() and int(); the error appears at the last line, after everything else worked.",
            "Sending .values instead of .to_dict() for a breakdown, which discards the labels the grader matches on.",
            "Presenting a partial final month as a revenue collapse. Check the date range before describing a trend.",
            "Reporting only the mean order value when one large order dominates it. The median beside it is the honest version.",
        ],
        "further": [
            "pandas: Group by — split-apply-combine — https://pandas.pydata.org/docs/user_guide/groupby.html",
            "Why groupby drops NaN keys, and when dropna=False is the right call",
        ],
    },

    # ── RFM Segmentation (task 6)─────────────────────────────────────────────
    6: {
        "situation": (
            "Marketing sends the same email to all 4,000 customers and wonders why the response rate "
            "is falling. They have asked for segments — but what they actually need is segments they "
            "can write a different email for. A list of numeric cluster ids will be thanked for and "
            "never used."
        ),
        "outcome": (
            "output.json with a per-customer record carrying an R, F and M score and a named segment, "
            "plus a short brief describing what each segment is and what to do about it."
        ),
        "preview": (
            "output.json\n"
            "{\n"
            '  "customers": [\n'
            '    { "customer_id": "C-1042", "recency": 12, "frequency": 9,\n'
            '      "monetary": 1840.50, "r": 5, "f": 5, "m": 5,\n'
            '      "segment": "Champions" },\n'
            '    { "customer_id": "C-2277", "recency": 210, "frequency": 6,\n'
            '      "monetary": 1320.00, "r": 1, "f": 4, "m": 4,\n'
            '      "segment": "At-Risk High Value" }\n'
            "  ],\n"
            '  "total_monetary": 412750.40\n'
            "}"
        ),
        "concepts": [
            {"term": "Recency",
             "plain": "How many days since this customer last ordered. Fewer days is better.",
             "why": "It is the single strongest cheap predictor of whether somebody will buy again. "
                    "Because low is good, it has to be scored in reverse to sit alongside F and M."},
            {"term": "Quintile scoring",
             "plain": "Sorting customers into five equal-sized bands and scoring them 1–5.",
             "why": "It makes three quantities with completely different units — days, counts, "
                    "pounds — comparable, without anyone having to pick thresholds by hand."},
            {"term": "Anchor date",
             "plain": "The date recency is measured from. Use the latest order in the dataset, not "
                      "today.",
             "why": "Anchor to today and re-running the same script next month silently changes every "
                    "score. The analysis stops being reproducible, and two runs of it disagree."},
            {"term": "Actionable segment",
             "plain": "A group with a name, a definition, and a recommended action.",
             "why": "The marketer has to be able to act without reverse-engineering your scoring. "
                    "That is the whole deliverable — the numbers are just how you got there."},
        ],
        "steps": [
            {"title": "Collapse orders down to customers",
             "plain": "You have one row per order. RFM needs one row per customer, so aggregate: "
                      "their last order date, how many orders they placed, and what they spent in "
                      "total.",
             "code": "import pandas as pd, json\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce')\n"
                     "df['revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'].fillna(0))\n\n"
                     "anchor = df['order_date'].max()\n"
                     "rfm = df.groupby('customer_id').agg(\n"
                     "    last_order=('order_date', 'max'),\n"
                     "    frequency=('order_id', 'nunique'),\n"
                     "    monetary=('revenue', 'sum'),\n"
                     ").reset_index()\n"
                     "rfm['recency'] = (anchor - rfm['last_order']).dt.days",
             "deeper": "Named aggregation — `last_order=('order_date','max')` — gives flat, readable "
                       "column names instead of the MultiIndex a plain .agg() produces, which then has "
                       "to be flattened before anything else works. And `frequency` counts distinct "
                       "ORDERS, not rows: a customer with one three-item order has frequency 1."},

            {"title": "Score each dimension 1–5",
             "plain": "Cut each of the three columns into five equal-sized bands. Recency is scored "
                      "backwards, because fewer days is better.",
             "code": "rfm['r'] = pd.qcut(rfm['recency'], 5, labels=[5, 4, 3, 2, 1]).astype(int)\n"
                     "rfm['f'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)\n"
                     "rfm['m'] = pd.qcut(rfm['monetary'], 5, labels=[1, 2, 3, 4, 5]).astype(int)",
             "deeper": "The reversed labels on `r` are the whole trick — all three now point the same "
                       "way, so a high score means a better customer everywhere. `.rank(method='first')` "
                       "on frequency exists because qcut fails outright when quantile boundaries are not "
                       "distinct, and frequency is exactly the lumpy column where that happens: if more "
                       "than a fifth of your customers have ordered once, there is no clean 20% cut. "
                       "Ranking first breaks the ties. `duplicates='drop'` is the other way, at the cost "
                       "of uneven bands."},

            {"title": "Turn scores into names",
             "plain": "Map combinations of scores onto segments a marketer can recognise. Three or "
                      "four is enough.",
             "code": "def segment(row):\n"
                     "    if row['r'] >= 4 and row['f'] >= 4:\n"
                     "        return 'Champions'\n"
                     "    if row['r'] <= 2 and row['m'] >= 4:\n"
                     "        return 'At-Risk High Value'\n"
                     "    if row['f'] == 1 and row['r'] >= 4:\n"
                     "        return 'New Customers'\n"
                     "    return 'Needs Attention'\n\n"
                     "rfm['segment'] = rfm.apply(segment, axis=1)\n"
                     "print(rfm['segment'].value_counts())",
             "deeper": "Order matters — the first matching branch wins, so the most specific rules go "
                       "first. Check the value_counts before moving on: if one segment holds 95% of "
                       "customers your thresholds have collapsed, and a segmentation that separates "
                       "nothing cannot drive any action. The grader requires at least two distinct "
                       "segments for exactly this reason."},

            {"title": "Write output.json",
             "plain": "Emit the per-customer records and the total monetary value.",
             "code": "customers = rfm[['customer_id', 'recency', 'frequency', 'monetary',\n"
                     "                 'r', 'f', 'm', 'segment']].to_dict(orient='records')\n\n"
                     "out = {'customers': customers,\n"
                     "       'total_monetary': float(rfm['monetary'].sum())}\n"
                     "with open('output.json', 'w') as f:\n"
                     "    json.dump(out, f, indent=2, default=float)",
             "deeper": "`orient='records'` gives a list of one dict per row, which is the shape the "
                       "grader walks. `default=float` is the safety net for any NumPy scalar that "
                       "survived — without it json.dump raises on the very last line, after every "
                       "other part of the task has already worked."},

            {"title": "Write the segment brief",
             "plain": "For each segment, print who they are, how many there are, and the one thing "
                      "marketing should do about them.",
             "code": "for name, group in rfm.groupby('segment'):\n"
                     "    print(f\"{name}: {len(group)} customers, \"\n"
                     "          f\"avg spend ${group['monetary'].mean():,.0f}\")",
             "deeper": "The test of a segment name is whether a marketer could draft the email from it "
                       "alone. 'At-Risk High Value — spent in the top 20%, nothing in 90+ days — send "
                       "the win-back offer' passes. 'Segment 3' fails, however good the maths behind it."},
        ],
        "contract": [
            {"name": "output.json is valid JSON", "must": "Written with json.dump, parseable"},
            {"name": "Every customer has a segment", "must": "customers[] present, each with a `segment` key"},
            {"name": "More than one segment used", "must": "At least two distinct segment names"},
            {"name": "Customer count is consistent", "must": "Within 15% of the dataset's distinct customers"},
            {"name": "total_monetary", "must": "Sum of per-customer spend, within 5% of the reference"},
        ],
        "mistakes": [
            "Scoring recency 1–5 ascending. Low days is a GOOD customer; forgetting to reverse it inverts every segment.",
            "Measuring recency from today instead of the dataset's latest order, which makes the analysis unreproducible.",
            "Letting qcut raise on frequency and giving up. Rank first, or pass duplicates='drop' — the lumpiness is itself worth reporting.",
            "Counting rows instead of distinct order_ids for frequency, which promotes anyone who bought several items at once.",
            "Naming segments after their scores. '455' is not something a marketing team can write an email to.",
        ],
        "further": [
            "pandas.qcut and the duplicate-bin-edges error, and why ranking is the usual escape",
            "RFM analysis — the original direct-marketing framing, and what it still gets right",
        ],
    },

    # ── A/B Test Analysis (task 8)────────────────────────────────────────────
    8: {
        "situation": (
            "The growth team ran free shipping against a control for six weeks and wants to roll it "
            "out on Monday. The PM has already told the exec team it 'looks positive'. Nobody has "
            "checked whether the difference is larger than the noise, and nobody has costed the "
            "shipping."
        ),
        "outcome": (
            "output.json with the mean revenue for each arm, a p-value, and an unambiguous ship / "
            "no-ship recommendation — plus the caveats the PM has not thought about."
        ),
        "preview": (
            "output.json\n"
            "{\n"
            '  "mean_control": 78.40,\n'
            '  "mean_variant": 83.10,\n'
            '  "p_value": 0.031,\n'
            '  "recommendation": "ship"\n'
            "}\n\n"
            "recommendation must be one of: ship | no-ship | hold"
        ),
        "concepts": [
            {"term": "Control and variant",
             "plain": "Two randomly assigned groups. The control sees the current experience; the "
                      "variant sees the change being tested.",
             "why": "Random assignment is what lets you attribute the difference to the change rather "
                    "than to who happened to be in each group. Break it and the comparison means "
                    "nothing, however clean the arithmetic."},
            {"term": "p-value",
             "plain": "If the two groups were genuinely no different, how often would you see a gap "
                      "at least this big by chance alone?",
             "why": "It is the probability of the DATA given no effect — never the probability that "
                    "there is no effect. Reversing those is the most common statistical error in "
                    "analytics, and it is usually made confidently."},
            {"term": "Effect size",
             "plain": "How big the difference actually is, in units somebody cares about.",
             "why": "A large enough sample makes almost any difference significant. Significance says "
                    "the effect is real; effect size says whether it is worth paying for."},
            {"term": "Sample-ratio mismatch",
             "plain": "The two arms should be roughly the same size in a 50/50 test. A large skew "
                      "means something is broken.",
             "why": "It usually points to faulty assignment or a filter that hit one arm harder — "
                    "either of which invalidates the comparison before you look at the metric at all."},
        ],
        "steps": [
            {"title": "Filter to the two arms and check they are balanced",
             "plain": "Keep only the rows labelled control or variant. Rows with no label predate "
                      "the experiment. Then count each arm before doing anything else.",
             "code": "import pandas as pd, json\n"
                     "from scipy import stats\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "df['revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount_pct'].fillna(0))\n\n"
                     "exp = df[df['experiment_group'].isin(['control', 'variant'])]\n"
                     "print(exp['experiment_group'].value_counts())",
             "deeper": "Excluding the nulls is not tidying — those orders happened before randomisation "
                       "and belong to neither arm, so folding them in mixes pre-test behaviour into the "
                       "comparison. And read the counts you just printed: a 4:1 split in a 50/50 test is "
                       "a health-check failure that has to be explained before the metric means anything."},

            {"title": "Compare the arms on one primary metric",
             "plain": "Pick the metric before you look: revenue per order. Compute the mean for each "
                      "arm.",
             "code": "control = exp.loc[exp['experiment_group'] == 'control', 'revenue']\n"
                     "variant = exp.loc[exp['experiment_group'] == 'variant', 'revenue']\n\n"
                     "mean_control = float(control.mean())\n"
                     "mean_variant = float(variant.mean())\n"
                     "lift = (mean_variant - mean_control) / mean_control\n"
                     "print(f\"control ${mean_control:.2f} → variant ${mean_variant:.2f}  ({lift:+.1%})\")",
             "deeper": "One primary metric, chosen in advance. Testing revenue, then conversion, then "
                       "units, then basket size until one of them is significant is how a null result "
                       "gets converted into a false positive — five independent metrics at α=0.05 give "
                       "roughly a 23% chance that at least one lands by accident."},

            {"title": "Run the significance test",
             "plain": "A two-sample t-test asks whether the gap between the two means is bigger than "
                      "chance would comfortably explain.",
             "code": "t_stat, p_value = stats.ttest_ind(variant, control, equal_var=False)\n"
                     "print(f\"t = {t_stat:.3f}, p = {p_value:.4f}\")",
             "deeper": "`equal_var=False` is Welch's t-test, and it should be your default — it does "
                       "not assume the two groups have the same variance, which revenue data routinely "
                       "violates. The classic Student's version is a little more powerful when variances "
                       "genuinely match and misleading when they do not."},

            {"title": "Make the call, and write down what would change it",
             "plain": "Decide ship, no-ship, or hold. State the effect size in money next to the "
                      "p-value, and list the caveats.",
             "code": "if p_value < 0.05 and lift > 0:\n"
                     "    recommendation = 'ship'\n"
                     "elif p_value < 0.05:\n"
                     "    recommendation = 'no-ship'   # significant, but the wrong direction\n"
                     "else:\n"
                     "    recommendation = 'hold'      # not separable from noise yet",
             "deeper": "The threshold is a convention, not a law — p = 0.049 and p = 0.051 are the same "
                       "evidence. What makes the recommendation defensible is naming the effect in money "
                       "('+$4.70 per order') beside the p-value, and saying what free shipping costs. If "
                       "the lift is real but smaller than the cost, the honest answer is no-ship on a "
                       "significant result, and being able to say that is the job."},

            {"title": "Write output.json",
             "plain": "Four keys. The recommendation must be one of the accepted values.",
             "code": "out = {\n"
                     "    'mean_control': round(mean_control, 2),\n"
                     "    'mean_variant': round(mean_variant, 2),\n"
                     "    'p_value': float(p_value),\n"
                     "    'recommendation': recommendation,\n"
                     "}\n"
                     "with open('output.json', 'w') as f:\n"
                     "    json.dump(out, f, indent=2)",
             "deeper": "The fixed vocabulary — ship / no-ship / hold — is not a grading quirk. A "
                       "decision has to be unambiguous and checkable; the reasoning belongs beside it, "
                       "not buried in a paragraph a stakeholder has to interpret under time pressure."},
        ],
        "contract": [
            {"name": "output.json is valid JSON", "must": "Written with json.dump, parseable"},
            {"name": "mean_control and mean_variant", "must": "Both within 5% of the reference means"},
            {"name": "p_value", "must": "A number between 0 and 1"},
            {"name": "recommendation", "must": "Exactly one of: ship, no-ship, no ship, hold"},
        ],
        "mistakes": [
            "Leaving the null experiment_group rows in. Those orders predate randomisation and bias whichever arm absorbs them.",
            "Reading p = 0.03 as 'a 3% chance the variant does nothing'. It is the probability of the data under no effect, not of the hypothesis.",
            "Shipping on significance alone without stating the effect size. A real $0.40 lift may still cost more than it earns.",
            "Writing a sentence into `recommendation` instead of one of the accepted values.",
            "Not noticing a badly unbalanced split. Sample-ratio mismatch invalidates the comparison before the metric matters.",
        ],
        "further": [
            "scipy.stats.ttest_ind and the equal_var argument (Welch's t-test)",
            "Why repeatedly peeking at a running experiment inflates the false-positive rate",
        ],
    },

    # ── Executive Brief (task 9)──────────────────────────────────────────────
    9: {
        "situation": (
            "The VP of Commerce has fifteen minutes before her next meeting and four weeks of your "
            "analysis to absorb. She will not open a notebook. What reaches her is one page, and "
            "whatever she remembers from it is what the company will act on."
        ),
        "outcome": (
            "A one-page brief, 400 words or fewer, structured Situation → Key Findings → "
            "Recommendations, with exactly three prioritised recommendations and no jargon."
        ),
        "preview": (
            "SITUATION      2-3 sentences. Why this analysis, why now.\n"
            "\n"
            "KEY FINDINGS   3-4 findings. Each one number, in context,\n"
            "               and what it means — not what you computed.\n"
            "\n"
            "RECOMMENDATIONS\n"
            "  1.  Highest impact, with the evidence and the cost.\n"
            "  2.  …\n"
            "  3.  …\n"
            "\n"
            "CAVEATS        What would change the above."
        ),
        "concepts": [
            {"term": "Inverted pyramid",
             "plain": "Most important thing first, supporting detail after, background last.",
             "why": "The reader who stops after two lines still gets the decision. Chronological "
                    "order — what I did, then what I found — serves the writer instead."},
            {"term": "Effect in context",
             "plain": "A number next to the thing that makes it meaningful: a comparison, a cost, a "
                      "target.",
             "why": "'AOV is $85' cannot be acted on. '$85, up 6% since free shipping, at a shipping "
                    "cost of $40k a quarter' contains a decision."},
            {"term": "Prioritisation",
             "plain": "Ranking your recommendations, rather than listing everything you found.",
             "why": "An unranked list of ten reads as a wish list and nothing gets done. Doing the "
                    "ranking is the analytical work — handing it over undone pushes it onto somebody "
                    "with less context than you."},
            {"term": "Caveat",
             "plain": "A limitation of the analysis, stated plainly next to the conclusion it "
                      "affects.",
             "why": "A caveat you raised is diligence. The same caveat found later by somebody else is "
                    "a reason to re-check every number you have ever produced."},
        ],
        "steps": [
            {"title": "Decide the one thing first",
             "plain": "Before writing anything, finish this sentence: 'If the VP does one thing "
                      "after reading this, it should be ___.' That sentence is your opening line.",
             "code": None,
             "deeper": "If you cannot finish it, the analysis has not concluded yet — and no amount of "
                       "structure will hide that. Writing the brief is often where you discover which "
                       "of your findings you actually believe."},

            {"title": "Situation — two or three sentences",
             "plain": "Why this analysis exists and why it matters now. Not what you did.",
             "code": None,
             "deeper": "This is the only place background belongs, and it should be shorter than feels "
                       "comfortable. The reader already knows their own business; they do not know your "
                       "conclusion."},

            {"title": "Key findings — three or four, each with a number in context",
             "plain": "Pull the strongest results from Tasks 1–4. Each finding is one number plus "
                      "what it means for the business.",
             "code": None,
             "deeper": "Cleaning belongs here only if it changed a number somebody has already quoted "
                       "— 'the previously reported quarterly total included a $99,999 data-entry error' "
                       "is a finding. 'I removed duplicates' is housekeeping, and spending a line on it "
                       "costs you one you needed for something else."},

            {"title": "Exactly three recommendations, ranked",
             "plain": "Each one: the action, the evidence, and what it costs or requires.",
             "code": None,
             "deeper": "Three forces the trade-off into the open. If two feel equally important, the "
                       "act of choosing is what your judgement is for — and if you genuinely cannot "
                       "separate them, saying so explicitly is stronger than a tie you hid by listing "
                       "both."},

            {"title": "Caveats — the ones that could change the recommendation",
             "plain": "State the limits. Unparseable dates, the unbalanced experiment arms, the "
                      "assumption about the discount scale.",
             "code": None,
             "deeper": "Only the caveats that could change a decision belong here. A list of every "
                       "imperfection reads as hedging and buries the one that actually matters."},

            {"title": "Cut it to 400 words",
             "plain": "Write it, then remove everything that is not load-bearing. Replace any word "
                      "that would need defining.",
             "code": None,
             "deeper": "The cut is where the brief gets good. 'A two-sample Welch's t-test yielded "
                       "p = 0.031' becomes 'the increase is larger than normal week-to-week variation' — "
                       "same claim, no glossary, and it survives being repeated second-hand in a meeting "
                       "you are not in. Which is, in the end, what happens to it."},
        ],
        "contract": [
            {"name": "One page, ≤ 400 words", "must": "Length is part of the deliverable"},
            {"name": "Situation → Findings → Recommendations", "must": "All three sections present, in that order"},
            {"name": "Exactly three recommendations", "must": "Prioritised, not an unranked list"},
            {"name": "Findings carry numbers in context", "must": "Each one comparable to something"},
            {"name": "No unexplained jargon", "must": "Written for a reader who has not seen the data"},
        ],
        "mistakes": [
            "Opening with methodology. The VP does not need the library you used; she needs the decision she is being asked to make.",
            "Listing every finding. Everything included competes for attention with the thing that matters.",
            "Leaving out a caveat that weakens the recommendation. Found later by somebody else, it costs you the whole analysis.",
            "Quoting a p-value without saying how large the effect is in money.",
            "Recommending an action without saying what it costs or requires. That is the first question in the room.",
        ],
        "further": [
            "The Pyramid Principle (Minto) — conclusion first, support beneath",
            "The one-page memo as a decision-forcing document, and why the length cap does the work",
        ],
    },
}


NEW_EXPLAINERS = {

    2: {
        "situation": (
            "Every number this company reports is computed on top of the extract you just cleaned, and "
            "your cleaning moved several of them. Finance will notice. When they ask why last quarter's "
            "revenue changed, 'we cleaned the data' is not an answer — a count is."
        ),
        "outcome": (
            "output.json holding an exact count for each quality problem in the RAW extract, plus a "
            "one-line note on what you did about it. This is the document that defends every figure "
            "produced downstream."
        ),
        "preview": (
            "output.json\n"
            "{\n"
            '  "total_rows": 9850,\n'
            '  "duplicate_order_ids": 250,\n'
            '  "unparseable_dates": 93,\n'
            '  "negative_quantity_rows": 285,\n'
            '  "zero_price_rows": 76,\n'
            '  "discount_over_one_rows": 648,\n'
            '  "missing_channel_rows": 402,\n'
            '  "distinct_categories_raw": 8\n'
            "}"
        ),
        "concepts": [
            {"term": "Profiling",
             "plain": "Counting what is wrong, rather than describing it.",
             "why": "'The dates are messy' cannot be checked, budgeted for, or compared to next "
                    "quarter. '93 of 9,850 dates would not parse' can be all three."},
            {"term": "Raw vs cleaned",
             "plain": "The original extract, before any of your fixes were applied.",
             "why": "This task is deliberately handed the raw file. Profiling your own cleaned output "
                    "would report zeros for everything, which is true and useless."},
            {"term": "Exact vs approximate",
             "plain": "A count of duplicates has one right answer; an average does not.",
             "why": "Everything on this page is a count, so everything is graded exactly. There is "
                    "nothing to estimate and nothing to round."},
            {"term": "Materiality",
             "plain": "Whether a problem is big enough to change a decision.",
             "why": "One bad price in 9,850 rows and 648 discounts on the wrong scale are both defects. "
                    "Only one of them moves the revenue total, and the report should say which."},
        ],
        "steps": [
            {"title": "Load the raw file and confirm it IS the raw file",
             "plain": "Read dataset.csv and check the row count. This task is given the original "
                      "extract, so you should see the full count including duplicates.",
             "code": "import pandas as pd, json\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "print(f\"{len(df):,} rows, {df['order_id'].nunique():,} distinct order_ids\")",
             "deeper": "If those two numbers are equal you have been handed a cleaned file and something "
                       "is wrong with the task wiring — say so rather than reporting zero duplicates. "
                       "Checking that your input is what you were told it is takes one line and saves "
                       "the whole analysis."},

            {"title": "Count the duplicates without inspecting them again",
             "plain": "Rows minus distinct order_ids is the number of surplus rows.",
             "code": "duplicate_order_ids = int(len(df) - df['order_id'].nunique())",
             "deeper": "You already decided in Task 1 what a duplicate MEANT. This task only needs the "
                       "size of the problem, so the expensive inspection does not need repeating — and "
                       "the arithmetic is exact where a re-inspection could drift."},

            {"title": "Count the dates that will not parse",
             "plain": "Convert the column with coerce, then count how many became NaT.",
             "code": "parsed = pd.to_datetime(df['order_date'], errors='coerce', format='mixed')\n"
                     "unparseable_dates = int(parsed.isna().sum())",
             "deeper": "This is the one figure with any slack in the grading, because a student who "
                       "supplies a better explicit format than `mixed` legitimately rescues a few more "
                       "rows. If your number is far above the reference, you are probably parsing "
                       "without `format='mixed'` and losing an entire date format."},

            {"title": "Count the value problems",
             "plain": "Negative quantities, zero prices, discounts above 1, and missing channels.",
             "code": "report = {\n"
                     "    'negative_quantity_rows': int((df['quantity'] < 0).sum()),\n"
                     "    'zero_price_rows': int((df['unit_price'] == 0).sum()),\n"
                     "    'discount_over_one_rows': int((df['discount_pct'] > 1).sum()),\n"
                     "    'missing_channel_rows': int(df['channel'].isna().sum()),\n"
                     "}",
             "deeper": "`.isna()` for channel, not `== ''` — a missing channel is null in this file, and "
                       "an empty-string comparison silently returns zero. That is the difference between "
                       "reporting 402 rows with no attribution and reporting none."},

            {"title": "Write it out, with a decision beside each count",
             "plain": "Save output.json, and put a comment or printed line next to each number saying "
                      "what you did about it.",
             "code": "with open('output.json', 'w') as f:\n"
                     "    json.dump(report, f, indent=2)\n\n"
                     "for key, value in report.items():\n"
                     "    print(f\"{key:26} {value:>7,}\")",
             "deeper": "The counts are what get graded; the decisions are what make it a handover "
                       "document. '648 discounts stored as whole percentages — rescaled by 100, "
                       "assuming no genuine discount exceeds 100%' is the sentence that lets somebody "
                       "else check your assumption instead of inheriting it."},
        ],
        "contract": [
            {"name": "output.json is valid JSON", "must": "Written with json.dump"},
            {"name": "total_rows", "must": "Exact row count of the raw extract"},
            {"name": "duplicate_order_ids", "must": "Exact — rows minus distinct ids"},
            {"name": "negative_quantity_rows", "must": "Exact count"},
            {"name": "zero_price_rows", "must": "Exact count"},
            {"name": "discount_over_one_rows", "must": "Exact count"},
            {"name": "missing_channel_rows", "must": "Exact count of nulls, not empty strings"},
            {"name": "unparseable_dates", "must": "Within 10% of the reference"},
        ],
        "mistakes": [
            "Profiling your cleaned Task 1 output. This task is handed the RAW file on purpose; zeros mean you read the wrong thing.",
            "Using == '' for the missing channel count. They are nulls, and the comparison returns zero.",
            "Rounding a count. Every figure here is exact and graded exactly.",
            "Parsing dates without format='mixed', which loses a whole format and inflates the unparseable count.",
            "Reporting the counts without saying what you did about them — the numbers alone are not a handover.",
        ],
        "further": [
            "pandas: Working with missing data",
            "Great Expectations / pandera — what a formal data-quality suite automates",
        ],
    },

    4: {
        "situation": (
            "Growth want to open a second market next quarter, and the case for it is currently "
            "somebody's impression of which country 'feels big'. You have the order data to settle it. "
            "You have also been warned the country field is not clean, which is the more interesting "
            "half of this task."
        ),
        "outcome": (
            "output.json with revenue per country, average order value per channel, the strongest "
            "market named, and the country value that is not a country flagged."
        ),
        "preview": (
            "output.json\n"
            "{\n"
            '  "by_country": { "US": 268400.0, "CA": 61200.0, "UK": 49800.0, ... },\n'
            '  "aov_by_channel": { "Email": 92.40, "Paid Search": 78.10, ... },\n'
            '  "top_country": "US",\n'
            '  "invalid_country_code": "ZZ"\n'
            "}"
        ),
        "concepts": [
            {"term": "AOV per group",
             "plain": "Revenue for that group divided by the number of DISTINCT ORDERS in it.",
             "why": "Dividing by rows inflates the denominator wherever an order spans several lines, "
                    "and it does so unevenly across channels — so the ranking, not just the numbers, "
                    "comes out wrong."},
            {"term": "Reference data",
             "plain": "A column whose values are supposed to come from a fixed list — country codes, "
                      "currency codes, status values.",
             "why": "Anything outside the list is a defect by definition, which makes these columns the "
                    "cheapest place in any dataset to find real problems."},
            {"term": "Sentinel value",
             "plain": "A placeholder a system writes when it has nothing real to write.",
             "why": "'ZZ' is not a country. It is almost certainly what the order form stores when the "
                    "field was left blank — and it is large enough to distort any per-market comparison "
                    "that treats it as a market."},
            {"term": "Aggregating without looking",
             "plain": "Grouping a column before checking what is in it.",
             "why": "groupby will happily produce a total for 'ZZ' and present it beside real countries. "
                    "The arithmetic is correct and the answer is wrong."},
        ],
        "steps": [
            {"title": "Compute billable revenue",
             "plain": "Keep only rows that represent money coming in — positive quantity and positive "
                      "price — then compute revenue per row.",
             "code": "import pandas as pd, json\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "billable = df[(df['quantity'] > 0) & (df['unit_price'] > 0)].copy()\n"
                     "billable['revenue'] = (billable['quantity'] * billable['unit_price']\n"
                     "                       * (1 - billable['discount_pct'].fillna(0)))",
             "deeper": "Returns and $0 promos are excluded rather than zeroed. Zeroing keeps them in the "
                       "denominator of every average you compute later, which quietly drags AOV down in "
                       "whichever channel runs the most promotions."},

            {"title": "Look at the country column before you group it",
             "plain": "List the distinct values. Compare them against the codes you expect.",
             "code": "print(billable['country'].value_counts(dropna=False))",
             "deeper": "Thirty seconds here is the whole task. The valid set is US, CA, UK and AU; one "
                       "other value appears a few hundred times. Everything downstream is just "
                       "arithmetic once you have seen it."},

            {"title": "Revenue by country",
             "plain": "Group by country and sum revenue.",
             "code": "by_country = billable.groupby('country')['revenue'].sum()\n"
                     "top_country = str(by_country.idxmax())",
             "deeper": "`idxmax()` gives the label of the largest value, not the value — which is what "
                       "'which country' asks for. Reaching for `.max()` here returns a number and "
                       "answers a different question."},

            {"title": "AOV by channel — divide by orders, not rows",
             "plain": "Sum revenue per channel, count distinct orders per channel, divide one by the "
                      "other.",
             "code": "orders  = billable.groupby('channel')['order_id'].nunique()\n"
                     "revenue = billable.groupby('channel')['revenue'].sum()\n"
                     "aov_by_channel = (revenue / orders.replace(0, 1)).dropna()",
             "deeper": "`replace(0, 1)` guards a division by zero for a channel with revenue but no "
                       "countable orders — it cannot happen in this dataset, and a pipeline that only "
                       "works on the data you have seen is not finished. `.dropna()` removes the NaN "
                       "group formed by the rows with a missing channel, which should not appear "
                       "beside real channels in the output."},

            {"title": "Flag the invalid code and write output.json",
             "plain": "Name the country value that is not a country, and save everything.",
             "code": "valid_iso = {'US', 'CA', 'UK', 'AU'}\n"
                     "invalid = sorted(set(billable['country'].dropna()) - valid_iso)\n\n"
                     "out = {\n"
                     "    'by_country': {k: float(v) for k, v in by_country.items() if isinstance(k, str)},\n"
                     "    'aov_by_channel': {k: float(v) for k, v in aov_by_channel.items() if isinstance(k, str)},\n"
                     "    'top_country': top_country,\n"
                     "    'invalid_country_code': invalid[0] if invalid else '',\n"
                     "}\n"
                     "with open('output.json', 'w') as f:\n"
                     "    json.dump(out, f, indent=2)",
             "deeper": "Deriving the invalid code by set difference rather than hardcoding 'ZZ' means "
                       "the same script finds the next sentinel somebody's checkout form invents. The "
                       "reference keeps the 'ZZ' rows in by_country deliberately — you are asked to "
                       "flag it, not to silently delete the revenue attached to it, because that "
                       "revenue is real even though the country is not."},
        ],
        "contract": [
            {"name": "output.json is valid JSON", "must": "Written with json.dump"},
            {"name": "by_country", "must": "Revenue per country, most values within 5%"},
            {"name": "aov_by_channel", "must": "Revenue ÷ distinct orders per channel, within 5%"},
            {"name": "top_country", "must": "The country label with the highest revenue"},
            {"name": "invalid_country_code", "must": "The country value that is not a real code"},
        ],
        "mistakes": [
            "Computing AOV as revenue ÷ rows. Correct only when every order is exactly one line, and it distorts the channel ranking.",
            "Aggregating country without looking at its values first — the whole point of the task.",
            "Deleting the invalid-country rows. Their revenue is real; the country label is what is wrong.",
            "Letting the NaN channel group into the output beside real channels.",
            "Returning the largest revenue instead of the country name for top_country.",
        ],
        "further": [
            "ISO 3166-1 alpha-2 — the actual list of country codes",
            "pandas.Series.idxmax, and why it is not .max()",
        ],
    },

    5: {
        "situation": (
            "The board deck says 'strong growth' and puts no number next to it. Before somebody outside "
            "this team attaches their own, we should attach the right one. You have the full order "
            "history; the question is simply how much revenue moves month to month."
        ),
        "outcome": (
            "output.json with revenue for every month in the range, the strongest and weakest months "
            "named, and the average month-on-month change as a fraction."
        ),
        "preview": (
            "output.json\n"
            "{\n"
            '  "by_month": { "2023-06": 21400.0, "2023-07": 24100.0, ... },\n'
            '  "month_count": 19,\n'
            '  "best_month": "2024-11",\n'
            '  "worst_month": "2023-06",\n'
            '  "avg_mom_growth": 0.031\n'
            "}"
        ),
        "concepts": [
            {"term": "Period",
             "plain": "A month as a label — '2024-01' — rather than a specific day inside it.",
             "why": "Grouping on a raw date gives you one group per day. `to_period('M')` collapses the "
                    "day away, and as a string it also sorts correctly, which matters for the next "
                    "concept."},
            {"term": "Month-on-month change",
             "plain": "This month's revenue compared to last month's, as a fraction.",
             "why": "It is computed from the row ORDER, not from the dates — so an unsorted series "
                    "silently compares unrelated months and produces a number that looks plausible."},
            {"term": "Edge months",
             "plain": "The first and last months in the range, which may be partial.",
             "why": "A month with three days of data in it reads as a collapse. It is an artefact of "
                    "where the extract was cut, not a business event, and reporting it as growth or "
                    "decline is the single most common mistake in a trend."},
            {"term": "Fraction vs percentage",
             "plain": "0.04 and 4 are the same growth expressed two ways.",
             "why": "The output asks for a fraction. Reporting 4 where 0.04 was expected is not a "
                    "rounding difference — it is a hundredfold error, and it is graded as one."},
        ],
        "steps": [
            {"title": "Compute billable revenue and parse the dates",
             "plain": "Same revenue definition as the other tasks, then turn order_date into real "
                      "timestamps.",
             "code": "import pandas as pd, json\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "billable = df[(df['quantity'] > 0) & (df['unit_price'] > 0)].copy()\n"
                     "billable['revenue'] = (billable['quantity'] * billable['unit_price']\n"
                     "                       * (1 - billable['discount_pct'].fillna(0)))\n"
                     "billable['parsed'] = pd.to_datetime(billable['order_date'],\n"
                     "                                    errors='coerce', format='mixed')",
             "deeper": "The revenue formula is identical in every task in this simulation on purpose. "
                       "If it differed between two of them, a student could be right in one place and "
                       "wrong in another for reasons that had nothing to do with their analysis."},

            {"title": "Drop the undated rows — and count them",
             "plain": "A row with no parseable date cannot be placed in a month. Remove those rows, and "
                      "record how many there were.",
             "code": "undated = int(billable['parsed'].isna().sum())\n"
                     "dated = billable.dropna(subset=['parsed'])\n"
                     "print(f\"{undated:,} orders dropped — no parseable date\")",
             "deeper": "The count is the point. A monthly trend built on top of a large gap is not "
                       "trustworthy, and whoever reads the chart has no way of knowing the gap exists "
                       "unless you say so. This is the caveat that belongs in the executive brief in "
                       "Task 9."},

            {"title": "Group into months, sorted",
             "plain": "Convert each date to its month label and sum revenue per month, in order.",
             "code": "by_month = (dated.groupby(dated['parsed'].dt.to_period('M').astype(str))\n"
                     "            ['revenue'].sum().sort_index())",
             "deeper": "`.astype(str)` gives '2024-01' rather than a Period object — JSON cannot "
                       "serialise a Period, and the string form sorts chronologically as a bonus. "
                       "`sort_index()` is not cosmetic; the next step depends on it entirely."},

            {"title": "Month-on-month growth",
             "plain": "pct_change compares each month to the one before it. Average the result.",
             "code": "growth = by_month.pct_change().dropna()\n"
                     "avg_mom_growth = float(growth.mean()) if len(growth) else 0.0\n"
                     "print(f\"average month-on-month change: {avg_mom_growth:+.1%}\")",
             "deeper": "The first month has nothing to compare against, which is why `dropna()` is "
                       "there — leaving the NaN in makes the mean NaN and every check fails at once. "
                       "And note that an arithmetic mean of growth rates is not the compound growth "
                       "rate; for a board deck you would usually want CAGR, and the difference is worth "
                       "knowing before somebody asks."},

            {"title": "Name the extremes and write output.json",
             "plain": "Best and worst month by label, then save.",
             "code": "out = {\n"
                     "    'by_month': {k: float(v) for k, v in by_month.items()},\n"
                     "    'month_count': int(len(by_month)),\n"
                     "    'best_month': str(by_month.idxmax()),\n"
                     "    'worst_month': str(by_month.idxmin()),\n"
                     "    'avg_mom_growth': avg_mom_growth,\n"
                     "}\n"
                     "with open('output.json', 'w') as f:\n"
                     "    json.dump(out, f, indent=2)",
             "deeper": "Before you report the worst month, check whether it is the first or last in the "
                       "range. If it is, you are reporting where the extract was cut rather than "
                       "anything the business did — and that sentence belongs in your write-up either "
                       "way."},
        ],
        "contract": [
            {"name": "output.json is valid JSON", "must": "Written with json.dump"},
            {"name": "by_month", "must": "Revenue per 'YYYY-MM', most values within 5%"},
            {"name": "month_count", "must": "Exact — every month in the range"},
            {"name": "best_month", "must": "The 'YYYY-MM' label with the highest revenue"},
            {"name": "avg_mom_growth", "must": "A FRACTION, within 2 percentage points"},
        ],
        "mistakes": [
            "Calling pct_change() on an unsorted series, which compares unrelated months and produces a plausible wrong number.",
            "Reporting growth as 4 instead of 0.04 — a hundredfold error, not a rounding one.",
            "Leaving the first month's NaN in before averaging, which makes the mean NaN and fails every check.",
            "Presenting a partial edge month as a collapse without checking the date range.",
            "Grouping on the raw date instead of the month, which gives one group per day.",
        ],
        "further": [
            "pandas: Time series / date functionality — to_period and resample",
            "Arithmetic mean of growth rates vs CAGR, and when each is honest",
        ],
    },

    7: {
        "situation": (
            "Acquisition is the largest line in the marketing budget and nobody in the building can say "
            "what share of the customers it buys ever order a second time. Until somebody can, every "
            "argument about that budget is an argument about opinions."
        ),
        "outcome": (
            "output.json with the repeat rate, the split between one-time and returning customers, and "
            "the size of each first-purchase-month cohort."
        ),
        "preview": (
            "output.json\n"
            "{\n"
            '  "customer_count": 2810,\n'
            '  "repeat_customers": 913,\n'
            '  "one_time_customers": 1897,\n'
            '  "repeat_rate": 0.325,\n'
            '  "cohort_sizes": { "2023-06": 240, "2023-07": 198, ... },\n'
            '  "cohort_count": 19\n'
            "}"
        ),
        "concepts": [
            {"term": "Cohort",
             "plain": "Everyone who first bought in the same month, followed as a group.",
             "why": "It separates 'this month was bad' from 'the customers we acquired in March were "
                    "always weaker'. A calendar view cannot tell those apart, and they call for "
                    "completely different responses."},
            {"term": "Repeat rate",
             "plain": "The share of customers with more than one order.",
             "why": "Revenue and average order value can both rise while the customer base churns "
                    "underneath. This is the number that shows it."},
            {"term": "Identity",
             "plain": "The column that says which rows belong to the same person.",
             "why": "Several hundred rows here have a blank customer_id. Under groupby they all collapse "
                    "into ONE key — inventing a single customer with hundreds of orders, who then "
                    "single-handedly drags the repeat rate up."},
            {"term": "Distinct orders",
             "plain": "Counting orders, not rows.",
             "why": "A customer who bought three items in one transaction has ordered once. Counting "
                    "rows promotes them to a repeat customer they are not."},
        ],
        "steps": [
            {"title": "Filter to billable, dated rows",
             "plain": "Same revenue filter as the other tasks, plus a parsed date, since a cohort needs "
                      "a month.",
             "code": "import pandas as pd, json\n\n"
                     "df = pd.read_csv('dataset.csv')\n"
                     "billable = df[(df['quantity'] > 0) & (df['unit_price'] > 0)].copy()\n"
                     "billable['parsed'] = pd.to_datetime(billable['order_date'],\n"
                     "                                    errors='coerce', format='mixed')",
             "deeper": "Returns are excluded here for a subtler reason than in the revenue tasks: a "
                       "customer whose only activity is a return has not made a purchase, and counting "
                       "them as a customer would understate the repeat rate."},

            {"title": "Exclude the blank customer ids — and count them",
             "plain": "Rows with no customer_id cannot be attributed to anyone. Drop them, and report "
                      "how many.",
             "code": "blank = int((billable['customer_id'].fillna('') == '').sum())\n"
                     "named = billable[(billable['customer_id'].fillna('') != '')\n"
                     "                 & billable['parsed'].notna()]\n"
                     "print(f\"{blank:,} rows have no customer_id and were excluded\")",
             "deeper": "This is the trap in the task. Leave them in and groupby produces one 'customer' "
                       "with several hundred orders, which is both the most loyal customer in the "
                       "dataset and entirely fictional. The exclusion is correct; reporting how many "
                       "you excluded is what makes it defensible rather than convenient."},

            {"title": "Reduce orders to customers",
             "plain": "For each customer: how many distinct orders, and when they first bought.",
             "code": "per_customer = named.groupby('customer_id').agg(\n"
                     "    orders=('order_id', 'nunique'),\n"
                     "    first_order=('parsed', 'min'),\n"
                     ")",
             "deeper": "`nunique` not `count` — the whole distinction between a repeat customer and a "
                       "multi-item order lives in that one word. Named aggregation keeps the column "
                       "names flat, which saves flattening a MultiIndex on the next line."},

            {"title": "Repeat rate",
             "plain": "How many customers ordered more than once, over the total.",
             "code": "total  = int(len(per_customer))\n"
                     "repeat = int((per_customer['orders'] > 1).sum())\n"
                     "repeat_rate = repeat / total if total else 0.0\n"
                     "print(f\"{repeat:,} of {total:,} ordered again — {repeat_rate:.1%}\")",
             "deeper": "A repeat rate is always relative to a window. This one covers the whole extract, "
                       "which flatters recent cohorts less than it flatters old ones: somebody who "
                       "first bought last month has had one month to come back, and somebody from the "
                       "first month has had eighteen. The cohort breakdown below is what makes that "
                       "visible."},

            {"title": "Cohorts by first-purchase month",
             "plain": "Group customers by the month of their FIRST order and count them.",
             "code": "cohorts = (per_customer['first_order'].dt.to_period('M').astype(str)\n"
                     "           .value_counts().sort_index())\n\n"
                     "out = {\n"
                     "    'customer_count': total,\n"
                     "    'repeat_customers': repeat,\n"
                     "    'one_time_customers': total - repeat,\n"
                     "    'repeat_rate': float(repeat_rate),\n"
                     "    'cohort_sizes': {k: int(v) for k, v in cohorts.items()},\n"
                     "    'cohort_count': int(len(cohorts)),\n"
                     "}\n"
                     "with open('output.json', 'w') as f:\n"
                     "    json.dump(out, f, indent=2)",
             "deeper": "The key is the customer's first order month, not each order's month — that is "
                       "the entire difference between a cohort analysis and a monthly count, and it is "
                       "one word in the code. `sort_index()` puts the cohorts in calendar order so the "
                       "shape is readable; `value_counts()` alone returns them by size, which hides the "
                       "trend you are looking for."},
        ],
        "contract": [
            {"name": "output.json is valid JSON", "must": "Written with json.dump"},
            {"name": "customer_count", "must": "Distinct identified customers, within 10%"},
            {"name": "repeat_customers", "must": "Customers with more than one distinct order, within 10%"},
            {"name": "repeat_rate", "must": "Within 3 points — a fraction or a percentage is accepted"},
            {"name": "cohort_sizes", "must": "Customers keyed by first-order month, within 10%"},
        ],
        "mistakes": [
            "Keeping the blank customer_ids. They collapse into one fictional customer with hundreds of orders and inflate the repeat rate.",
            "Counting rows instead of distinct order_ids, which promotes every multi-item order to a repeat purchase.",
            "Building cohorts from each order's month rather than the customer's FIRST order month — that is a monthly count, not a cohort.",
            "Leaving cohorts in value_counts() order, which sorts by size and hides the trend.",
            "Reporting the repeat rate without noting that recent cohorts have had less time to return.",
        ],
        "further": [
            "Cohort analysis — why retention curves are read diagonally",
            "pandas.DataFrame.agg with named aggregation",
        ],
    },
}


# The full set, keyed by current task index.
EXPLAINERS: dict[int, dict] = {**_ORIGINAL, **NEW_EXPLAINERS}
