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


def seed_from_enrollment(enrollment_id: str) -> int:
    """Deterministic 32-bit seed derived from an enrollment id."""
    digest = hashlib.sha256(enrollment_id.encode()).hexdigest()
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


def compute_reference_solution(task_id: int, df: pd.DataFrame) -> dict:
    """Ground-truth answers used by graders to check a student's output."""
    cleaned = _clean_reference(df)

    if task_id == 1:
        return {
            "row_count_range": (len(df) - N_DUPES - 5, len(df) - N_DUPES + 5),
            "max_discount_pct": 1.0,
            "known_category_fixes": CATEGORY_FIXES,
            "categories_valid": set(CATEGORIES),
        }

    if task_id == 2:
        # Matches the starter template's methodology exactly: returns and $0
        # promo rows are EXCLUDED (not just zeroed) before computing KPIs, so
        # the reference agrees with a textbook-correct student submission.
        rev_df = cleaned[(cleaned['quantity'] > 0) & (cleaned['unit_price'] > 0)].copy()
        rev_df['net_revenue'] = rev_df['quantity'] * rev_df['unit_price'] * (1 - rev_df['discount_pct'])
        total_revenue = float(rev_df['net_revenue'].sum())
        order_count = int(rev_df['order_id'].nunique())
        aov = total_revenue / order_count if order_count else 0
        by_channel = rev_df.groupby('channel')['net_revenue'].sum().to_dict()
        by_category = rev_df.groupby('product_category')['net_revenue'].sum().to_dict()
        return {
            "total_revenue": total_revenue,
            "order_count": order_count,
            "aov": aov,
            "by_channel": {k: float(v) for k, v in by_channel.items() if k},
            "by_category": {k: float(v) for k, v in by_category.items()},
        }

    if task_id == 3:
        # RFM reference: bucket counts by simple tercile split
        revenue = cleaned.eval('quantity * unit_price * (1 - discount_pct)')
        cust = cleaned.assign(revenue=revenue).groupby('customer_id').agg(
            frequency=('order_id', 'count'), monetary=('revenue', 'sum')
        )
        cust = cust[cust.index != '']
        return {
            "customer_count": int(len(cust)),
            "total_monetary": float(cust['monetary'].sum()),
        }

    if task_id == 4:
        exp = cleaned[cleaned['experiment_group'].isin(['control', 'variant'])]
        revenue = exp.eval('quantity * unit_price * (1 - discount_pct)')
        by_group = exp.assign(revenue=revenue).groupby('experiment_group')['revenue'].mean().to_dict()
        return {"mean_revenue_by_group": {k: float(v) for k, v in by_group.items()}}

    return {}
