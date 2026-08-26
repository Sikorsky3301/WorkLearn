"""Assessment banks for the Junior Data Analyst simulation.

Same two-tier shape as the Frontend Developer sim (see
app/cms_templates/engineering/assessments.py), and deliberately so — a student
moving between simulations should meet the same structure, not learn a second
one.

  MINI_ASSESSMENTS — one 5-question check per task, taken immediately after
  that task is graded.

  REWRITTEN TO BE PLAIN. The first version asked the right things and asked
  them badly: forty-word questions, four long options separated by a subtle
  qualifier, and several where two answers were defensible and one was merely
  more defensible. That measures reading stamina, not whether the student
  understood the task — and it gates the next task, so it was the wrong place
  to be clever.

  The rules now, applied to all forty-five:
    · the question is one short sentence
    · every option is under about a dozen words
    · the right answer follows from having DONE the task
    · exactly one option is right, and the wrong ones are wrong for a reason
      the student can see, not because of a hedge
    · the explanation stays — that is the part that teaches

  The difficulty that was removed was accidental. The concepts are unchanged:
  a student still has to know why a return is flagged rather than deleted, and
  still has to know that a p-value is not the probability the variant works.

  FINAL_ASSESSMENT — 40 questions after all five tasks, mixing pandas and SQL
  recall with the statistical and business judgement the tasks demanded.

Every question carries an `explanation`, shown only after the attempt is
graded. It's the difference between a score and a lesson.

THESE ANSWERS NEVER REACH THE BROWSER. The whole block is stripped from the
public simulation payload (see `assessment` in app/services/task_types.py's
secret_config_keys) and graded server-side by
app/api/v1/simulations/assessments.py. Do not move this into a config key the
student's client can read.
"""

# Passing a task's mini assessment is what unlocks the next task. Carried on
# every bank so the SERVER decides whether an attempt passed — see the note in
# the engineering equivalent for what happened when it wasn't set.
#
# Mirrors ASSESSMENT_PASS_MARK in
# frontend/src/features/simulations/engineering/lib/assessment.js.
MINI_PASS_MARK = 80


