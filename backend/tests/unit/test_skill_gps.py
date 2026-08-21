"""Skill GPS invariants.

The Skill GPS is arithmetic over two independently-edited datasets: the skill
points each task awards (content, spread across the sim templates) and the
benchmark each role demands (product config). Nothing connected them, and they
had drifted badly:

  * the Engineering sim awarded a skill called "async", but the frontend
    benchmark asks for "async_data" — the points landed in a row no page read;
  * "component_design" was benchmarked but awarded by no task at all, so it was
    a gap no amount of work could close;
  * completing every task in the Data Analytics sim reached 26% readiness for
    Junior Data Analyst, because the awards were roughly a quarter of the
    benchmark;
  * the UI offered roles ("mid_da", "lead_da") that had no benchmark, and
    compute_skill_gps silently answered them with junior_da's numbers.

These tests fail on any of that, so it cannot come back quietly.
"""
import re
from collections import defaultdict
from pathlib import Path

import pytest

from app.core.config import (
    CAREER_TRACKS,
    CATEGORY_ORDER,
    DEFAULT_TARGET_ROLE,
    DOMAIN_TO_TRACK,
    ROLE_META,
    SKILL_CATEGORIES,
    SKILL_LABELS,
    TARGET_ROLE_REQUIREMENTS,
)
from app.services.skill_engine import role_catalog, role_exists, track_for_role

BACKEND = Path(__file__).resolve().parents[2]

# Which files author each track's simulation. The legacy file holds two sims,
# so it is sliced by the line ranges its builder functions occupy.
TRACK_SOURCES = {
    "junior_frontend_dev": [(p, 0, 10**9) for p in (BACKEND / "app/cms_templates/engineering").glob("*.py")],
    "junior_da": [(BACKEND / "migrate_legacy_sims.py", 400, 700)],
    "junior_sales_rep": [(BACKEND / "migrate_legacy_sims.py", 900, 1400)],
}

_AWARDS_RE = re.compile(r"skill_awards\s*=\s*\{([^}]*)\}")
_PAIR_RE = re.compile(r'"([a-z_]+)"\s*:\s*(\d+)')


def _awarded_totals(sources) -> dict[str, int]:
    """Total points a student can earn per skill by finishing one simulation."""
    totals: dict[str, int] = defaultdict(int)
    for path, lo, hi in sources:
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not lo <= lineno <= hi:
                continue
            for block in _AWARDS_RE.finditer(line):
                for key, value in _PAIR_RE.findall(block.group(1)):
                    totals[key] += int(value)
    return dict(totals)


ALL_REQUIRED_SKILLS = {k for req in TARGET_ROLE_REQUIREMENTS.values() for k in req}
ALL_AWARDED_SKILLS = {k for src in TRACK_SOURCES.values() for k in _awarded_totals(src)}


# ── config integrity ─────────────────────────────────────────────────────────

def test_every_role_has_both_a_benchmark_and_metadata():
    assert set(ROLE_META) == set(TARGET_ROLE_REQUIREMENTS)


def test_default_role_is_real():
    assert role_exists(DEFAULT_TARGET_ROLE)


def test_role_keys_are_unique_across_tracks():
    keys = [r["key"] for t in CAREER_TRACKS for r in t["roles"]]
    assert len(keys) == len(set(keys))


def test_every_track_has_a_domain_mapping():
    for track in CAREER_TRACKS:
        assert track["domains"], f"{track['key']} maps from no Simulation.domain"
        for domain in track["domains"]:
            assert DOMAIN_TO_TRACK[domain] == track["key"]


