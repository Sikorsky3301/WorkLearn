"""Standalone practice sandboxes — code with no task, no grading, no score.

WHY THIS IS SEPARATE FROM sandbox.py

/api/sandbox/* is the GRADED path: it needs an enrollment, a task, a grader,
a seeded dataset and a reference solution, and everything it does is aimed at
producing a defensible score. None of that applies to somebody who just wants
to try a pandas expression, so none of it is required here.

What this shares is the part that matters — the identical container, run
through the same `sandbox.run_submission`, with the same `--network=none`,
memory cap, pid cap, dropped capabilities and timeout. A practice sandbox that
was easier to escape than the graded one would be the obvious way in.

WHAT IS DELIBERATELY ABSENT

  * No grading. This endpoint returns stdout/stderr and nothing else, so there
    is no score to farm and no artifact to chain into a graded task.
  * No persistence. Nothing is written to the artifact store, so a practice
    run can never be mistaken for a submission, and the Explorer on a graded
    task cannot be polluted from here.
  * No dataset seeding. The graded path derives its dataset from the
    enrollment id; there is no enrollment here, so there is nothing to leak.

The catalogue below is the single source of truth for which sandboxes exist —
served to the frontend rather than hardcoded there, for the same reason the
Skill GPS role list and the analytics period list are served: a page that
invents its own options drifts away from what the backend can actually do, and
nothing reports it. A sandbox whose image is not built is listed with
`available: false` and the UI shows it as unavailable rather than offering a
button that 503s.
"""
import logging
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.core.config import settings
from app.services import sandbox

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/playground", tags=["playground"])

# Cap well under the graded path's limit. Practice runs are interactive — a
# student is waiting and watching — and a 45s hang reads as a broken page.
PLAYGROUND_TIMEOUT_SECONDS = 20
MAX_CODE_BYTES = 100_000


class RunBody(BaseModel):
    sandbox: str = Field(min_length=1, max_length=64)
    code: str


# Jest refuses a file that declares no test ("Your test suite must contain at
# least one test"), and the frontend image runs everything through Jest. For
# the React sandbox that is no imposition — rendering and asserting IS a test,
# and it matches how the graded React tasks are written. For plain JavaScript
# it would be: somebody trying an array method should not have to wrap it in a
# test block first.
#
# So when the code declares no test, one empty test is appended. The student's
# code still runs — Jest executes a module's top level on load, so top-level
# imports and console.log work exactly as they would under node — and the
# no-op test is only there to stop Jest rejecting the file.
_DECLARES_A_TEST = re.compile(r"^\s*(test|it|describe)\s*[.(]", re.MULTILINE)
_NOOP_TEST = (
    "\n\n// added so Jest accepts the file — your code above already ran\n"
    "test('ran', () => {})\n"
)


def _prepare(spec: dict, code: str) -> str:
    if spec["filename"].endswith(".test.js") and not _DECLARES_A_TEST.search(code):
        return code + _NOOP_TEST
    return code