EASY_BANKS = {
    1: {
        "title": "Cleaning the data",
        "questions": [
            {"question": "Your file has 9,850 rows but only 9,600 different order IDs. What does that mean?",
             "options": ["250 rows are duplicates",
                         "250 rows are missing",
                         "The file is corrupted",
                         "Nothing — IDs can repeat"],
             "correct": 0,
             "explanation": "Rows minus distinct IDs gives you the number of extra copies. 9,850 − 9,600 = 250 duplicate rows."},

            {"question": "What does errors='coerce' do when you parse dates?",
             "options": ["Deletes the bad rows",
                         "Turns unreadable dates into NaT instead of crashing",
                         "Guesses the correct date",
                         "Stops the script"],
             "correct": 1,
             "explanation": "Bad values become NaT (pandas' 'missing date') and your script keeps running. Count them afterwards, or you won't know they happened."},

            {"question": "Some rows have a negative quantity. What should you do?",
             "options": ["Delete them",
                         "Make them positive",
                         "Keep them and flag them — they're returns",
                         "Set them to zero"],
             "correct": 2,
             "explanation": "A negative quantity is a return. Deleting it makes your revenue look higher than it really is."},

            {"question": "discount_pct has both 0.15 and 15 in it. What's wrong?",
             "options": ["Two different scales are mixed — fractions and percentages",
                         "The column has too many decimals",
                         "Some discounts are too large",
                         "Nothing is wrong"],
             "correct": 0,
             "explanation": "0.15 and 15 mean the same discount written two ways. Pick one scale and convert the rest, or every revenue figure is wrong."},

            {"question": "Why write down each cleaning decision you made?",
             "options": ["It's a coding style rule",
                         "It makes the file smaller",
                         "So anyone can see why the numbers changed",
                         "pandas requires it"],
             "correct": 2,
             "explanation": "Your choices changed the totals. Without a note, nobody — including you in three months — can explain why."},
        ],
    },

    2: {
        "title": "Data quality report",
        "questions": [
            {"question": "This task gives you the RAW file, not your cleaned one. Why?",
             "options": ["The cleaned file is too big",
                         "You're counting the problems, and the cleaned file has none",
                         "It loads faster",
                         "It was a mistake"],
             "correct": 1,
             "explanation": "You're measuring what was wrong. Profile your cleaned file and every count is zero — true, but useless."},

            {"question": "What's the quickest correct way to count duplicate order IDs?",
             "options": ["Loop through every row",
                         "len(df) - df['order_id'].nunique()",
                         "df.sort_values('order_id')",
                         "df['order_id'].count()"],
             "correct": 1,
             "explanation": "Total rows minus unique IDs is exactly the number of extra copies. One line, no loop."},

            {"question": "df['channel'].isna().sum() gives 402, but (df['channel'] == '').sum() gives 0. Why?",
             "options": ["The missing values are null, not empty text",
                         "The column is the wrong type",
                         "402 rows say 'nan'",
                         "There are no missing values"],
             "correct": 0,
             "explanation": "Missing values here are null. Null isn't equal to anything — including '' — so == never finds them. Use .isna()."},

            {"question": "Why are these counts graded exactly, with no tolerance?",
             "options": ["Counts have one right answer",
                         "The grader is strict",
                         "To make it harder",
                         "Because they're small numbers"],
             "correct": 0,
             "explanation": "You can average or estimate a price. You can't estimate how many duplicates there are — pandas gives one answer."},

            {"question": "One order costs $99,999 when the average is around $50. Why does one row matter?",
             "options": ["It doesn't — it's just one row",
                         "It breaks the CSV format",
                         "It's a duplicate",
                         "It's big enough to move the average on its own"],
             "correct": 3,
             "explanation": "One value that far out shifts the mean by itself. How much a problem matters isn't the same as how often it happens."},
        ],
    },

    3: {
        "title": "Headline numbers",
        "questions": [
            {"question": "How do you calculate Average Order Value?",
             "options": ["Revenue ÷ number of rows",
                         "Revenue ÷ number of orders",
                         "Revenue ÷ number of customers",
                         "Revenue ÷ units sold"],
             "correct": 1,
             "explanation": "Per order. If one order has three items across three rows, counting rows would triple your denominator."},

            {"question": "Your revenue-by-channel numbers don't add up to your total revenue. Most likely reason?",
             "options": ["Rows with no channel were dropped by groupby",
                         "A rounding error",
                         "The data is corrupted",
                         "You need to clean again"],
             "correct": 0,
             "explanation": "groupby ignores rows whose key is missing. The gap is those rows — which is itself worth reporting."},

            {"question": "Which pandas method turns a grouped result into a dictionary for your JSON?",
             "options": [".values", ".to_dict()", ".tolist()", "str()"],
             "correct": 1,
             "explanation": ".to_dict() keeps the labels with the numbers. .values throws the labels away."},

            {"question": "December revenue looks huge. What should you check first?",
             "options": ["Whether it's the holiday season",
                         "Whether the data is wrong",
                         "Nothing — report it as growth",
                         "Whether prices went up"],
             "correct": 0,
             "explanation": "A seasonal peak isn't growth. Check the month against the same month last year before calling it a trend."},

            {"question": "You find Email has the highest AOV. What's missing before you recommend spending more on it?",
             "options": ["Nothing — that's enough",
                         "How many orders it brings in",
                         "The exact decimal places",
                         "A chart"],
             "correct": 1,
             "explanation": "Big orders don't help if there are only ten of them. AOV needs volume beside it before it's a recommendation."},
        ],
    },

    4: {
        "title": "Channels and countries",
        "questions": [
            {"question": "The country column contains 'ZZ'. What is it?",
             "options": ["A real country code",
                         "A placeholder for a blank field",
                         "Zimbabwe",
                         "A typing error in one row"],
             "correct": 1,
             "explanation": "'ZZ' isn't a country. It's what the system writes when the field was left empty — and it appears hundreds of times."},

            {"question": "Should you delete the 'ZZ' rows?",
             "options": ["Yes, the country is invalid",
                         "No — the orders and their revenue are real",
                         "Yes, they're duplicates",
                         "It doesn't matter"],
             "correct": 1,
             "explanation": "The money came in. Only the country label is wrong, so flag it rather than deleting real revenue."},

            {"question": "Which gives you the NAME of the top-earning country?",
             "options": ["by_country.max()",
                         "by_country.idxmax()",
                         "by_country.sum()",
                         "by_country.count()"],
             "correct": 1,
             "explanation": ".max() gives the amount, .idxmax() gives the label. You were asked which country, not how much."},

            {"question": "For AOV per channel, what do you divide revenue by?",
             "options": ["Rows in that channel",
                         "Distinct orders in that channel",
                         "Customers in that channel",
                         "All orders in the dataset"],
             "correct": 1,
             "explanation": "Distinct orders in that channel. Using rows inflates the count differently per channel, so even the ranking comes out wrong."},

            {"question": "Why check the country column's values before grouping it?",
             "options": ["To make it faster",
                         "groupby needs sorted data",
                         "Because groupby will happily total a value that isn't a country",
                         "It isn't necessary"],
             "correct": 2,
             "explanation": "The maths will be perfectly correct and the answer still wrong. Thirty seconds of looking is the whole task."},
        ],
    },

    5: {
        "title": "Trends over time",
        "questions": [
            {"question": "Why must you sort by month before calling pct_change()?",
             "options": ["It compares each row to the one above it",
                         "pct_change needs sorted input to run",
                         "It's faster",
                         "You don't have to"],
             "correct": 0,
             "explanation": "pct_change looks at the previous ROW, not the previous month. Unsorted, it compares months at random."},

            {"question": "avg_mom_growth should be a fraction. How do you write 4% growth?",
             "options": ["4", "0.04", "4.0", "400"],
             "correct": 1,
             "explanation": "0.04. Writing 4 means 400% growth — a hundred times too big."},

            {"question": "The first month's growth is NaN. Why?",
             "options": ["The data is missing",
                         "There's no earlier month to compare it to",
                         "A calculation error",
                         "The month is incomplete"],
             "correct": 1,
             "explanation": "Growth compares to the month before. The first month has nothing before it, so drop that value before averaging."},

            {"question": "The last month in your data shows very low revenue. What's the likely reason?",
             "options": ["Sales collapsed",
                         "The month is only partly covered by the data",
                         "A pricing change",
                         "Bad data"],
             "correct": 1,
             "explanation": "The export stopped mid-month. That's where the file ends, not what the business did."},

            {"question": "What does dt.to_period('M') give you?",
             "options": ["The day of the month",
                         "The month as '2024-01'",
                         "The number of months",
                         "A timestamp"],
             "correct": 1,
             "explanation": "It collapses each date to its month. Group on that and you get one row per month instead of one per day."},
        ],
    },

    6: {
        "title": "Grouping customers",
        "questions": [
            {"question": "In RFM, what does a LOW recency number mean?",
             "options": ["The customer bought recently — a good sign",
                         "The customer hasn't bought in a long time",
                         "The customer spends little",
                         "The customer orders rarely"],
             "correct": 0,
             "explanation": "Recency is days since their last order. Fewer days is better, which is why its score is reversed to match F and M."},

            {"question": "What does RFM stand for?",
             "options": ["Revenue, Frequency, Margin",
                         "Recency, Frequency, Monetary",
                         "Rate, Frequency, Money",
                         "Retention, Frequency, Monetary"],
             "correct": 1,
             "explanation": "How recently they bought, how often, and how much they spent."},

            {"question": "Every customer ends up in the same segment. What does that tell you?",
             "options": ["Your customers are all similar",
                         "Something is wrong with your scoring",
                         "You need more data",
                         "That's normal"],
             "correct": 1,
             "explanation": "A segmentation that separates nobody can't drive any action. Check your thresholds."},

            {"question": "Which segment name is actually useful to a marketing team?",
             "options": ["Segment 4",
                         "RFM 344",
                         "At-Risk High Value",
                         "Group B"],
             "correct": 2,
             "explanation": "A name says who they are and hints what to do. A code makes the marketer decode your work first."},

            {"question": "Recency should be measured from which date?",
             "options": ["Today",
                         "The last order date in the dataset",
                         "The first order in the dataset",
                         "The start of the year"],
             "correct": 1,
             "explanation": "Use the dataset's own latest date. Anchoring to today means the same script gives different answers next week."},
        ],
    },

    7: {
        "title": "Do customers come back?",
        "questions": [
            {"question": "Hundreds of rows have a blank customer_id. What happens if you leave them in?",
             "options": ["pandas removes them for you",
                         "They become one fake customer with hundreds of orders",
                         "You get an error",
                         "Each one counts as its own customer"],
             "correct": 1,
             "explanation": "groupby puts every blank into a single bucket, inventing the most loyal customer in your data. Exclude them."},

            {"question": "What is the repeat rate?",
             "options": ["The share of customers who ordered more than once",
                         "How often customers order per month",
                         "Total orders divided by revenue",
                         "The share of orders that are repeats"],
             "correct": 0,
             "explanation": "Customers with 2+ orders, divided by all customers."},

            {"question": "A customer buys three items in one transaction. How many orders is that?",
             "options": ["Three", "One", "Depends on the items", "Two"],
             "correct": 1,
             "explanation": "One order, three rows. Count distinct order IDs, or you'd call this person a repeat customer."},

            {"question": "A cohort groups customers by which date?",
             "options": ["Each order's date",
                         "The date they FIRST bought",
                         "Today's date",
                         "Their most recent order"],
             "correct": 1,
             "explanation": "Their first purchase month. That's what lets you compare groups fairly as they age."},

            {"question": "Your newest cohort has a much lower repeat rate. What's the first explanation to consider?",
             "options": ["The product got worse",
                         "They've had less time to come back",
                         "Prices went up",
                         "Marketing got worse"],
             "correct": 1,
             "explanation": "Someone who joined last month has had one month to return. Older cohorts have had a year."},
        ],
    },

    8: {
        "title": "Reading an experiment",
        "questions": [
            {"question": "Why exclude rows where experiment_group is empty?",
             "options": ["They slow the test down",
                         "Those orders happened before the test started",
                         "They have no revenue",
                         "pandas can't handle them"],
             "correct": 1,
             "explanation": "They came before anyone was assigned to a group. Including them mixes pre-test behaviour into your comparison."},

            {"question": "You get p = 0.03. What does that suggest?",
             "options": ["The difference is probably real, not just luck",
                         "The variant is 3% better",
                         "There's a 3% chance it works",
                         "The test failed"],
             "correct": 0,
             "explanation": "A small p-value means a gap this big would rarely happen by chance alone. It says nothing about how BIG the effect is."},

            {"question": "The result is significant, but the variant only adds $0.40 per order. What now?",
             "options": ["Ship it — it's significant",
                         "Report both, and check what it costs to run",
                         "Run the test again",
                         "Don't ship — it's too small"],
             "correct": 1,
             "explanation": "Real and worthwhile are different questions. If free shipping costs more than $0.40 an order, significance doesn't save it."},

            {"question": "Control has 900 orders, variant has 4,000, in a 50/50 test. What does that suggest?",
             "options": ["The variant is more popular",
                         "Something is wrong with how people were assigned",
                         "The test ran longer for one group",
                         "Nothing unusual"],
             "correct": 1,
             "explanation": "A 50/50 split should be roughly even. A 4:1 gap means the split or the filter is broken — fix that before reading the result."},

            {"question": "Why must `recommendation` be exactly 'ship', 'no-ship' or 'hold'?",
             "options": ["JSON needs short strings",
                         "So the decision is unambiguous",
                         "To save space",
                         "It's a pandas requirement"],
             "correct": 1,
             "explanation": "A decision has to be readable at a glance. Your reasoning goes beside it, not buried inside it."},
        ],
    },

    9: {
        "title": "Writing it up",
        "questions": [
            {"question": "What should the first line of an executive brief say?",
             "options": ["What you did",
                         "What you recommend",
                         "Which tools you used",
                         "Where the data came from"],
             "correct": 1,
             "explanation": "If they read one line, it should be the decision. Everything else supports it."},

            {"question": "Which sentence belongs in a brief for a VP?",
             "options": ["A t-test gave p = 0.03 at α = 0.05",
                         "Free shipping raised order value 6%, costing about $40k a quarter",
                         "We used pandas groupby",
                         "The data had 9,850 rows"],
             "correct": 1,
             "explanation": "Effect, and what it costs. The statistical test belongs in an appendix."},

            {"question": "Why limit yourself to three recommendations?",
             "options": ["It fits the page",
                         "A long list means nothing gets done",
                         "Three is a lucky number",
                         "There are only three findings"],
             "correct": 1,
             "explanation": "Choosing which three matter is the analysis. Handing over ten pushes that work onto the reader."},

            {"question": "You find something that weakens your recommendation. What do you do?",
             "options": ["Leave it out",
                         "Say it plainly next to the recommendation",
                         "Put it in a footnote",
                         "Mention it only if asked"],
             "correct": 1,
             "explanation": "If someone else finds it later, they'll doubt everything else you wrote."},

            {"question": "What makes a number useful in a brief?",
             "options": ["Lots of decimal places",
                         "Something to compare it to",
                         "A chart beside it",
                         "Being large"],
             "correct": 1,
             "explanation": "'$85' means nothing on its own. '$85, up 6% since the change' contains a decision."},
        ],
    },
}


