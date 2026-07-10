"""
Sandbox harness — the container's entrypoint (PID 1).

Runs /workspace/submission.py (the student's code) against files already
placed in /workspace by the backend (e.g. dataset.csv), with stdout/stderr
captured normally via the process's own streams (the backend reads these
from `docker run`'s subprocess output — no in-container capture needed).

Whatever the student's code writes to /workspace/output.* is read back by
the backend after the container exits and is what actually gets graded —
printed text is never trusted.
"""
import os
import sys
import traceback

# Headless backend — there is no display in the container.
import matplotlib
matplotlib.use("Agg")

SUBMISSION_PATH = "/workspace/submission.py"


def main() -> int:
    if not os.path.exists(SUBMISSION_PATH):
        print("No submission.py found in /workspace", file=sys.stderr)
        return 1

    with open(SUBMISSION_PATH, "r", encoding="utf-8") as f:
        code = f.read()

    os.chdir("/workspace")
    try:
        exec(compile(code, "submission.py", "exec"), {"__name__": "__main__"})
    except Exception:
        traceback.print_exc(file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
