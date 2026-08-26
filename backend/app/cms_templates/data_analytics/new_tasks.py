"""The four Data Analyst tasks added in the three-week restructure.

The simulation was five tasks in two uneven weeks. It is now nine tasks across
three weeks plus a final assessment — the same shape as the Frontend Developer
sim, so a student moving between them meets one structure rather than two.

    Week 1 · Make the data trustworthy, then describe it
      1  Clean the Data              (existing)
      2  Data Quality Report         ← new
      3  Sales Report                (existing, was task 2)

    Week 2 · Find out where the money comes from
      4  Channel & Country           ← new
      5  Monthly Trend & Growth      ← new
      6  RFM Segmentation            (existing, was task 3)

    Week 3 · Decide, then say it
      7  Cohort Retention            ← new
      8  A/B Test Analysis           (existing, was task 4)
      9  Executive Brief             (existing, was task 5)

    Week 4
     10  Final Assessment            (existing, was task 6)

The arc is deliberate: you cannot report a number until you trust the file, you
cannot recommend an action until you know where revenue comes from, and the
brief at the end is only writable if the eight tasks before it produced
something worth saying.

Each task below carries everything the CMS row needs EXCEPT the assessment,
which is attached from assessments.py by sync_da_content.py.
"""
from app.cms_templates.data_analytics import starters

_COMMON = dict(submission_mode="code", grading_strategy="registered_grader",
               language="python", dataset_key="da_job_sim.lumen_orders",
               input_filename="dataset.csv")


TASK_2 = dict(
    task_index=2, title="Data Quality Report", type="code_sandbox", week=1,
    objective="Put a number on everything that was wrong with the extract.",
    briefing=(
        "You cleaned the file yesterday and I trust your judgement on it. What I need now is the "
        "receipt. Finance are going to ask why last quarter's revenue moved when we re-ran it, and "
        "'we cleaned the data' is not an answer anyone accepts. Give me the counts — how many "
        "duplicates, how many broken dates, how many returns — measured against the RAW extract, "
        "not your cleaned version. This is the document I hand over when somebody challenges a number."
    ),
    what_to_do=[
        "Profile the RAW dataset.csv — this task is given the original extract, not your Task 1 output.",
        "Count each quality problem exactly: duplicate order_ids, unparseable dates, negative quantities, "
        "zero prices, discounts on the wrong scale, and missing channels.",
        "Write the counts to output.json, and say in a comment what you would do about each one.",
    ],
    what_to_submit=["output.json with one count per quality issue."],
    hints=[
        "This task receives the RAW file. If you report zeros, you profiled the wrong thing.",
        "Rows minus distinct order_ids IS the number of surplus rows — you don't need to inspect them again.",
        "pd.to_datetime(..., errors='coerce') then .isna().sum() gives the unparseable count.",
        "df['channel'].isna().sum() — missing channels are null, not empty strings.",
    ],
    success_criteria=[
        "Every count computed from the raw extract",
        "Counts are exact, not estimates",
        "output.json carries all eight keys",
    ],
    config={
        **_COMMON,
        "output_filename": "output.json",
        "grader_key": "da_job_sim.quality_report",
        # THE important flag. Without it this task is handed the student's own
        # cleaned Task 1 output and every honest answer becomes zero — see
        # _wants_raw_dataset in api/v1/simulations/sandbox.py.
        "use_raw_dataset": True,
        "starter_code": starters.TASK2_STARTER,
    },
    model_solution={"example_solution": starters.TASK2_SOLUTION},
    xp_award=60, skill_awards={"data_cleaning": 20, "analytics": 15},
)


TASK_4 = dict(
    task_index=4, title="Channel & Country Performance", type="code_sandbox", week=2,
    objective="Which markets and channels actually carry the business.",
    briefing=(
        "Growth want to open a second market next quarter and they're arguing from anecdote. Break "
        "revenue down by country, and average order value down by channel, so the conversation has "
        "numbers in it. One thing before you start: I've been told the country field isn't clean. "
        "Don't just aggregate what's there — look at the values first."
    ),
    what_to_do=[
        "Compute total revenue per country, excluding returns and $0 promo rows.",
        "Compute average order value per channel — revenue divided by DISTINCT ORDERS, not rows.",
        "Identify the highest-revenue country, and flag the country value that is not a real country code.",
    ],
    what_to_submit=["output.json with by_country, aov_by_channel, top_country and invalid_country_code."],
    hints=[
        "AOV per channel: groupby('channel') twice — sum the revenue, nunique the order_id, then divide.",
        "The valid codes here are US, CA, UK and AU. One other value appears a few hundred times.",
        "A channel is null on some rows. Those group to NaN and should not appear in your output.",
    ],
    success_criteria=[
        "Revenue by country within 5% of the reference",
        "AOV by channel within 5%",
        "Top country identified",
        "The invalid country code flagged",
    ],
    config={
        **_COMMON,
        "output_filename": "output.json",
        "grader_key": "da_job_sim.channel_country",
        "starter_code": starters.TASK4_STARTER,
    },
    model_solution={"example_solution": starters.TASK4_SOLUTION},
    xp_award=80, skill_awards={"analytics": 20, "data_viz": 10, "python": 15},
)