def _spread(questions: list[dict]) -> list[dict]:
    """Rotate each question's options so the correct answer is not always in
    the same slot.

    Written because it was needed: authored by hand, these banks put the right
    answer at index 1 in 36 of 40 final questions and in every question of
    three mini banks. That is not a cosmetic flaw — a student who never reads
    an option can pass by always choosing the second one, which makes the
    assessment measure nothing. tests/unit/test_da_template.py fails on it.

    The rotation amount comes from the question text, so it is deterministic
    (the same bank always renders identically, and a stored answer stays valid)
    but carries no pattern a student could learn — unlike cycling 0,1,2,3.

    Safe here because every option in these banks is an independent
    alternative. Do NOT apply it to a question whose options are ordered or
    reference each other ("both of the above").
    """
    out = []
    for q in questions:
        options, correct = q["options"], q["correct"]
        n = len(options)
        target = sum(ord(c) for c in q["question"]) % n
        shift = (target - correct) % n
        if shift:
            options = options[-shift:] + options[:-shift]
        out.append({**q, "options": options, "correct": target})
    return out


# Keyed by the task's CURRENT index — the simulation was renumbered when it
# moved to a three-week shape (see new_tasks.RENUMBER).
MINI_ASSESSMENTS: dict[int, dict] = EASY_BANKS

