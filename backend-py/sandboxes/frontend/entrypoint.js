/**
 * Sandbox harness — the container's entrypoint (PID 1).
 *
 * Runs the hidden /workspace/submission.test.js (a Jest spec written
 * server-side, never sent to the student) against whatever submission file
 * the backend placed in /workspace, with the report written to
 * /workspace/output.json. A failing test is a valid, gradable result —
 * only a missing report means Jest itself never produced one (bad config,
 * an unparsable file) and counts as a harness failure, mirroring the
 * Python entrypoint's "only genuine crashes are errors" philosophy.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const WORKSPACE = "/workspace";
const JEST_BIN = path.join("/opt/sandbox", "node_modules", "jest", "bin", "jest.js");
const JEST_CONFIG = path.join("/opt/sandbox", "jest.config.js");
const TEST_FILE = path.join(WORKSPACE, "submission.test.js");
const OUTPUT_FILE = path.join(WORKSPACE, "output.json");

function main() {
  if (!fs.existsSync(TEST_FILE)) {
    process.stderr.write("No submission.test.js found in /workspace\n");
    return 1;
  }

  const result = spawnSync(
    process.execPath,
    [JEST_BIN, "--config", JEST_CONFIG, "--json", `--outputFile=${OUTPUT_FILE}`, "--runTestsByPath", TEST_FILE],
    { cwd: WORKSPACE, stdio: ["ignore", "pipe", "pipe"], encoding: "utf-8" }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (!fs.existsSync(OUTPUT_FILE)) {
    process.stderr.write("Jest did not produce a report — harness failure\n");
    return 1;
  }
  return 0;
}

process.exit(main());
