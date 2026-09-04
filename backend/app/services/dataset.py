"""
Canonical lumen_orders dataset generator — the single source of truth for
sandbox grading. Both the Docker sandbox (which gives the user their dataset.csv)
and the backend grader (which computes the ground-truth reference solution)
call generate_dataset() with the SAME seed, so they always agree.

The seed is derived from enrollment_id, so each student gets a distinct but
reproducible dataset — this alone defeats hardcoded/copy-pasted answers.
"""
import hashlib
import numpy as np
import pandas as pd

N_ROWS = 9600
N_DUPES = 250

CATEGORIES = ['Lighting', 'Décor', 'Furniture', 'Outdoor', 'Accessories']
CATEGORY_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08]
CHANNELS = ['Paid Search', 'Email', 'Organic', 'Social', None]
CHANNEL_WEIGHTS = [0.33, 0.28, 0.22, 0.13, 0.04]
COUNTRIES = ['US', 'CA', 'UK', 'AU', 'ZZ']
COUNTRY_WEIGHTS = [0.65, 0.15, 0.12, 0.05, 0.03]
EXPERIMENT_GROUPS = ['control', 'variant', None]
EXPERIMENT_WEIGHTS = [0.30, 0.30, 0.40]
QUANTITIES = [1, 2, 3, 4, 5, 6, 7]
QUANTITY_WEIGHTS = [0.45, 0.28, 0.12, 0.07, 0.04, 0.02, 0.02]
DISCOUNTS = [0, 0.05, 0.10, 0.15, 0.20, 0.25]
DISCOUNT_WEIGHTS = [0.45, 0.20, 0.15, 0.10, 0.07, 0.03]

START_DATE = pd.Timestamp('2023-06-01')
END_DATE = pd.Timestamp('2024-12-31')

# Known typo -> canonical category mapping (used by the Task 1 grader)
CATEGORY_FIXES = {
    'Lightng': 'Lighting', 'lighting': 'Lighting', 'Accessoires': 'Accessories',
}


def seed_from_enrollment(enrollment_id: str | int) -> int:
    """Deterministic 32-bit seed derived from an enrollment id.

    Accepts int as well as str because BOTH call sites pass the route's
    `enrollment_id: int`. The str-only annotation was not enforced at runtime,
    so `.encode()` raised AttributeError on every call — silently swallowed by
    a bare `except` on the file-listing path (dataset.csv just vanished from
    the Explorer) and NOT caught on the submit path, where it was the third
    statement and turned every DA submission into a 500.

    artifacts.py:25 already normalises the same id the same way; the two must
    agree, since a seed that differs between them would hand a student one
    dataset and grade them against another.
    """
    digest = hashlib.sha256(str(enrollment_id).encode()).hexdigest()
    return int(digest[:8], 16)


