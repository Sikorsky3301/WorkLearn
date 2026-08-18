import { describe, it, expect } from 'vitest'
import { extractErrors, firstErrorLine } from './sandboxOutput'

// The exact stderr a PASSING run produces. Every line of this was being shown
// to the student under a tab labelled "Errors".
const PASSING_RUN = `PASS ./submission.test.js

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.725 s
Ran all test suites within paths "/workspace/submission.test.js".
Test results written to: output.json
`

const SYNTAX_ERROR = `FAIL ./submission.test.js
  ● Test suite failed to run

    SyntaxError: /workspace/submission.jsx: Unexpected token (12:4)

      10 |   return (
    > 12 |     <div>
         |     ^

      at Parser._raise (/opt/sandbox/node_modules/@babel/parser/lib/index.js:1)

Test Suites: 1 failed, 1 total
Tests:       0 total
Ran all test suites within paths "/workspace/submission.test.js".
`

describe('extractErrors', () => {
  it('returns nothing at all for a clean passing run', () => {
    // The whole point: "Errors" should be empty when there are none.
    expect(extractErrors(PASSING_RUN)).toBe('')
  })

  it('keeps the real failure and drops the reporter chrome', () => {
    const out = extractErrors(SYNTAX_ERROR)

    expect(out).toContain('SyntaxError')
    expect(out).toContain('Unexpected token')
    expect(out).toContain('● Test suite failed to run')

    // Summary lines and grader internals are gone.
    expect(out).not.toContain('Test Suites:')
    expect(out).not.toContain('Ran all test suites')
    expect(out).not.toContain('FAIL ./submission.test.js')
    // A stack frame inside jest's own node_modules helps nobody.
    expect(out).not.toContain('@babel/parser')
  })

  it('strips ANSI colour codes', () => {
    expect(extractErrors('[31mBoom[0m')).toBe('Boom')
  })

  it('collapses the blank runs left behind by the removals', () => {
    const out = extractErrors('Real error\n\n\n\nTest Suites: 1 passed\n\n\nAnother line')
    expect(out).toBe('Real error\n\nAnother line')
  })

  it('keeps anything it does not recognise', () => {
    // Hiding a real error costs far more than showing one extra line, so the
    // filter is a denylist and everything unknown survives.
    const out = extractErrors('Cannot find module \'./helpers\' from \'submission.js\'')
    expect(out).toContain('Cannot find module')
  })

  it('handles empty and missing input', () => {
    expect(extractErrors('')).toBe('')
    expect(extractErrors(undefined)).toBe('')
    expect(extractErrors(null)).toBe('')
  })
})

describe('firstErrorLine', () => {
  it('is null when there is no real error', () => {
    expect(firstErrorLine(PASSING_RUN)).toBeNull()
  })

  it('skips stack frames in favour of the message', () => {
    expect(firstErrorLine('    at foo (bar.js:1)\nTypeError: x is not a function'))
      .toBe('TypeError: x is not a function')
  })
})
