"""Analytics invariants.

Every test here corresponds to something the previous endpoint got wrong and
shipped, because none of it was covered:

  * the period selector changed nothing — week, month and "all time" returned
    identical payloads;
  * the trend arrows were hardcoded and the delta they were drawn beside was
    never sent at all;
  * the heatmap emitted two intensity levels under a four-level legend, and its
    columns were rolling 7-day windows rather than calendar weeks;
  * the streak required TODAY to be active, so finishing yesterday and opening
    the page this morning read as a streak of 0;
  * the streak compared UTC completion timestamps against the server's LOCAL
    date.
"""
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.v1.analytics.analytics import (
    HEATMAP_WEEKS,
    PERIODS,
    _activity_series,
    _heatmap,
    _intensity,
    _mean,
    _resolve_period,
    _stat,
    _streak,
    _xp_breakdown,
)

UTC = timezone.utc
SPEC7 = {"label": "Last 7 days", "days": 7}


def _xp(days_ago: int, amount: int, source="task_1_completion"):
    return SimpleNamespace(
        amount=amount, source=source,
        created_at=datetime.now(UTC) - timedelta(days=days_ago),
    )


def _done(days_ago: int, score=None, simulation_id=1, task_id=1):
    return SimpleNamespace(
        task_id=task_id, score=score, quiz_score=None, simulation_id=simulation_id,
        completed_at=datetime.now(UTC) - timedelta(days=days_ago),
    )


# ── periods ──────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("raw,expected", [
    ("week", "week"), ("MONTH", "month"), ("all", "all"),
    ("all time", "all"), ("  All Time ", "all"), ("alltime", "all"),
])
def test_period_aliases_resolve(raw, expected):
    key, spec = _resolve_period(raw)
    assert key == expected
    assert spec is PERIODS[expected]


def test_unknown_period_is_rejected():
    """The old endpoint accepted anything and quietly treated it as a year."""
    with pytest.raises(HTTPException) as exc:
        _resolve_period("fortnight")
    assert exc.value.status_code == 400


# ── stats and comparisons ────────────────────────────────────────────────────

def test_stat_reports_a_real_delta_and_direction():
    s = _stat("xp", "XP earned", "XP", 500, 200, SPEC7, comparable=True)
    assert (s["delta"], s["direction"]) == (300, "up")
    assert s["comparison"] == "vs previous 7 days"


def test_stat_going_down_says_so():
    """`up` used to be hardcoded True, so a decline rendered as a green rise."""
    s = _stat("xp", "XP earned", "XP", 100, 400, SPEC7, comparable=True)
    assert (s["delta"], s["direction"]) == (-300, "down")


def test_stat_with_no_change_is_flat_not_up():
    s = _stat("xp", "XP earned", "XP", 250, 250, SPEC7, comparable=True)
    assert s["direction"] == "flat"


def test_stat_distinguishes_nothing_to_compare_from_not_comparable():
    empty_window = _stat("avg", "Average score", "/100", 80, None, SPEC7, comparable=True)
    assert empty_window["delta"] is None
    assert "Nothing to compare" in empty_window["comparison"]

    all_time = _stat("avg", "Average score", "/100", 80, None, SPEC7, comparable=False)
    assert all_time["delta"] is None and all_time["comparison"] is None


def test_missing_average_stays_none_rather_than_zero():
    """0/100 for a student with no graded tasks reads as a failing grade."""
    assert _mean([]) is None
    assert _stat("avg", "Average score", "/100", None, None, SPEC7, comparable=True)["value"] is None


# ── streak ───────────────────────────────────────────────────────────────────

def test_streak_survives_a_day_that_is_not_over_yet():
    """THE bug: worked yesterday, opened the page this morning, told it was 0."""
    today = date(2026, 8, 19)
    dates = [today - timedelta(days=n) for n in (1, 2, 3)]
    assert _streak(dates, today)["current"] == 3


def test_streak_counts_today_when_today_is_active():
    today = date(2026, 8, 19)
    assert _streak([today, today - timedelta(days=1)], today)["current"] == 2


def test_streak_breaks_after_a_full_missed_day():
    today = date(2026, 8, 19)
    dates = [today - timedelta(days=n) for n in (2, 3, 4)]
    assert _streak(dates, today)["current"] == 0


def test_streak_reports_the_longest_run_even_once_broken():
    today = date(2026, 8, 19)
    dates = [today - timedelta(days=n) for n in (10, 11, 12, 13, 20)]
    result = _streak(dates, today)
    assert result["current"] == 0
    assert result["longest"] == 4


def test_streak_flags_whether_today_is_already_counted():
    today = date(2026, 8, 19)
    assert _streak([today - timedelta(days=1)], today)["active_today"] is False
    assert _streak([today], today)["active_today"] is True


