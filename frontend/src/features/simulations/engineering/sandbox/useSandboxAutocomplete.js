import { useEffect, useRef } from 'react'
import { api } from '../../../../lib/client'

// AI ghost-text autocomplete for the sandbox editor.
//
// Uses Monaco's inline-completions API, which is the same mechanism Copilot
// uses: the suggestion renders as dimmed text ahead of the cursor and Tab
// accepts it. Nothing is inserted until the student presses Tab.
//
// Three things keep this from becoming a request firehose:
//   - a debounce, so it only fires once typing pauses;
//   - Monaco's cancellation token, checked after the await, so a suggestion
//     for an already-abandoned cursor position is dropped rather than shown;
//   - a hard skip when the line is blank, where a suggestion is nearly always
//     noise.
//
// Failures are swallowed to an empty result on purpose. This runs constantly
// while typing, so a network blip must be invisible — never an error the
// student has to dismiss mid-thought.

const DEBOUNCE_MS = 450

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * @param enabled    students can switch this off; a graded exercise where the
 *                   editor volunteers answers is not always what you want
 * @param onMount    pass to <Editor onMount={...}> — needs (editor, monaco)
 */
export function useSandboxAutocomplete({ enabled, slug, taskIndex, language }) {
  // Read through refs so the registered provider always sees current values
  // without having to be torn down and re-registered on every keystroke.
  const cfg = useRef({ enabled, slug, taskIndex, language })
  cfg.current = { enabled, slug, taskIndex, language }

  const monacoRef = useRef(null)
  const disposableRef = useRef(null)
  const seqRef = useRef(0)

  useEffect(() => () => disposableRef.current?.dispose(), [])

  const register = (editor, monaco) => {
    monacoRef.current = monaco
    disposableRef.current?.dispose()

    disposableRef.current = monaco.languages.registerInlineCompletionsProvider(
      { pattern: '**' },
      {
        provideInlineCompletions: async (model, position, _context, token) => {
          const { enabled: on, slug: s, taskIndex: t, language: lang } = cfg.current
          if (!on || !s || t == null) return { items: [] }

          const line = model.getLineContent(position.lineNumber)
          // Mid-word: let Monaco's own word suggestions handle it.
          if (!line.slice(0, position.column - 1).trim()) return { items: [] }

          const seq = ++seqRef.current
          await sleep(DEBOUNCE_MS)
          // Superseded by a newer keystroke, or Monaco gave up on us.
          if (seq !== seqRef.current || token.isCancellationRequested) return { items: [] }

          const full = model.getValue()
          const offset = model.getOffsetAt(position)

          let completion = ''
          try {
            const res = await api.post('/api/sandbox-ai/complete', {
              simulation_slug: s,
              task_index: t,
              language: lang,
              prefix: full.slice(0, offset),
              suffix: full.slice(offset),
            })
            completion = res?.completion ?? ''
          } catch {
            return { items: [] }
          }

          if (!completion.trim() || token.isCancellationRequested || seq !== seqRef.current) {
            return { items: [] }
          }

          return {
            items: [{
              insertText: completion,
              range: new monaco.Range(
                position.lineNumber, position.column,
                position.lineNumber, position.column,
              ),
            }],
          }
        },
        freeInlineCompletions: () => {},
      },
    )
  }

  return register
}
