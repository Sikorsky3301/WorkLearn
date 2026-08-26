"""Tenant visibility scoping, and the async lazy-load trap it fell into.

THE BUG THIS PINS

`assert_sim_visible_to_tenant` guarded its refresh with:

    if not hasattr(sim, "university_links") or sim.university_links is None:

On an async session, touching an unloaded relationship attribute triggers a
lazy load with no greenlet to run it in, and SQLAlchemy raises MissingGreenlet.
That is not an AttributeError, so `hasattr()` does not swallow it — the guard
written to AVOID the load was the thing performing it, and it raised every
time. Because it runs on:

    GET  /api/simulations/{slug}/onboarding
    POST /api/simulations/{slug}/enroll
    POST /api/simulations/{slug}/onboarding/accept

every simulation returned a 500 at exactly the step between the overview page
and the simulation opening. The tests below are sync and use detached
instances, which reproduces the same "attribute is not loaded" condition
without needing a database.
"""
import pytest
from sqlalchemy import inspect as sa_inspect

from app.models.cms import Simulation, SimulationStatus, SimulationUniversity
from app.services.simulation_scope import scope_payload, sim_visible_to_university


def _sim(*, status=SimulationStatus.PUBLISHED, available_to_all=True, links=None):
    """A Simulation that has never been through a session.

    `university_links` on it reports as unloaded — the same state a row freshly
    fetched with a plain select() is in, which is what every caller here has.
    """
    sim = Simulation(
        slug="test-sim", title="Test", status=status,
        available_to_all_universities=available_to_all,
    )
    if links is not None:
        sim.university_links = [SimulationUniversity(university_id=u) for u in links]
    return sim


def test_the_relationship_really_is_unloaded_in_this_fixture():
    """Guards the guard: if a future model change eager-loads this by default,
    the tests below would pass for the wrong reason."""
    assert "university_links" in sa_inspect(_sim()).unloaded


# ── the predicate must not perform IO ────────────────────────────────────────

def test_visibility_check_does_not_touch_an_unloaded_relationship():
    """The regression. Before the fix this raised MissingGreenlet in a request
    and MissingGreenlet/DetachedInstanceError here."""
    sim = _sim(available_to_all=False)
    assert sim_visible_to_university(sim, university_id=1) is False


def test_available_to_all_short_circuits_before_the_relationship():
    """The common case must not need the links at all — this is what keeps the
    ordinary published simulation cheap."""
    sim = _sim(available_to_all=True)
    assert sim_visible_to_university(sim, university_id=1) is True
    assert sim_visible_to_university(sim, university_id=None) is True


def test_scope_payload_does_not_touch_an_unloaded_relationship():
    payload = scope_payload(_sim(available_to_all=False))
    assert payload == {"available_to_all_universities": False, "university_ids": []}


# ── the visibility rules themselves ──────────────────────────────────────────

@pytest.mark.parametrize(
    "status", [s for s in SimulationStatus if s is not SimulationStatus.PUBLISHED]
)
def test_unpublished_is_never_visible(status):
    """Parametrised over the enum rather than a hardcoded list, so a status
    added later is covered without anyone remembering to come back here."""
    sim = _sim(status=status, available_to_all=True, links=[])
    assert sim_visible_to_university(sim, university_id=1) is False


def test_scoped_simulation_is_visible_only_to_a_linked_university():
    sim = _sim(available_to_all=False, links=[2, 3])
    assert sim_visible_to_university(sim, university_id=2) is True
    assert sim_visible_to_university(sim, university_id=3) is True
    assert sim_visible_to_university(sim, university_id=1) is False


def test_scoped_simulation_is_not_visible_without_a_university():
    """No tenant resolved means the scoped case cannot be answered, and
    refusing is the safe direction for a visibility check."""
    sim = _sim(available_to_all=False, links=[2])
    assert sim_visible_to_university(sim, university_id=None) is False


def test_scoped_simulation_with_no_links_is_visible_to_nobody():
    sim = _sim(available_to_all=False, links=[])
    assert sim_visible_to_university(sim, university_id=1) is False


def test_scope_payload_reports_loaded_links():
    payload = scope_payload(_sim(available_to_all=False, links=[4, 7]))
    assert payload["available_to_all_universities"] is False
    assert sorted(payload["university_ids"]) == [4, 7]


@pytest.mark.parametrize("university_id", [None, 1, 999])
def test_an_all_universities_simulation_ignores_the_tenant(university_id):
    assert sim_visible_to_university(_sim(available_to_all=True, links=[]), university_id) is True