# Every entry's `packages` and `runtime` are read off the real image
# definition in backend/sandboxes/ — see each Dockerfile and package.json.
# If you change an image, change this, or the page starts advertising
# libraries that are not installed.
#
# `filename` is NOT free choice. Each image's entrypoint looks for one exact
# path and ignores everything else:
#     sandboxes/python/entrypoint.py    → /workspace/submission.py
#     sandboxes/frontend/entrypoint.js  → /workspace/submission.test.js
# Writing the file under any other name runs the container successfully and
# prints "No submission.py found", which looks like a student error and is
# not one.
SANDBOXES: list[dict] = [
    {
        "key": "python",
        "logo": "/images/tech/python.svg",
        "name": "Python for Data",
        "runtime": "Python 3.12",
        "image": settings.sandbox_image,
        "filename": "submission.py",
        "language": "python",
        "available": True,
        "summary": "pandas, NumPy and SciPy against your own data — the same container the Data Analyst simulation grades in.",
        "capabilities": [
            "Explore and reshape data with pandas DataFrames",
            "Run statistics and hypothesis tests with SciPy and statsmodels",
            "Render charts with matplotlib (headless — save, don't show)",
        ],
        "packages": ["pandas 2.2.3", "numpy 2.1.3", "scipy 1.14.1", "statsmodels 0.14.4", "matplotlib 3.9.2"],
        "used_by": ["da-job-sim"],
        "starter": (
            "import pandas as pd\n"
            "import numpy as np\n\n"
            "df = pd.DataFrame({\n"
            "    'channel': ['Email', 'Email', 'Paid Search', 'Social'],\n"
            "    'revenue': [120.50, 88.00, 45.25, 210.75],\n"
            "})\n\n"
            "print(df.groupby('channel')['revenue'].sum())\n"
            "print(f\"total: {df['revenue'].sum():,.2f}\")\n"
        ),
    },
    {
        "key": "javascript",
        "logo": "/images/tech/javascript.svg",
        "name": "JavaScript",
        "runtime": "Node 20",
        "image": settings.sandbox_image_frontend,
        "filename": "submission.test.js",
        "language": "javascript",
        "available": True,
        "summary": "Plain Node — no bundler, no framework. Good for working through language mechanics on their own.",
        "capabilities": [
            "Practise array and object methods, closures and destructuring",
            "Work through async/await, promises and error handling",
            "Check what a snippet actually does before putting it in a task",
        ],
        "packages": ["Node 20"],
        "used_by": ["frontend-dev-sim"],
        "starter": (
            "const orders = [\n"
            "  { channel: 'Email', revenue: 120.5 },\n"
            "  { channel: 'Email', revenue: 88 },\n"
            "  { channel: 'Social', revenue: 210.75 },\n"
            "]\n\n"
            "const byChannel = orders.reduce((acc, o) => {\n"
            "  acc[o.channel] = (acc[o.channel] ?? 0) + o.revenue\n"
            "  return acc\n"
            "}, {})\n\n"
            "console.log(byChannel)\n"
        ),
    },
    {
        "key": "react",
        "logo": "/images/tech/react.svg",
        "name": "React",
        "runtime": "React 18 · Testing Library",
        "image": settings.sandbox_image_frontend,
        "filename": "submission.test.js",
        "language": "jsx",
        "available": True,
        "summary": "React 18 with Testing Library and jsdom — the container the Frontend Developer simulation grades React tasks in.",
        "capabilities": [
            "Render a component and assert on what the user would actually see",
            "Practise hooks, controlled inputs and lifting state",
            "Query by role and label, the way the graders do",
        ],
        "packages": ["react 18.3.1", "@testing-library/react 16.0.1", "jest 29.7.0", "jsdom"],
        "used_by": ["frontend-dev-sim"],
        # jsdom has no browser, so this runs AS a test — which is also how the
        # graded React tasks are checked, so the habit transfers.
        "starter": (
            "import { render, screen } from '@testing-library/react'\n"
            "import '@testing-library/jest-dom'\n\n"
            "function Greeting({ name }) {\n"
            "  return <h1>Hello, {name}</h1>\n"
            "}\n\n"
            "test('greets by name', () => {\n"
            "  render(<Greeting name=\"Rishi\" />)\n"
            "  expect(screen.getByRole('heading')).toHaveTextContent('Hello, Rishi')\n"
            "})\n"
        ),
    },
    {
        "key": "sql",
        "logo": "/images/tech/postgresql.svg",
        "name": "PostgreSQL",
        "runtime": "not built yet",
        "image": None,
        "filename": "query.sql",
        "language": "sql",
        # PostgreSQL's mark, not SQLite's, because the platform already runs
        # Postgres — so a student who learns the dialect shown here learns the
        # one the product actually speaks. Change the logo if the image is
        # ever built on something else.
        #
        # No image exists for this. Listed so the catalogue reflects where the
        # platform is going, and marked unavailable so the UI shows it as such
        # instead of offering a button that would 503 — the same honest-preview
        # treatment the Navbar gives its future domains.
        "available": False,
        "summary": "SQL against a queryable copy of the Lumen orders dataset, in the same dialect the platform itself runs. Not built yet — the SQL taught in the Data Analyst simulation is currently practised in pandas.",
        "capabilities": [
            "Joins, aggregation and window functions against real order data",
            "Compare a SQL result to the same answer written in pandas",
        ],
        "packages": [],
        "used_by": [],
        "starter": "-- Coming soon\nSELECT channel, SUM(revenue) FROM orders GROUP BY channel;\n",
    },
]