def generate_dataset(seed: int) -> pd.DataFrame:
    rng = np.random.RandomState(seed)
    n = N_ROWS

    date_offsets = rng.random(n) * (END_DATE - START_DATE).days
    dates = [START_DATE + pd.Timedelta(days=d) for d in date_offsets]
    date_roll = rng.random(n)
    order_dates = []
    for i, d in enumerate(dates):
        r = date_roll[i]
        if r < 0.01:
            order_dates.append('')
        elif r < 0.16:
            order_dates.append(d.strftime('%d/%m/%Y'))
        else:
            order_dates.append(d.strftime('%Y-%m-%d'))

    is_guest = rng.random(n) < 0.07
    cust_nums = rng.randint(1, 3001, n)
    customer_ids = [
        '' if is_guest[i] else f'CUST-{cust_nums[i]:05d}' for i in range(n)
    ]
    emails = [
        'guest@lumenmail.com' if is_guest[i] else f'{customer_ids[i].lower()}@lumenmail.com'
        for i in range(n)
    ]

    categories = rng.choice(CATEGORIES, size=n, p=CATEGORY_WEIGHTS)
    cat_roll = rng.random(n)
    for i in range(n):
        if categories[i] == 'Lighting' and cat_roll[i] < 0.04:
            categories[i] = 'Lightng'
        elif categories[i] == 'Lighting' and cat_roll[i] < 0.08:
            categories[i] = 'lighting'
        elif categories[i] == 'Accessories' and cat_roll[i] < 0.04:
            categories[i] = 'Accessoires'

    quantities = rng.choice(QUANTITIES, size=n, p=QUANTITY_WEIGHTS).astype(int)
    return_mask = rng.random(n) < 0.03
    quantities = np.where(return_mask, -quantities, quantities)

    outlier_idx = rng.randint(0, n)
    prices = np.zeros(n)
    price_roll = rng.random(n)
    price_bucket = rng.random(n)
    for i in range(n):
        if i == outlier_idx:
            prices[i] = 99999.00
        elif price_roll[i] < 0.008:
            prices[i] = 0.00
        else:
            u = price_bucket[i]
            if u < 0.10:
                prices[i] = 5 + rng.random() * 15
            elif u < 0.35:
                prices[i] = 20 + rng.random() * 30
            elif u < 0.60:
                prices[i] = 50 + rng.random() * 50
            elif u < 0.80:
                prices[i] = 100 + rng.random() * 100
            elif u < 0.93:
                prices[i] = 200 + rng.random() * 200
            else:
                prices[i] = 400 + rng.random() * 400
            prices[i] = round(prices[i], 2)

    discounts = rng.choice(DISCOUNTS, size=n, p=DISCOUNT_WEIGHTS).astype(float)
    scale_bug = rng.random(n) < 0.12
    discounts = np.where(scale_bug, np.round(discounts * 100, 2), discounts)

    channels = rng.choice(len(CHANNELS), size=n, p=CHANNEL_WEIGHTS)
    channels = [CHANNELS[i] for i in channels]
    countries = rng.choice(COUNTRIES, size=n, p=COUNTRY_WEIGHTS)
    experiment_idx = rng.choice(len(EXPERIMENT_GROUPS), size=n, p=EXPERIMENT_WEIGHTS)
    experiment_groups = [EXPERIMENT_GROUPS[i] for i in experiment_idx]

    df = pd.DataFrame({
        'order_id': [f'ORD-{i + 1:06d}' for i in range(n)],
        'order_date': order_dates,
        'customer_id': customer_ids,
        'customer_email': emails,
        'product_category': categories,
        'quantity': quantities,
        'unit_price': prices,
        'discount_pct': discounts,
        'channel': channels,
        'country': countries,
        'experiment_group': experiment_groups,
    })

    # Inject 250 duplicate rows (sloppy ETL double-ingestion)
    dupe_positions = rng.choice(n, size=N_DUPES, replace=False)
    dupes = df.iloc[dupe_positions].copy()
    df = pd.concat([df, dupes], ignore_index=True)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    return df


def _clean_reference(df: pd.DataFrame) -> pd.DataFrame:
    """The canonical 'correct' cleaning of the raw dataset — ground truth for Task 1."""
    d = df.copy()
    d = d.drop_duplicates(subset='order_id', keep='first')
    d['product_category'] = d['product_category'].replace(CATEGORY_FIXES)
    d['discount_pct'] = d['discount_pct'].apply(lambda x: x / 100 if x > 1 else x)
    d['is_return'] = d['quantity'] < 0
    d = d[d['unit_price'] < 99999]  # drop the injected data-entry error
    return d


# ── Reference solutions ──────────────────────────────────────────────────────
#
# One builder per task, registered in TASK_REFERENCES below by task_index —
# the ONE place the numbering lives. The simulation grew from 5 tasks to 9 and
# every reference had to move, which is exactly the edit a chain of
# `if task_id == 3` makes dangerous. Renumber here, once.
#
# Every builder recomputes from the dataframe on each call. Nothing is cached
# and nothing is stored, which is what makes the answers unreachable: they are
# derived at grade time from a seed only the server holds.


def _revenue(d: pd.DataFrame) -> pd.Series:
    """Net revenue per row — the single definition every builder uses, so a
    student's number cannot be right for one task and wrong for another
    because two references disagreed about what revenue means."""
    return d['quantity'] * d['unit_price'] * (1 - d['discount_pct'].fillna(0))


