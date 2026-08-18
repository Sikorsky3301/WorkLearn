import { describe, it, expect } from 'vitest'
import { maxForPane } from './SplitHandle'

// The rule that stops either divider being dragged until its neighbour
// disappears.
//
// Tested as arithmetic rather than through a layout engine: the failure it
// prevents (drag the brief wide enough and the editor slides off the right
// edge; drag the console up far enough and there's nothing left to type in) is
// invisible in a unit test but obvious the moment the numbers are wrong.

// Mirrors the constants in SandboxWorkbenchPage.
const MIN_EDITOR_WIDTH_FLOOR = 420
const MIN_EDITOR_HEIGHT = 180
const RAIL_MIN = 280
const CONSOLE_MIN = 44
const TOOLBAR_CHROME = 150

/** Mirrors `minEditorWidth` — the floor, or whatever the toolbar needs. */
const minEditorWidth = (toolbarWidth) => Math.max(
  MIN_EDITOR_WIDTH_FLOOR,
  toolbarWidth ? toolbarWidth + TOOLBAR_CHROME : 0,
)

const railMax = (width, toolbarWidth = 0) => maxForPane({
  available: width, minSibling: minEditorWidth(toolbarWidth), minSelf: RAIL_MIN, fallback: 760,
})
const consoleMax = (height) => maxForPane({
  available: height, minSibling: MIN_EDITOR_HEIGHT, minSelf: CONSOLE_MIN, fallback: 640,
})

describe('rail width ceiling', () => {
  it('always leaves the editor its minimum width', () => {
    for (const width of [1024, 1280, 1440, 1920, 2560]) {
      expect(width - railMax(width)).toBeGreaterThanOrEqual(MIN_EDITOR_WIDTH_FLOOR)
    }
  })

  it('leaves room for the whole toolbar, not just for code', () => {
    // The reported bug: at a 420px floor the brief could be dragged until the
    // toolbar was sliced in half, taking Run code and Submit answer with it.
    // ~800px of buttons is what this toolbar actually measures.
    const TOOLBAR = 800
    for (const width of [1440, 1920, 2560]) {
      const editor = width - railMax(width, TOOLBAR)
      expect(editor).toBeGreaterThanOrEqual(TOOLBAR + TOOLBAR_CHROME)
    }
  })

  it('tightens the rail further as the toolbar grows', () => {
    // Adding a button must move the limit on its own.
    expect(railMax(1920, 900)).toBeLessThan(railMax(1920, 700))
  })

  it('uses the floor until the toolbar has been measured', () => {
    expect(minEditorWidth(0)).toBe(MIN_EDITOR_WIDTH_FLOOR)
    // …and never drops below it, however small the toolbar measures.
    expect(minEditorWidth(10)).toBe(MIN_EDITOR_WIDTH_FLOOR)
  })

  it('never returns a maximum below the rail minimum', () => {
    // On a very narrow container the two constraints conflict; the rail's own
    // minimum wins and `overflow-hidden` clips, rather than a negative maximum
    // inverting the clamp.
    expect(railMax(500)).toBe(RAIL_MIN)
    expect(railMax(300)).toBe(RAIL_MIN)
  })

  it('falls back to a fixed ceiling before the container has been measured', () => {
    expect(railMax(0)).toBe(760)
  })

  it('tightens as the window shrinks', () => {
    expect(railMax(1920)).toBeGreaterThan(railMax(1280))
  })
})

describe('console height ceiling', () => {
  it('always leaves the editor its minimum height', () => {
    // 600 is a laptop with browser chrome; 400 is a short split-screen window.
    for (const height of [400, 600, 800, 1080]) {
      expect(height - consoleMax(height)).toBeGreaterThanOrEqual(MIN_EDITOR_HEIGHT)
    }
  })

  it('never returns a maximum below the collapsed console', () => {
    expect(consoleMax(200)).toBe(CONSOLE_MIN)
    expect(consoleMax(100)).toBe(CONSOLE_MIN)
  })

  it('falls back before measurement, and tightens on a shorter window', () => {
    expect(consoleMax(0)).toBe(640)
    expect(consoleMax(1080)).toBeGreaterThan(consoleMax(600))
  })
})

describe('maxForPane', () => {
  it('never returns a negative maximum', () => {
    // A negative max would make the clamp min>max and pin the divider to the
    // wrong edge — the pane would jump instead of stopping.
    expect(maxForPane({ available: 10, minSibling: 999, minSelf: 44, fallback: 100 }))
      .toBeGreaterThan(0)
  })
})