def test_streak_on_an_empty_history():
    assert _streak([], date(2026, 8, 19)) == {
        "current": 0, "longest": 0, "last_active": None, "active_today": False,
    }


# ── activity series ──────────────────────────────────────────────────────────

def test_activity_series_covers_the_whole_window_including_empty_days():
    """A gap in the chart is information; skipping empty days would compress
    two weeks of nothing into no visible space at all."""
    now = datetime.now(UTC)
    series = _activity_series([_xp(1, 50)], [_done(1)], now - timedelta(days=6), now, 7)
    assert series["granularity"] == "day"
    assert len(series["points"]) == 7
    assert series["total_xp"] == 50 and series["total_tasks"] == 1
    assert sum(1 for p in series["points"] if p["xp"] == 0) == 6


def test_long_periods_switch_to_weekly_buckets():
    """180 daily bars is a smear. This is also the proof that the period
    actually reaches the chart — the old one always drew the current week."""
    now = datetime.now(UTC)
    series = _activity_series([], [], now - timedelta(days=90), now, 90)
    assert series["granularity"] == "week"
    assert 12 <= len(series["points"]) <= 14


def test_different_periods_produce_different_series():
    now = datetime.now(UTC)
    xp = [_xp(1, 10), _xp(20, 90)]
    week = _activity_series(xp, [], now - timedelta(days=7), now, 7)
    month = _activity_series(xp, [], now - timedelta(days=30), now, 30)
    assert week["total_xp"] == 10
    assert month["total_xp"] == 100
    assert week["points"] != month["points"]


def test_activity_outside_the_window_is_excluded():
    now = datetime.now(UTC)
    series = _activity_series([_xp(40, 500)], [_done(40)], now - timedelta(days=7), now, 7)
    assert series["total_xp"] == 0 and series["total_tasks"] == 0


# ── heatmap ──────────────────────────────────────────────────────────────────

def test_heatmap_columns_are_calendar_weeks_starting_monday():
    """The old grid used rolling 7-day windows, so row 0 was not a weekday and
    the grid lined up with no calendar."""
    grid = _heatmap([], [], date(2026, 8, 19))
    for column in grid["weeks"]:
        assert date.fromisoformat(column[0]["date"]).weekday() == 0
        assert date.fromisoformat(column[6]["date"]).weekday() == 6
    assert len(grid["weeks"]) == HEATMAP_WEEKS


def test_heatmap_uses_all_four_intensity_levels():
    """The legend advertises four shades; the old grid only ever emitted 0 and 3."""
    assert _intensity(0, 10) == 0
    assert _intensity(1, 10) == 1
    assert _intensity(5, 10) == 2
    assert _intensity(10, 10) == 3


def test_intensity_is_relative_to_the_students_own_busiest_day():
    """Absolute thresholds leave a light user permanently on one shade."""
    assert _intensity(1, 1) == 3
    assert _intensity(1, 12) == 1


def test_heatmap_marks_future_days_so_they_are_not_drawn_as_inactive():
    today = date(2026, 8, 19)   # a Wednesday
    grid = _heatmap([], [], today)
    last = grid["weeks"][-1]
    assert [c["future"] for c in last] == [False, False, False, True, True, True, True]


def test_heatmap_counts_tasks_per_day():
    today = datetime.now(UTC).date()
    grid = _heatmap([_done(0), _done(0), _done(1)], [], today)
    cells = {c["date"]: c for week in grid["weeks"] for c in week}
    assert cells[today.isoformat()]["tasks"] == 2
    assert grid["busiest_day_tasks"] == 2
    assert grid["active_days"] == 2


# ── xp breakdown ─────────────────────────────────────────────────────────────

def test_xp_breakdown_classifies_by_ledger_source():
    now = datetime.now(UTC)
    rows = [
        _xp(1, 100, "task_1_completion"),
        _xp(1, 50, "task_2_completion"),
        _xp(1, 20, "task_3_quiz_bonus"),
        _xp(1, 20, "task_4_assessment_bonus"),
    ]
    out = {r["key"]: r for r in _xp_breakdown(rows, now - timedelta(days=7))}
    assert out["completion"]["xp"] == 150 and out["completion"]["count"] == 2
    assert out["quiz_bonus"]["xp"] == 20
    assert out["assessment_bonus"]["xp"] == 20


def test_xp_breakdown_is_ordered_largest_first():
    now = datetime.now(UTC)
    rows = [_xp(1, 10, "task_1_completion"), _xp(1, 900, "task_2_quiz_bonus")]
    assert [r["key"] for r in _xp_breakdown(rows, now - timedelta(days=7))] == ["quiz_bonus", "completion"]