TASK_5 = dict(
    task_index=5, title="Monthly Trend & Growth", type="code_sandbox", week=2,
    objective="Is the business growing, and by how much a month.",
    briefing=(
        "The board deck says 'strong growth' with no number attached, and I'd rather we put one there "
        "before somebody else does. Give me revenue by month across the whole period and the average "
        "month-on-month change. Watch the ends of the range — a partial first or last month reads as a "
        "collapse and I don't want to explain that twice."
    ),
    what_to_do=[
        "Group revenue by calendar month across the full date range.",
        "Compute the month-on-month change and average it.",
        "Name the strongest and weakest months, and note how many orders you had to drop for an unparseable date.",
    ],
    what_to_submit=["output.json with by_month, month_count, best_month, worst_month and avg_mom_growth."],
    hints=[
        "dt.to_period('M').astype(str) gives you '2024-01' keys, which sort correctly as strings.",
        "sort_index() BEFORE pct_change() — it compares each row to the previous one, not to the previous month.",
        "avg_mom_growth is a fraction: 0.04 means +4%, not 4.",
    ],
    success_criteria=[
        "Monthly revenue within 5% of the reference",
        "Every month present",
        "Strongest month identified",
        "Average month-on-month growth within 2 points",
    ],
    config={
        **_COMMON,
        "output_filename": "output.json",
        "grader_key": "da_job_sim.monthly_trend",
        "starter_code": starters.TASK5_STARTER,
    },
    model_solution={"example_solution": starters.TASK5_SOLUTION},
    xp_award=85, skill_awards={"analytics": 15, "statistics": 15, "data_viz": 10},
)


TASK_7 = dict(
    task_index=7, title="Cohort Retention", type="code_sandbox", week=3,
    objective="Do customers come back, and has that changed over time.",
    briefing=(
        "We spend a great deal acquiring customers and nobody here can tell me what share of them ever "
        "order twice. Work out the repeat rate, and group customers by the month they FIRST bought so we "
        "can see whether the ones we acquired this year behave like the ones we acquired last year. "
        "Careful with the customer_id column — a chunk of rows have nothing in it."
    ),
    what_to_do=[
        "Reduce orders to customers: how many distinct orders each placed, and when they first bought.",
        "Exclude rows with a blank customer_id, and report how many you excluded.",
        "Compute the repeat rate, and the size of each first-purchase-month cohort.",
    ],
    what_to_submit=["output.json with customer_count, repeat_customers, repeat_rate and cohort_sizes."],
    hints=[
        "Blank customer_ids all collapse into one groupby key — that invents a single customer with "
        "hundreds of orders and ruins both the repeat rate and every cohort.",
        "A cohort is keyed on the customer's FIRST order month, not on each order's month.",
        "Count distinct order_ids per customer, not rows — a two-line order is one order.",
    ],
    success_criteria=[
        "Customer count within 10%",
        "Repeat customers counted",
        "Repeat rate within 3 points",
        "Cohort sizes by first-order month within 10%",
    ],
    config={
        **_COMMON,
        "output_filename": "output.json",
        "grader_key": "da_job_sim.cohort_retention",
        "starter_code": starters.TASK7_STARTER,
    },
    model_solution={"example_solution": starters.TASK7_SOLUTION},
    xp_award=95, skill_awards={"customer_analysis": 20, "segmentation": 15, "analytics": 15},
)


NEW_TASKS = {2: TASK_2, 4: TASK_4, 5: TASK_5, 7: TASK_7}

# Where each EXISTING task moves to, and which week it lands in. The database
# rows keep their content, grader_key and dataset wiring — only task_index and
# week change. Applied by sync_da_content.py.
#
# Ordering matters when writing these: moving task 2 to 3 while a task 3 still
# exists collides on (simulation_id, task_index) unless the moves are applied
# from the highest index down. The sync script does that.
RENUMBER = {
    # old: (new, week)
    1: (1, 1),   # Clean the Data
    2: (3, 1),   # Sales Report
    3: (6, 2),   # RFM Segmentation
    4: (8, 3),   # A/B Test Analysis
    5: (9, 3),   # Executive Brief
    6: (10, 4),  # Final Assessment
}

# The finished layout, for anything that needs to check it.
WEEKS = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9],
    4: [10],
}
