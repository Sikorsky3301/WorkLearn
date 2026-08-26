"""Practice sandbox catalogue invariants.

The catalogue is served rather than hardcoded in the page, which only helps if
what it serves is true. These pin the parts that would otherwise rot quietly:

  * a logo path that points at no file — the card renders a broken image and
    nobody notices, because a missing <img> is silent;
  * an entry marked available with no image behind it, which turns "Open
    sandbox" into a 503;
  * a filename the container's entrypoint does not look for, which produces
    "No submission.py found" and reads as a student error when it is ours.
"""
import pathlib

import pytest

from app.api.v1.simulations.playground import (
    MAX_CODE_BYTES,
    PLAYGROUND_TIMEOUT_SECONDS,
    SANDBOXES,
    _LIST_FIELDS,
    _prepare,
    _split_jest_console,
)
from app.core.config import settings

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
PUBLIC = REPO_ROOT / "frontend" / "public"

AVAILABLE = [s for s in SANDBOXES if s["available"]]

# The two filenames the image entrypoints actually look for.
#   sandboxes/python/entrypoint.py    -> /workspace/submission.py
#   sandboxes/frontend/entrypoint.js  -> /workspace/submission.test.js
VALID_FILENAMES = {"submission.py", "submission.test.js"}


# ── catalogue integrity ──────────────────────────────────────────────────────

def test_keys_are_unique():
    keys = [s["key"] for s in SANDBOXES]
    assert len(keys) == len(set(keys))


@pytest.mark.parametrize("spec", SANDBOXES, ids=[s["key"] for s in SANDBOXES])
def test_every_entry_is_describable(spec):
    assert spec["name"].strip(), f"{spec['key']}: no name"
    assert spec["summary"].strip(), f"{spec['key']}: no summary"
    assert spec["runtime"].strip(), f"{spec['key']}: no runtime"
    assert isinstance(spec["available"], bool)


@pytest.mark.parametrize("spec", SANDBOXES, ids=[s["key"] for s in SANDBOXES])
def test_logo_points_at_a_real_file(spec):
    """A missing <img> src fails silently in the browser — the card just shows
    nothing, and no error reaches any log."""
    assert spec["logo"].startswith("/images/tech/"), f"{spec['key']}: unexpected logo path"
    path = PUBLIC / spec["logo"].lstrip("/")
    assert path.exists(), f"{spec['key']}: {spec['logo']} does not exist in frontend/public"


# ── an available sandbox must actually be runnable ───────────────────────────

@pytest.mark.parametrize("spec", AVAILABLE, ids=[s["key"] for s in AVAILABLE])
def test_available_sandboxes_have_an_image(spec):
    assert spec["image"], f"{spec['key']}: marked available with no image"
    assert spec["image"] in (settings.sandbox_image, settings.sandbox_image_frontend), (
        f"{spec['key']}: image {spec['image']!r} is not one the app builds"
    )


@pytest.mark.parametrize("spec", AVAILABLE, ids=[s["key"] for s in AVAILABLE])
def test_available_sandboxes_use_a_filename_the_entrypoint_looks_for(spec):
    """Any other name runs the container successfully and prints
    'No submission.py found' — which looks like the student's fault."""
    assert spec["filename"] in VALID_FILENAMES, (
        f"{spec['key']}: {spec['filename']!r} is not a filename any entrypoint reads"
    )


@pytest.mark.parametrize("spec", AVAILABLE, ids=[s["key"] for s in AVAILABLE])
def test_available_sandboxes_ship_a_runnable_starter(spec):
    assert spec["starter"].strip(), f"{spec['key']}: no starter code"
    assert len(spec["starter"].encode()) < MAX_CODE_BYTES
    assert spec["capabilities"], f"{spec['key']}: no capabilities listed"
    assert spec["packages"], f"{spec['key']}: no packages listed"


@pytest.mark.parametrize(
    "spec", [s for s in SANDBOXES if not s["available"]],
    ids=[s["key"] for s in SANDBOXES if not s["available"]],
)
def test_unavailable_sandboxes_promise_nothing(spec):
    """An unbuilt sandbox must not advertise packages — the card would list
    libraries no image has."""
    assert spec["image"] is None, f"{spec['key']}: unavailable but carries an image"
    assert not spec["packages"], f"{spec['key']}: unavailable but lists packages"


# ── what the list endpoint exposes ───────────────────────────────────────────

def test_the_list_response_withholds_the_image_name():
    """The internal image tag is infrastructure, not something a student needs
    or should be able to enumerate."""
    assert "image" not in _LIST_FIELDS
    assert "starter" not in _LIST_FIELDS
    assert "logo" in _LIST_FIELDS


def test_a_shorter_timeout_than_the_graded_path():
    """Practice runs are interactive; the graded path's budget is for grading."""
    assert PLAYGROUND_TIMEOUT_SECONDS < settings.sandbox_timeout_seconds


# ── the Jest adaptations ─────────────────────────────────────────────────────

def test_a_noop_test_is_appended_only_when_none_is_declared():
    js = {"filename": "submission.test.js"}
    assert "test('ran'" in _prepare(js, "console.log('hi')")
    assert _prepare(js, "test('mine', () => {})") == "test('mine', () => {})"
    assert _prepare(js, "describe('x', () => {})") == "describe('x', () => {})"


def test_python_code_is_never_rewritten():
    py = {"filename": "submission.py"}
    assert _prepare(py, "print('hi')") == "print('hi')"


def test_console_output_is_recovered_from_jest_stderr():
    """Jest buffers console.log and re-prints it to STDERR under a Console
    block. Without this the JavaScript sandbox shows an empty output pane."""
    stderr = (
        "PASS ./submission.test.js\n"
        "  ● Console\n"
        "\n"
        "    console.log\n"
        "      total: 331.25\n"
        "\n"
        "      at Object.log (../../workspace/submission.test.js:3:9)\n"
        "\n"
        "Test Suites: 1 passed, 1 total\n"
    )
    console, rest = _split_jest_console(stderr)
    assert "total: 331.25" in console
    assert "console.log" not in console, "Jest's own label leaked into the output"
    assert "at Object.log" not in console, "the source location leaked into the output"
    assert "Test Suites: 1 passed" in rest
    assert "PASS ./submission.test.js" in rest


def test_empty_stderr_is_handled():
    assert _split_jest_console("") == ("", "")
