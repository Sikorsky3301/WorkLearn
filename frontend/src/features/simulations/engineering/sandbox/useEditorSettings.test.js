import { describe, it, expect } from 'vitest'
import { monacoOptions, DEFAULT_SETTINGS, FONT_STACKS } from './useEditorSettings'

// monacoOptions is the translation layer between stored preferences and what
// Monaco actually accepts. Monaco silently ignores an option of the wrong
// shape, so a mistake here doesn't throw — the setting just does nothing,
// which is the hardest kind of bug to notice.

describe('monacoOptions', () => {
  it('converts the line-spacing ratio into the px Monaco expects', () => {
    const opts = monacoOptions({ ...DEFAULT_SETTINGS, fontSize: 20, lineHeight: 1.5 })
    expect(opts.lineHeight).toBe(30)
    // A ratio passed straight through would be read as a 1.5px line height.
    expect(opts.lineHeight).toBeGreaterThan(opts.fontSize)
  })

  it('maps booleans onto the shapes Monaco wants, not raw booleans', () => {
    const on = monacoOptions({ ...DEFAULT_SETTINGS, wordWrap: true, minimap: true, lineNumbers: true })
    expect(on.wordWrap).toBe('on')
    expect(on.lineNumbers).toBe('on')
    expect(on.minimap).toEqual({ enabled: true })

    const off = monacoOptions({ ...DEFAULT_SETTINGS, wordWrap: false, minimap: false, lineNumbers: false })
    expect(off.wordWrap).toBe('off')
    expect(off.lineNumbers).toBe('off')
    expect(off.minimap).toEqual({ enabled: false })
  })

  it('resolves the font key to a real stack', () => {
    const opts = monacoOptions({ ...DEFAULT_SETTINGS, fontFamily: 'fira' })
    expect(opts.fontFamily).toBe(FONT_STACKS.fira.value)
    // Every stack must end in a generic family, or an uninstalled first choice
    // falls back to a proportional font and the code stops lining up.
    Object.values(FONT_STACKS).forEach((f) => expect(f.value).toMatch(/monospace$/))
  })

  it('falls back to a monospace stack for an unknown font key', () => {
    // A key stored by an older build, or hand-edited storage.
    const opts = monacoOptions({ ...DEFAULT_SETTINGS, fontFamily: 'nope' })
    expect(opts.fontFamily).toBe(FONT_STACKS.system.value)
  })

  it('drives AI autocomplete from the same setting as the toolbar toggle', () => {
    expect(monacoOptions({ ...DEFAULT_SETTINGS, autocomplete: false }).inlineSuggest)
      .toEqual({ enabled: false })
  })
})