# ── Not built yet ────────────────────────────────────────────────────────────
#
# The rest of the technology set the platform advertises (the hero strip —
# frontend/src/features/marketing/data/technologies.js) listed as previews.
#
# Every one of these is `available: false` because no container image exists
# for it, and the UI renders that as "Not available yet" rather than a button
# that would 503. Listing them is the point: a student can see where the
# platform is going, and nobody has to maintain a second list of "planned"
# somewhere else that drifts from this one.
#
# `summary` says what the sandbox WOULD be, in one honest sentence. No
# capability list is invented for an image that does not exist — two lines of
# genuine intent beats six of plausible-sounding filler.
#
# To promote one: build the image, add its packages here, flip `available`, and
# give it a real `starter`. verify the run endpoint answers 200 before shipping.
_COMING_SOON = [
    ("nodedotjs", "Node.js", "nodedotjs",
     "Server-side JavaScript with the filesystem and HTTP modules available — the half of Node the "
     "browser sandbox cannot reach."),
    ("sqlite", "SQLite", "sqlite",
     "A single-file database you create, populate and query inside one script — no server, no "
     "connection string. The lightweight counterpart to the PostgreSQL sandbox above."),
    ("cplusplus", "C++", "cplusplus",
     "A compile-and-run sandbox for the language most data-structures courses are taught in."),
    ("gnubash", "Bash", "gnubash",
     "A real shell over a small file tree — pipes, grep, awk and the text-wrangling that precedes "
     "most analysis."),
    ("rubyonrails", "Ruby on Rails", "rubyonrails",
     "A Rails console against a seeded schema, for practising ActiveRecord queries without "
     "scaffolding an app first."),
    ("tensorflow", "TensorFlow", "tensorflow",
     "Model building on CPU against a small prepared dataset. Training anything substantial needs "
     "the GPU runtime, which is a separate piece of work."),
    ("pytorch", "PyTorch", "pytorch",
     "Tensors, autograd and a short training loop on CPU — enough to learn the mechanics before "
     "the dataset gets large."),
    ("huggingface", "Hugging Face", "huggingface",
     "The transformers API against small local models. Blocked today by the no-network rule, which "
     "means every weight would have to be baked into the image."),
    ("modelcontextprotocol", "Model Context Protocol", "modelcontextprotocol",
     "Writing and testing an MCP server, then calling its tools from a client in the same sandbox."),
    ("perplexity", "Perplexity", "perplexity",
     "Practising retrieval-augmented prompting against a fixed local corpus. Needs an offline index "
     "before it can exist here."),
    ("rstudioide", "R", "rstudioide",
     "R with the tidyverse, for the statistics courses that teach in R rather than pandas."),
    ("github", "Git", "github",
     "A scratch repository for practising branching, rebasing and resolving a conflict without "
     "risking anything real."),
    ("codechef", "Competitive Programming", "codechef",
     "Timed algorithm problems with hidden test cases, scored the way a contest scores them."),
]

SANDBOXES += [
    {
        "key": key,
        "logo": f"/images/tech/{logo}.svg",
        "name": name,
        "runtime": "not built yet",
        "image": None,
        "filename": "",
        "language": "plaintext",
        "available": False,
        "summary": summary,
        "capabilities": [],
        "packages": [],
        "used_by": [],
        "starter": "",
    }
    for key, name, logo, summary in _COMING_SOON
]


_BY_KEY = {s["key"]: s for s in SANDBOXES}

# `starter` is the only field the list endpoint withholds — it is long, and the
# catalogue page renders cards, not editors. The detail endpoint serves it.
_LIST_FIELDS = ("key", "logo", "name", "runtime", "language", "available", "summary",
                "capabilities", "packages", "used_by")


# ── Jest console extraction ──────────────────────────────────────────────────
#
# The frontend image runs everything through Jest, and Jest does not put
# console.log on stdout. It buffers it and re-prints it to STDERR inside a
# "● Console" block, interleaved with the file location of each call:
#
#     PASS ./submission.test.js
#       ● Console
#
#         console.log
#           total: 331.25
#
#           at Object.log (../../workspace/submission.test.js:3:9)
#
#     Test Suites: 1 passed, 1 total
#
# Left alone, a student pressing Run in the JavaScript sandbox sees an empty
# output pane and their own print nowhere — which is what happened the first
# time this was wired up. So the block is parsed back out and returned as
# stdout, and the rest of Jest's reporter output stays in stderr where a real
# failure will be.