def _billable(d: pd.DataFrame) -> pd.DataFrame:
    """Rows that represent money coming in: returns and $0 promos excluded.
    Matches the starter template's methodology, so a textbook-correct
    submission agrees with the reference."""
    return d[(d['quantity'] > 0) & (d['unit_price'] > 0)].copy()


def _ref_cleaning(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    return {
        "row_count_range": (len(df) - N_DUPES - 5, len(df) - N_DUPES + 5),
        "max_discount_pct": 1.0,
        "known_category_fixes": CATEGORY_FIXES,
        "categories_valid": set(CATEGORIES),
    }


def _ref_quality(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    """Task 2 — the profile of the RAW file, before any cleaning.

    Deliberately computed from `df`, not `cleaned`: the point of the task is to
    quantify the mess that was there. A student who profiled their own cleaned
    output would report zeros for everything and score nothing, which is the
    correct outcome — the brief says "the raw file".
    """
    parsed = pd.to_datetime(df['order_date'], errors='coerce', format='mixed')
    return {
        "total_rows": int(len(df)),
        "duplicate_order_ids": int(len(df) - df['order_id'].nunique()),
        "unparseable_dates": int(parsed.isna().sum()),
        "negative_quantity_rows": int((df['quantity'] < 0).sum()),
        "zero_price_rows": int((df['unit_price'] == 0).sum()),
        "discount_over_one_rows": int((df['discount_pct'] > 1).sum()),
        "missing_channel_rows": int(df['channel'].isna().sum()),
        "distinct_categories_raw": int(df['product_category'].nunique()),
    }


def _ref_kpis(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    rev_df = _billable(cleaned)
    rev_df['net_revenue'] = _revenue(rev_df)
    total_revenue = float(rev_df['net_revenue'].sum())
    order_count = int(rev_df['order_id'].nunique())
    by_channel = rev_df.groupby('channel')['net_revenue'].sum().to_dict()
    by_category = rev_df.groupby('product_category')['net_revenue'].sum().to_dict()
    return {
        "total_revenue": total_revenue,
        "order_count": order_count,
        "aov": total_revenue / order_count if order_count else 0,
        "by_channel": {k: float(v) for k, v in by_channel.items() if k},
        "by_category": {k: float(v) for k, v in by_category.items()},
    }


def _ref_channel_country(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    """Task 4 — where the money comes from, by market and by channel.

    `country` contains 'ZZ', which is not a country code. It is left IN the
    reference on purpose: noticing it is part of the task, and a reference that
    quietly dropped it would fail the students who did notice.
    """
    rev_df = _billable(cleaned)
    rev_df['net_revenue'] = _revenue(rev_df)

    by_country = rev_df.groupby('country')['net_revenue'].sum()
    orders_per_channel = rev_df.groupby('channel')['order_id'].nunique()
    revenue_per_channel = rev_df.groupby('channel')['net_revenue'].sum()
    aov_by_channel = (revenue_per_channel / orders_per_channel.replace(0, 1)).dropna()

    return {
        "by_country": {k: float(v) for k, v in by_country.to_dict().items() if k},
        "aov_by_channel": {k: float(v) for k, v in aov_by_channel.to_dict().items() if k},
        "top_country": str(by_country.idxmax()),
        "invalid_country_code": "ZZ",
        "invalid_country_rows": int((rev_df['country'] == 'ZZ').sum()),
    }


def _ref_monthly(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    """Task 5 — the trend, and the growth between consecutive months."""
    rev_df = _billable(cleaned)
    rev_df['net_revenue'] = _revenue(rev_df)
    rev_df['parsed'] = pd.to_datetime(rev_df['order_date'], errors='coerce', format='mixed')
    dated = rev_df.dropna(subset=['parsed'])

    by_month = dated.groupby(dated['parsed'].dt.to_period('M').astype(str))['net_revenue'].sum().sort_index()
    growth = by_month.pct_change().dropna()
    return {
        "by_month": {k: float(v) for k, v in by_month.to_dict().items()},
        "month_count": int(len(by_month)),
        "best_month": str(by_month.idxmax()),
        "worst_month": str(by_month.idxmin()),
        "avg_mom_growth": float(growth.mean()) if len(growth) else 0.0,
    }


def _ref_rfm(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    cust = cleaned.assign(revenue=_revenue(cleaned)).groupby('customer_id').agg(
        frequency=('order_id', 'count'), monetary=('revenue', 'sum')
    )
    cust = cust[cust.index != '']
    return {
        "customer_count": int(len(cust)),
        "total_monetary": float(cust['monetary'].sum()),
    }


def _ref_cohort(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    """Task 7 — do customers come back?

    Blank customer_ids are excluded: several hundred rows carry one, and
    treating them as a single customer would invent a spectacularly loyal buyer
    who does not exist. The brief states that exclusion so the student makes
    the same call knowingly rather than by accident.
    """
    rev_df = _billable(cleaned)
    rev_df['parsed'] = pd.to_datetime(rev_df['order_date'], errors='coerce', format='mixed')
    named = rev_df[(rev_df['customer_id'] != '') & rev_df['parsed'].notna()]

    per_customer = named.groupby('customer_id').agg(
        orders=('order_id', 'nunique'), first_order=('parsed', 'min'),
    )
    total = int(len(per_customer))
    repeat = int((per_customer['orders'] > 1).sum())
    cohorts = per_customer['first_order'].dt.to_period('M').astype(str).value_counts().sort_index()
    return {
        "customer_count": total,
        "repeat_customers": repeat,
        "one_time_customers": total - repeat,
        "repeat_rate": float(repeat / total) if total else 0.0,
        "cohort_sizes": {k: int(v) for k, v in cohorts.to_dict().items()},
        "cohort_count": int(len(cohorts)),
    }


def _ref_ab(df: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    exp = cleaned[cleaned['experiment_group'].isin(['control', 'variant'])]
    by_group = exp.assign(revenue=_revenue(exp)).groupby('experiment_group')['revenue'].mean().to_dict()
    return {"mean_revenue_by_group": {k: float(v) for k, v in by_group.items()}}


# task_index -> reference builder.
#
# KEYED TO THE CURRENTLY-DEPLOYED da-job-sim, which is still the ORIGINAL
# 5-task layout (1 Clean the Data, 2 Sales Report, 3 RFM Segmentation,
# 4 A/B Test Analysis, 5 Executive Brief — see GRADER_REGISTRY's
# da_job_sim.task1_cleaning..task5_brief keys, which are what's actually
# seeded on each of those task_index values today).
#
# _ref_quality/_ref_channel_country/_ref_monthly/_ref_cohort below belong to
# the NINE-task restructure (sync_da_content.py) — real code, but for
# content that has never been applied to the database (that script has
# never been run with --apply). Mapping them here anyway is what caused
# task_index 2 to resolve to _ref_quality (a different question's reference
# entirely, missing total_revenue/order_count/etc.) instead of _ref_kpis —
# task2_report.py's grader then did `reference["total_revenue"]` against a
# dict that only had `total_rows`/`duplicate_order_ids`/etc., which is the
# exact KeyError that crashed every Task 2 submission with a 500.
#
# If sync_da_content.py --apply is ever actually run, THIS DICT MUST BE
# UPDATED TO MATCH — task_index 2 becomes Data Quality Report (_ref_quality),
# 3 becomes Sales Report/KPIs (_ref_kpis), etc. Until then, it has to mirror
# whatever's actually seeded, not the migration that hasn't happened.
TASK_REFERENCES = {
    1: _ref_cleaning,
    2: _ref_kpis,
    3: _ref_rfm,
    4: _ref_ab,
    # 5 (Executive Brief) needs no reference — task5_brief.py's grader is
    # LLM-judged and never reads `reference` at all.
}


def compute_reference_solution(task_id: int, df: pd.DataFrame) -> dict:
    """Ground-truth answers used by graders to check a student's output."""
    builder = TASK_REFERENCES.get(task_id)
    if builder is None:
        return {}
    return builder(df, _clean_reference(df))