# `pass_mark` is attached here rather than written into all nine banks, so one
# of them cannot quietly drift to a different gate than the rest.
for _bank in MINI_ASSESSMENTS.values():
    _bank.setdefault("pass_mark", MINI_PASS_MARK)


for _bank in MINI_ASSESSMENTS.values():
    _bank["questions"] = _spread(_bank["questions"])


def assessment_for(task_index: int) -> dict:
    """The mini assessment block for one task, or {} if it has none."""
    return MINI_ASSESSMENTS.get(task_index, {})


def _q(question: str, options: list[str], correct: int, explanation: str) -> dict:
    return {"question": question, "options": options, "correct": correct, "explanation": explanation}


FINAL_ASSESSMENT: dict = {
    "title": "Junior Data Analyst — Final Assessment",
    "description": (
        "Forty questions across everything the simulation covered: data quality and cleaning, "
        "pandas and SQL, business metrics, segmentation, experiment analysis and statistics, and "
        "communicating a result to somebody who will act on it. Difficulty ramps from "
        "fundamentals to the judgement calls behind the analysis you produced."
    ),
    "pass_mark": 70,
    "questions": [
        # ── Data quality & cleaning (1-7) ──
        _q("Which pandas call reports how many missing values each column holds?",
           ["df.isna().sum()", "df.count()", "df.dropna()", "df.info(missing=True)"], 0,
           "isna() gives a boolean frame; .sum() counts the Trues per column. df.count() reports NON-null counts, which is the same information inverted."),
        _q("`df.drop_duplicates(subset='order_id', keep='first')` keeps which row when an id repeats?",
           ["The row with the highest revenue", "The first occurrence in the frame's current order",
            "A random one", "All of them, with a duplicate flag"], 1,
           "It keeps the first row IN THE CURRENT ORDER — which means sorting before de-duplicating is a decision, not a formality."),
        _q("A column of dates parses to 30% NaT. What is the correct next step?",
           ["Drop those rows", "Fill them with today's date",
            "Inspect the unparsed values — a single unexpected format usually explains most of them, and a targeted parse recovers the data rather than discarding it",
            "Ignore it; NaT is handled automatically"], 2,
           "30% is far too much data to lose to a formatting quirk. Look at the raw strings first; DD/MM vs MM/DD alone accounts for this kind of failure regularly."),
        _q("What does `errors='coerce'` protect you from?",
           ["Losing rows", "A raised exception halting the whole script on one bad value",
            "Incorrect dtypes", "Duplicate values"], 1,
           "It converts failures to NaT/NaN so the pipeline completes — at the cost of making failures silent unless you check for them afterwards."),
        _q("Why flag a value rather than delete it?",
           ["Flags are faster to compute",
            "Because deletion is irreversible and hides the decision, while a flag keeps the row available and lets each downstream analysis choose whether to include it",
            "Because pandas cannot delete rows efficiently",
            "Because flagged rows are excluded automatically"], 1,
           "A flag is a reversible, documented decision. A deletion is an undocumented one that the next analyst cannot see or undo."),
        _q("A price of $99,999 among values averaging $50 is most likely:",
           ["A genuine luxury purchase to be kept as-is",
            "A data-entry error — worth confirming, then capping or removing, because a single value like this dominates every mean it touches",
            "A currency conversion issue", "Irrelevant, since medians are unaffected"], 1,
           "It is three orders of magnitude out. Even if genuine, it should be reported separately rather than allowed to move the headline average on its own."),
        _q("Which is the strongest definition of 'clean data'?",
           ["Data with no missing values",
            "Data whose remaining imperfections are known, documented, and appropriate for the question being asked",
            "Data that has been through a cleaning script",
            "Data with consistent dtypes"], 1,
           "There is no absolutely clean dataset. 'Clean' is relative to the analysis — and the documentation of what remains is what makes it usable by anyone else."),

        # ── pandas mechanics (8-15) ──
        _q("`df.groupby('category')['revenue'].sum()` returns:",
           ["A DataFrame with two columns", "A Series indexed by category",
            "A dict", "A NumPy array"], 1,
           "Aggregating a single selected column gives a Series whose index is the group key. Selecting a list of columns instead would give a DataFrame."),
        _q("By default, groupby does what with rows whose key is NaN?",
           ["Groups them under 'NaN'", "Excludes them entirely",
            "Raises an error", "Assigns them to the first group"], 1,
           "They vanish silently — which is why grouped totals can fall short of the overall total. `dropna=False` includes them as their own group."),
        _q("Which reliably counts unique customers?",
           ["len(df['customer_id'])", "df['customer_id'].nunique()",
            "df['customer_id'].count()", "df.shape[0]"], 1,
           "nunique() counts distinct non-null values. count() counts non-null rows, and len()/shape counts rows — neither de-duplicates."),
        _q("What does `df.loc[df['quantity'] < 0]` return?",
           ["The count of negative quantities", "The rows where quantity is negative",
            "A boolean Series", "The quantity column only"], 1,
           "The inner expression is a boolean mask; .loc uses it to select rows. Passing the mask alone would give you the Series of True/False."),
        _q("`pd.merge(a, b, on='customer_id', how='left')` keeps:",
           ["Only rows present in both frames", "Every row of `a`, with nulls where `b` has no match",
            "Every row of both frames", "Only rows unique to `a`"], 1,
           "A left join preserves the left frame's row count — unless `b` has duplicate keys, in which case rows multiply. Checking the row count after a merge catches that."),
        _q("Why is chained assignment like `df[df.x > 0]['y'] = 1` unreliable?",
           ["It is slower", "It may write to a temporary copy rather than the original frame, so the change silently does not persist",
            "It only works on numeric columns", "It requires an explicit copy() first"], 1,
           "This is the SettingWithCopyWarning. `df.loc[df.x > 0, 'y'] = 1` addresses the frame in one operation and always writes through."),
        _q("Which gives the median order value?",
           ["df['revenue'].mean()", "df['revenue'].median()",
            "df['revenue'].mode()", "df['revenue'].quantile(0.25)"], 1,
           "The median is the 50th percentile — `.quantile(0.5)` is equivalent. It is the more honest headline when the distribution is skewed by a few large orders."),
        _q("`df.describe()` on a numeric column does NOT report:",
           ["count and mean", "std and quartiles", "The number of missing values", "min and max"], 2,
           "It reports the count of non-null values, from which missing can be inferred, but never states the missing count directly. isna().sum() does."),

        # ── SQL (16-21) ──
        _q("Which clause filters rows BEFORE aggregation?",
           ["HAVING", "WHERE", "GROUP BY", "ORDER BY"], 1,
           "WHERE filters rows; HAVING filters the groups that aggregation produced. Putting an aggregate in WHERE is an error, and putting a row condition in HAVING scans more data than it needs to."),
        _q("`SELECT channel, SUM(revenue) FROM orders GROUP BY channel HAVING SUM(revenue) > 10000` returns:",
           ["Every channel with its revenue", "Only channels whose total revenue exceeds 10,000",
            "Only orders over 10,000", "An error — HAVING requires WHERE"], 1,
           "HAVING applies to the aggregated result, which is exactly the case where WHERE cannot be used."),
        _q("What does a LEFT JOIN produce for a left row with no match on the right?",
           ["The row is dropped", "The row is kept with NULLs in the right-hand columns",
            "The row is duplicated", "An error"], 1,
           "That is the whole purpose — 'keep everything on the left'. Counting the resulting NULLs is a quick way to measure match rate."),
        _q("`COUNT(*)` and `COUNT(column)` differ how?",
           ["They are identical", "COUNT(*) counts rows; COUNT(column) counts rows where that column is not NULL",
            "COUNT(*) is slower", "COUNT(column) counts distinct values"], 1,
           "The gap between them on the same table is a null count. COUNT(DISTINCT column) is a third, different thing."),
        _q("Which finds the second-highest revenue per customer most robustly?",
           ["ORDER BY revenue DESC LIMIT 1 OFFSET 1",
            "A window function: ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY revenue DESC), filtered to 2",
            "MAX(revenue) - 1", "SELECT TOP 2"], 1,
           "OFFSET works for one global row; a window function does it per customer in a single pass, which is what 'per customer' requires."),
        _q("In what order does SQL logically evaluate these?",
           ["SELECT → FROM → WHERE → GROUP BY", "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY",
            "WHERE → FROM → SELECT → GROUP BY", "GROUP BY → FROM → WHERE → SELECT"], 1,
           "SELECT runs late — which is why a column alias defined in SELECT cannot normally be used in WHERE, but can be used in ORDER BY."),

        # ── Business metrics (22-27) ──
        _q("Average Order Value is:",
           ["Revenue ÷ customers", "Revenue ÷ orders", "Revenue ÷ units", "Revenue ÷ rows"], 1,
           "Per order. Revenue ÷ customers is revenue per customer; both are useful and they are not interchangeable."),
        _q("Revenue rose 20% while order count rose 35%. What happened?",
           ["Nothing notable — both are up", "AOV fell: more orders, each smaller on average, which may mean discounting is buying volume at the cost of margin",
            "The data is inconsistent", "Customers are more loyal"], 1,
           "Growth in the two numbers at different rates IS the finding. Reporting only 'revenue up 20%' hides a margin story a VP would want."),
        _q("Which metric best answers 'are customers coming back'?",
           ["Total revenue", "Repeat purchase rate — the share of customers with more than one order",
            "AOV", "Units per order"], 1,
           "Revenue and AOV can both rise while the customer base churns underneath. Repeat rate measures retention directly."),
        _q("A cohort analysis groups customers by:",
           ["Revenue band", "The period in which they first purchased, so groups are compared at the same age rather than the same calendar date",
            "Geography", "Product category"], 1,
           "It separates 'this month was bad' from 'customers acquired in March were always weaker' — a distinction a calendar-based view cannot make."),
        _q("Why is the median often more honest than the mean for order value?",
           ["It is easier to compute", "It resists distortion from a small number of very large orders, which are common in commerce data",
            "It is always higher", "Executives prefer it"], 1,
           "One $99,999 order moves the mean and leaves the median untouched. Reporting both, and the gap between them, tells the fuller story."),
        _q("Units per order tells you most directly about:",
           ["Customer loyalty", "Basket size — whether people buy one item or several, which is what cross-sell and bundling try to move",
            "Profit margin", "Channel efficiency"], 1,
           "It is the volume half of AOV. AOV can rise from higher prices or fuller baskets, and units per order separates the two."),

        # ── Segmentation (28-32) ──
        _q("RFM stands for:",
           ["Revenue, Frequency, Margin", "Recency, Frequency, Monetary",
            "Retention, Frequency, Monetary", "Recency, Fulfilment, Margin"], 1,
           "How recently they bought, how often, and how much — three cheap signals that between them explain a lot of customer value."),
        _q("Recency should be anchored to:",
           ["Today's date", "The maximum order date in the dataset, so the analysis is reproducible",
            "The dataset's first order", "The customer's first order"], 1,
           "Anchor to today and re-running the script tomorrow shifts every score, making two runs of the same analysis disagree."),
        _q("`pd.qcut` raises a duplicate-edges error when:",
           ["The column has nulls", "The distribution is lumpy enough that quantile boundaries are not distinct — typically because many customers share one value",
            "There are fewer than 5 rows", "The labels are numeric"], 1,
           "Common with frequency, where most customers have ordered exactly once. `duplicates='drop'` proceeds; the lumpiness itself is worth reporting."),
        _q("A segment is actionable when it names:",
           ["Its RFM score", "Who the customers are, why they are grouped, and what to do about them",
            "Its size", "Its algorithm"], 1,
           "'At-Risk High Value — top 20% spend, no order in 90 days, send a win-back offer' can be acted on today. '344' cannot."),
        _q("Why not simply rank customers by total spend and take the top 10%?",
           ["It is statistically invalid", "Because it treats a customer who spent heavily two years ago as identical to one spending now — recency and frequency carry information spend alone does not",
            "Because 10% is arbitrary", "It is a perfectly good approach with no drawback"], 1,
           "Spend alone cannot distinguish a loyal active customer from a lapsed one who once made a large purchase. That distinction is the entire point of adding R and F."),

        # ── Experiments & statistics (33-38) ──
        _q("A p-value of 0.03 means:",
           ["A 3% chance the null hypothesis is true", "A 97% chance the variant works",
            "If the null hypothesis were true, data at least this extreme would occur about 3% of the time",
            "The effect size is 3%"], 2,
           "It is the probability of the data given the null, never the probability of the hypothesis given the data. This reversal is the most common statistical error in analytics."),
        _q("Statistical significance with a tiny effect size means:",
           ["The result is wrong", "The difference is probably real but may be too small to matter — the decision now depends on cost, not on the p-value",
            "The sample was too small", "The test should be re-run"], 1,
           "A large enough sample makes almost any difference significant. Significance answers 'is it real'; effect size answers 'do we care'."),
        _q("A control arm of 900 against a variant arm of 4,000 in a 50/50 test indicates:",
           ["Nothing — the test simply ran unevenly", "Sample-ratio mismatch — assignment, logging or filtering is broken, and the result cannot be trusted until it is explained",
            "The variant is more popular", "That the control needs padding"], 1,
           "A randomised split should be roughly even. A 4:1 skew is a health-check failure that invalidates the comparison before the metric is even examined."),
        _q("Which comparison does a two-sample t-test make?",
           ["Whether two proportions differ", "Whether the MEANS of two groups differ by more than chance would explain",
            "Whether two distributions have the same shape", "Whether two variables are correlated"], 1,
           "Means. Comparing conversion RATES calls for a proportions test; comparing whole distributions calls for something like Mann-Whitney."),
        _q("Why does peeking at an experiment daily and stopping at the first p < 0.05 inflate false positives?",
           ["It does not", "Because each look is another chance for random noise to cross the threshold, so the true error rate is far above 5%",
            "Because the sample is too small early on", "Because p-values are unstable in pandas"], 1,
           "Twenty independent looks at α = 0.05 give roughly a 64% chance of at least one false positive. Fix the sample size in advance, or use a sequential test designed for it."),
        _q("Correlation between ice-cream sales and drowning deaths is strong. The correct reading is:",
           ["Ice cream causes drowning", "A third factor — hot weather — drives both, so the correlation is real and the causal story is not",
            "The data is wrong", "Drowning drives ice-cream sales"], 1,
           "The textbook confounder. The correlation is genuine; the inference from it is the error."),

        # ── Communication & judgement (39-40) ──
        _q("An executive brief should open with:",
           ["The methodology", "The recommendation and the decision being asked for",
            "The data sources", "A summary of the tasks completed"], 1,
           "The reader who stops after two lines still gets the decision. Chronological order serves the writer, not the reader."),
        _q("You discover a caveat that weakens your headline recommendation the day before presenting. You should:",
           ["Leave it out and mention it if asked", "State it alongside the recommendation, because a stakeholder who finds it later has reason to doubt every number you produce",
            "Delay the presentation", "Soften the recommendation without explaining why"], 1,
           "Credibility compounds across every analysis you will ever present. A caveat you raised is diligence; the same one discovered by someone else is a reason to re-audit your work."),
    ],
}

FINAL_ASSESSMENT["questions"] = _spread(FINAL_ASSESSMENT["questions"])