_CONSOLE_HEADER = re.compile(r"^\s*●\s*Console\s*$")
_CONSOLE_KIND = re.compile(r"^\s*console\.(log|info|warn|error|debug)\s*$")
_AT_LOCATION = re.compile(r"^\s*at\s+.*\(.*\)\s*$")
_SUMMARY_START = re.compile(r"^(Test Suites:|Tests:|Snapshots:|Time:|Ran all test)")


def _split_jest_console(stderr: str) -> tuple[str, str]:
    """Return (console output, everything else) from Jest's stderr."""
    if not stderr:
        return "", ""

    console_lines: list[str] = []
    other_lines: list[str] = []
    in_console = False

    for line in stderr.splitlines():
        if _CONSOLE_HEADER.match(line):
            in_console = True
            continue
        if in_console:
            # The summary block ends the console section; so does a new
            # PASS/FAIL header for another file.
            if _SUMMARY_START.match(line) or line.startswith(("PASS ", "FAIL ")):
                in_console = False
                other_lines.append(line)
                continue
            # `console.log` labels and `at ...` locations are Jest's framing,
            # not the student's output.
            if _CONSOLE_KIND.match(line) or _AT_LOCATION.match(line):
                continue
            # Jest indents the payload; strip the fixed indent, keep relative
            # structure so a printed object still lines up.
            console_lines.append(line[6:] if line.startswith(" " * 6) else line.strip())
            continue
        other_lines.append(line)

    # Collapse the blank lines Jest pads between entries, but keep one between
    # separate print statements.
    cleaned: list[str] = []
    for line in console_lines:
        if line.strip() or (cleaned and cleaned[-1].strip()):
            cleaned.append(line)
    return "\n".join(cleaned).strip(), "\n".join(other_lines).strip()


@router.get("/sandboxes")
async def list_sandboxes(_token: dict = Depends(get_current_user)):
    return {"sandboxes": [{k: s[k] for k in _LIST_FIELDS} for s in SANDBOXES]}


@router.get("/sandboxes/{key}")
async def get_sandbox(key: str, _token: dict = Depends(get_current_user)):
    spec = _BY_KEY.get(key)
    if not spec:
        raise HTTPException(404, f"No sandbox named {key!r}")
    return {k: v for k, v in spec.items() if k != "image"}


@router.post("/run")
async def run(body: RunBody, _token: dict = Depends(get_current_user)):
    """Run a snippet and return what it printed. No score, nothing saved."""
    spec = _BY_KEY.get(body.sandbox)
    if not spec:
        raise HTTPException(404, f"No sandbox named {body.sandbox!r}")
    if not spec["available"]:
        raise HTTPException(409, f"The {spec['name']} sandbox isn't available yet.")
    if not body.code.strip():
        raise HTTPException(400, "There's no code to run.")
    if len(body.code.encode("utf-8")) > MAX_CODE_BYTES:
        raise HTTPException(400, "That file is too large to run here.")

    try:
        result = await sandbox.run_submission(
            _prepare(spec, body.code),
            image=spec["image"],
            submission_filename=spec["filename"],
            timeout=PLAYGROUND_TIMEOUT_SECONDS,
        )
    except Exception as exc:
        logger.exception("playground run failed to start (sandbox=%s)", body.sandbox)
        raise HTTPException(
            503,
            f"The sandbox could not start ({type(exc).__name__}). "
            "This is a server-side problem, not your code.",
        ) from exc

    try:
        stdout = result.stdout or ""
        stderr = result.stderr or ""

        if spec["filename"].endswith(".test.js"):
            console_out, remainder = _split_jest_console(stderr)
            stdout = "\n".join(x for x in (stdout.strip(), console_out) if x)
            stderr = remainder

        # Truncated for the same reason the graded path truncates: a runaway
        # loop can print megabytes, and none of it belongs in a JSON response.
        return {
            "stdout": stdout[-20_000:],
            "stderr": stderr[-20_000:],
            "timed_out": result.timed_out,
            "timeout_seconds": PLAYGROUND_TIMEOUT_SECONDS,
        }
    finally:
        sandbox.cleanup(result.workdir)