def test_senior_benchmarks_are_strictly_harder_than_junior():
    """Otherwise the career ladder is decorative — a student could be 100%
    ready for the senior rung before the junior one."""
    for track in CAREER_TRACKS:
        rungs = sorted(track["roles"], key=lambda r: r["level"])
        for lower, higher in zip(rungs, rungs[1:]):
            lo = TARGET_ROLE_REQUIREMENTS[lower["key"]]
            hi = TARGET_ROLE_REQUIREMENTS[higher["key"]]
            assert set(lo) == set(hi), f"{lower['key']} and {higher['key']} benchmark different skills"
            for skill, req in lo.items():
                assert hi[skill] > req, f"{higher['key']}.{skill} is not above {lower['key']}"


@pytest.mark.parametrize("skill", sorted(ALL_REQUIRED_SKILLS | ALL_AWARDED_SKILLS))
def test_every_skill_has_a_label_and_a_category(skill):
    assert skill in SKILL_LABELS, f"{skill} would render as a raw key"
    assert SKILL_CATEGORIES.get(skill) in CATEGORY_ORDER, f"{skill} has no valid category"


# ── content vs benchmark ─────────────────────────────────────────────────────

@pytest.mark.parametrize("role", sorted(TRACK_SOURCES))
def test_awarded_skills_are_all_benchmarked(role):
    """A task awarding a skill no role asks for is dead weight — the points are
    written to the database and never surface anywhere. This is what the
    "async"/"async_data" typo looked like."""
    orphans = set(_awarded_totals(TRACK_SOURCES[role])) - ALL_REQUIRED_SKILLS
    assert not orphans, f"{role}'s simulation awards skills no role benchmarks: {sorted(orphans)}"


@pytest.mark.parametrize("role", sorted(TRACK_SOURCES))
def test_every_benchmarked_skill_is_awarded_by_its_simulation(role):
    """A benchmarked skill with no task awarding it is a gap the student can
    never close, however much of the platform they complete."""
    awarded = _awarded_totals(TRACK_SOURCES[role])
    missing = [s for s in TARGET_ROLE_REQUIREMENTS[role] if awarded.get(s, 0) == 0]
    assert not missing, f"{role} benchmarks skills no task awards: {missing}"


@pytest.mark.parametrize("role", sorted(TRACK_SOURCES))
def test_finishing_the_simulation_reaches_full_readiness(role):
    """Completing every task on a track must reach 100% readiness for that
    track's entry-level role. It used to reach 26% for Junior DA, which made
    the headline number on the page meaningless."""
    awarded = _awarded_totals(TRACK_SOURCES[role])
    shortfalls = {
        skill: (min(100, awarded.get(skill, 0)), req)
        for skill, req in TARGET_ROLE_REQUIREMENTS[role].items()
        if min(100, awarded.get(skill, 0)) < req
    }
    assert not shortfalls, f"{role} is unreachable at 100% completion: {shortfalls}"


@pytest.mark.parametrize("role", sorted(TRACK_SOURCES))
def test_awards_do_not_exceed_the_per_skill_cap(role):
    """UserSkill.current_score is clamped at 100, so anything awarded above
    that is silently discarded and the calibration above stops meaning what it
    says."""
    over = {k: v for k, v in _awarded_totals(TRACK_SOURCES[role]).items() if v > 100}
    assert not over, f"{role} awards more than the 100-point cap: {over}"


# ── the catalog served to the frontend ───────────────────────────────────────

def test_unknown_roles_are_rejected_not_substituted():
    for fake in ("mid_da", "lead_da", "", "junior_DA"):
        assert not role_exists(fake)


def test_role_catalog_only_offers_roles_with_benchmarks():
    catalog = role_catalog(DEFAULT_TARGET_ROLE)
    offered = [r["key"] for t in catalog["tracks"] for r in t["roles"]]
    assert offered, "the catalog is empty"
    for key in offered:
        assert role_exists(key)
        assert track_for_role(key) is not None
    assert catalog["recommended"] in offered


def test_role_catalog_reports_the_real_skill_count():
    for track in role_catalog(DEFAULT_TARGET_ROLE)["tracks"]:
        for role in track["roles"]:
            assert role["skill_count"] == len(TARGET_ROLE_REQUIREMENTS[role["key"]])
