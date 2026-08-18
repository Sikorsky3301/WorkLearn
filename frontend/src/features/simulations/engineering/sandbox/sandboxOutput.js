// Turning a Jest run's stderr into something worth showing a student.
//
// Jest writes its ENTIRE reporter output to stderr, including on a completely
// successful run. So the Errors tab was showing this after four passing tests:
//
//     PASS ./submission.test.js
//     Test Suites: 1 passed, 1 total
//     Tests:       4 passed, 4 total
//     Snapshots:   0 total
//     Time:        1.725 s
//     Ran all test suites within paths "/workspace/submission.test.js".
//     Test results written to: output.json
//
// Not one line of that is an error, and three of them (the paths, the report
// filename) are grader internals a student has no use for. Meanwhile the thing
// they actually need when something breaks — the stack trace, the "Cannot find
// module", the syntax error — is buried in the same block.
//
// So: strip the reporter's own chrome and keep everything else. Anything
// unrecognised survives, because the cost of hiding a real error is far higher
// than the cost of showing one extra line of noise.

// eslint-disable-next-line no-control-regex
const ANSI = /\[[0-9;]*m/g

const NOISE = [
  /^\s*(PASS|FAIL)\s+\S+/,              // suite header — the Tests tab covers this
  /^\s*Test Suites:/,
  /^\s*Tests:\s/,
  /^\s*Snapshots:/,
  /^\s*Time:\s/,
  /^\s*Ran all test suites/,
  /^\s*Test results written to:/,
  /^\s*[✓✔✕✗×○·]\s/,                    // per-test result lines
  /^\s*at Object\.<anonymous>\s+\(\/opt\/sandbox/,  // frames inside the harness
  /^\s*at .*node_modules[\\/]/,          // frames inside jest itself
]

const isNoise = (line) => NOISE.some((re) => re.test(line))

/**
 * The part of stderr a student should see. Empty string when there is nothing
 * but reporter output — which is the normal case for a passing run.
 */
export function extractErrors(stderr) {
  if (!stderr) return ''

  const kept = stderr
    .replace(ANSI, '')
    .split('\n')
    .filter((line) => !isNoise(line))

  // Collapse the runs of blank lines the removals leave behind, and trim the
  // ends, so a two-line error doesn't arrive wrapped in twenty blanks.
  const out = []
  for (const line of kept) {
    if (!line.trim() && !out.at(-1)?.trim()) continue
    out.push(line)
  }
  while (out.length && !out[0].trim()) out.shift()
  while (out.length && !out.at(-1).trim()) out.pop()

  return out.join('\n')
}

/**
 * A one-line summary of what went wrong, for the tab badge and the empty
 * state. Picks the first line that looks like a real failure.
 */
export function firstErrorLine(stderr) {
  const cleaned = extractErrors(stderr)
  if (!cleaned) return null
  const line = cleaned
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('at '))
  return line || null
}
