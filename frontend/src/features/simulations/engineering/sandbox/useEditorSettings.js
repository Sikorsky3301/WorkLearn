import { useCallback, useEffect, useState } from 'react'

// Editor preferences, remembered per browser.
//
// These are exactly the settings people change once and expect to stay changed
// — someone who needs 18px type needs it on every task, and having to set it
// again each time is the kind of small insult that makes an editor feel like a
// toy. Stored under one key as an object so adding a setting later doesn't
// orphan the ones already saved.

const STORAGE_KEY = 'wl-editor-settings'

export const DEFAULT_SETTINGS = {
  theme: 'worklearn-dark',
  fontSize: 13,
  fontFamily: 'jetbrains',
  lineHeight: 1.6,
  tabSize: 2,
  wordWrap: false,
  minimap: false,
  lineNumbers: true,
  bracketPairColorization: true,
  // Kept here rather than as its own piece of state in the page: it belongs
  // with the other editor preferences, and the toolbar toggle and this panel
  // must not disagree about it.
  autocomplete: true,
}

// Stacks, not single families — a stack that ends in `monospace` still gets you
// a monospace font when the first choice isn't installed, which on Windows and
// Linux is most of the time for the fancier ones.
export const FONT_STACKS = {
  jetbrains: {
    label: 'JetBrains Mono',
    value: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  fira: {
    label: 'Fira Code',
    value: "'Fira Code', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  cascadia: {
    label: 'Cascadia Code',
    value: "'Cascadia Code', 'Cascadia Mono', Consolas, ui-monospace, monospace",
  },
  system: {
    label: 'System monospace',
    value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  },
  courier: {
    label: 'Courier New',
    value: "'Courier New', Courier, monospace",
  },
}

export const THEMES = {
  'worklearn-dark': { label: 'WorkLearn Dark' },
  'worklearn-light': { label: 'WorkLearn Light' },
  'vs-dark': { label: 'VS Dark' },
  vs: { label: 'VS Light' },
  'hc-black': { label: 'High Contrast' },
}

export const FONT_SIZE_MIN = 10
export const FONT_SIZE_MAX = 28

function load() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    // Merged over the defaults rather than used as-is: a settings object saved
    // by an older build is missing whatever has been added since, and spreading
    // it straight in would leave those keys undefined and hand Monaco
    // `fontSize: undefined`.
    return stored && typeof stored === 'object' ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useEditorSettings() {
  const [settings, setSettings] = useState(load)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch { /* storage unavailable — preferences just won't persist */ }
  }, [settings])

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  return { settings, update, reset }
}

/** The subset Monaco actually takes, derived from the stored preferences. */
export function monacoOptions(settings) {
  return {
    fontSize: settings.fontSize,
    fontFamily: FONT_STACKS[settings.fontFamily]?.value ?? FONT_STACKS.system.value,
    // Monaco wants a px line height, not a ratio.
    lineHeight: Math.round(settings.fontSize * settings.lineHeight),
    tabSize: settings.tabSize,
    wordWrap: settings.wordWrap ? 'on' : 'off',
    minimap: { enabled: settings.minimap },
    lineNumbers: settings.lineNumbers ? 'on' : 'off',
    bracketPairColorization: { enabled: settings.bracketPairColorization },
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
    automaticLayout: true,
    // Ghost-text suggestions from the AI provider; Tab accepts.
    inlineSuggest: { enabled: settings.autocomplete },
  }
}
