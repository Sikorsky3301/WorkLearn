// Monaco themes for every code surface in the simulations.
//
// `worklearn-light` was defined identically in both FrontendPlayground.jsx and
// JupyterPlayground.jsx — two copies that had already drifted apart in their
// comments and would eventually drift in their colours. One definition now,
// imported by both.
//
// `worklearn-dark` is for the full-screen sandbox workbench, which runs a dark
// editor against a light instructions rail (the split the reference design
// uses). It is the same palette re-grounded, not a different one: the same
// indigo keyword, the same green string, the same amber number, so code looks
// like the same language in both places.

const LIGHT_RULES = [
  { token: 'comment', foreground: '8a8794', fontStyle: 'italic' },
  { token: 'keyword', foreground: '312E81', fontStyle: 'bold' },
  { token: 'string', foreground: '2f7d4f' },
  { token: 'number', foreground: 'b45309' },
  { token: 'identifier', foreground: '1b1b21' },
  { token: 'type', foreground: '4b41e1' },
]

// Lifted for contrast against the dark ground — the light tokens are far too
// dim on navy to read at 13px.
const DARK_RULES = [
  { token: 'comment', foreground: '6b7a99', fontStyle: 'italic' },
  { token: 'keyword', foreground: 'c4b5fd', fontStyle: 'bold' },
  { token: 'string', foreground: '86efac' },
  { token: 'number', foreground: 'fcd34d' },
  { token: 'identifier', foreground: 'e2e8f0' },
  { token: 'type', foreground: '93c5fd' },
  { token: 'tag', foreground: 'f9a8d4' },
  { token: 'attribute.name', foreground: 'c4b5fd' },
  { token: 'attribute.value', foreground: '86efac' },
]

export function defineWorkLearnThemes(monaco) {
  monaco.editor.defineTheme('worklearn-light', {
    base: 'vs',
    inherit: true,
    rules: LIGHT_RULES,
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1b1b21',
      'editor.lineHighlightBackground': '#f6f2fa',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#c8c5d3',
      'editorLineNumber.activeForeground': '#645efb',
      'editorCursor.foreground': '#312E81',
      'editor.selectionBackground': '#e5e1f5',
      'editorIndentGuide.background': '#eae7ef',
      'editorIndentGuide.activeBackground': '#c8c5d3',
      'editorGutter.background': '#fcfbff',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#e5e7eb',
      'scrollbarSlider.background': '#e5e7eb80',
      'scrollbarSlider.hoverBackground': '#c8c5d380',
    },
  })

  monaco.editor.defineTheme('worklearn-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: DARK_RULES,
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1e293b',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#a5b4fc',
      'editorCursor.foreground': '#a5b4fc',
      'editor.selectionBackground': '#334155',
      'editorIndentGuide.background': '#1e293b',
      'editorIndentGuide.activeBackground': '#334155',
      'editorGutter.background': '#0f172a',
      'editorWidget.background': '#1e293b',
      'editorWidget.border': '#334155',
      'scrollbarSlider.background': '#33415580',
      'scrollbarSlider.hoverBackground': '#47556980',
    },
  })
}

/** Back-compat alias — both playgrounds called their local copy this. */
export const defineWorkLearnTheme = defineWorkLearnThemes
