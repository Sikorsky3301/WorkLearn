import { useEffect, useRef, useState } from 'react'
import { Scale, Search, Check } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { Field, TextInput, Select, Section, Note, Repeater, TextArea } from './Fields'

// How a submission turns into a score.
//
// ── WHY THE GRADER IS A PICKER NOW ────────────────────────────────────────
//
// It used to be a text box, with a caption explaining that the value "must
// match a key already registered in GRADER_REGISTRY". Nothing checked it. A
// typo saved cleanly, published cleanly, and then failed for the first student
// who pressed Submit — at which point the cost of the author's typo is paid by
// somebody sitting an assessment.
//
// The list below comes from the registry itself (/api/admin/builder-catalog),
// so only keys that exist can be chosen. Each one carries its own description
// and the tasks it is ALREADY grading, because the second-most expensive
// mistake here is pointing a new simulation at a grader written against a
// different dataset: it runs, it returns a number, and the number is nonsense.

function GraderPicker({ value, onChange, graders }) {
  const [query, setQuery] = useState('')
  const listRef = useRef(null)
  const q = query.trim().toLowerCase()
  const matches = graders.filter(
    (g) => !q || g.key.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q)
  )

  const families = [...new Set(matches.map((g) => g.family))]

  // Eighteen graders in a scrolling box, and the one already chosen was
  // usually below the fold — so opening the tab on a wired-up task looked
  // exactly like opening it on an unwired one. Bring the selection into view
  // once, on mount, without stealing the page's scroll position.
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]')
    el?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search graders…"
          className="pl-9"
        />
      </div>

      <div ref={listRef} className="max-h-96 space-y-4 overflow-y-auto rounded-xl border border-border bg-white p-3">
        {families.length === 0 && (
          <p className="py-6 text-center text-[0.78rem] text-outline">No grader matches that.</p>
        )}
        {families.map((family) => (
          <div key={family}>
            <p className="mb-1.5 px-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-outline">
              {family.replace(/_/g, ' ')}
            </p>
            <div className="space-y-1.5">
              {matches.filter((g) => g.family === family).map((g) => {
                const selected = g.key === value
                return (
                  <button
                    key={g.key}
                    type="button"
                    data-selected={selected}
                    onClick={() => onChange(g.key)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-border hover:bg-surface-low'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        selected ? 'border-primary bg-primary text-white' : 'border-outline/40 text-transparent'
                      )}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[0.78rem] font-semibold text-on-surface">
                        {g.key}
                      </span>
                      {g.summary && (
                        <span className="mt-0.5 block text-[0.74rem] leading-snug text-on-surface-variant">
                          {g.summary}
                        </span>
                      )}
                      {g.used_by?.length > 0 && (
                        <span className="mt-1 block text-[0.68rem] text-outline">
                          Already grading{' '}
                          {g.used_by.map((u) => `${u.simulation_title} · ${u.task}`).join(', ')}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const BLANK_RULE = () => ({ id: '', label: '', field: '', op: 'equals', points: 0, expected: '' })

function RulesEditor({ rules, onChange, ops }) {
  const sum = rules.reduce((s, r) => s + (Number(r.points) || 0), 0)
  const opMeta = Object.fromEntries(ops.map((o) => [o.op, o]))

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border px-3 py-2 text-[0.78rem] font-semibold',
          sum === 100
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        )}
      >
        <span>Points allocated</span>
        <span className="tabular-nums">
          {sum} / 100
          {sum !== 100 && <span className="ml-2 font-normal">— publishing is refused until these match</span>}
        </span>
      </div>

      <Repeater
        items={rules}
        onChange={onChange}
        blank={BLANK_RULE}
        addLabel="Add a check"
        itemLabel={(r, i) => `${r.label || `Check ${i + 1}`} · ${r.points || 0} pts`}
        empty="No checks yet. Each one reads a value out of the student's output file and awards points for it."
        renderItem={(rule, i, update) => {
          const meta = opMeta[rule.op] || {}
          return (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="What the student sees"
                  help="Shown beside their score. Write it as the thing being checked, not as a rule id."
                >
                  <TextInput
                    value={rule.label || ''}
                    onChange={(e) => update({ label: e.target.value })}
                    placeholder="Total revenue is correct"
                  />
                </Field>
                <Field label="Points" help="All checks must total 100.">
                  <TextInput
                    type="number" min={0} max={100}
                    value={rule.points ?? 0}
                    onChange={(e) => update({ points: Number(e.target.value) || 0 })}
                  />
                </Field>
              </div>

              <Field
                label="Where to look in the output"
                help={'A dotted path into the file the student wrote. summary.total_revenue reads the total_revenue key inside the summary object.'}
              >
                <TextInput
                  value={rule.field || ''}
                  onChange={(e) => update({ field: e.target.value })}
                  placeholder="summary.total_revenue"
                  className="font-mono text-[0.8rem]"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Test" help={meta.hint}>
                  <Select
                    value={rule.op}
                    onChange={(e) => update({ op: e.target.value })}
                    options={ops.map((o) => ({ value: o.op, label: o.label }))}
                  />
                </Field>

                {['equals', 'tolerance', 'regex'].includes(rule.op) && (
                  <Field label={rule.op === 'regex' ? 'Pattern' : 'Expected value'}>
                    <TextInput
                      value={rule.op === 'regex' ? (rule.pattern ?? '') : (rule.expected ?? '')}
                      onChange={(e) =>
                        update(rule.op === 'regex' ? { pattern: e.target.value } : { expected: e.target.value })
                      }
                      className="font-mono text-[0.8rem]"
                    />
                  </Field>
                )}

                {rule.op === 'tolerance' && (
                  <Field label="Tolerance (%)" help="A percentage band around the expected number.">
                    <TextInput
                      type="number" step="0.01"
                      value={rule.tolerance_pct ?? 0.02}
                      onChange={(e) => update({ tolerance_pct: Number(e.target.value) })}
                    />
                  </Field>
                )}

                {['range', 'row_count_range'].includes(rule.op) && (
                  <>
                    <Field label="Minimum">
                      <TextInput
                        type="number" value={rule.min ?? ''}
                        onChange={(e) => update({ min: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Maximum">
                      <TextInput
                        type="number" value={rule.max ?? ''}
                        onChange={(e) => update({ max: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                    </Field>
                  </>
                )}

                {rule.op === 'row_count_min' && (
                  <Field label="Minimum rows">
                    <TextInput
                      type="number" value={rule.min ?? ''}
                      onChange={(e) => update({ min: e.target.value === '' ? null : Number(e.target.value) })}
                    />
                  </Field>
                )}

                {rule.op === 'array_contains' && (
                  <Field label="Must contain (one per line)">
                    <TextArea
                      rows={3}
                      value={(rule.contains ?? []).join('\n')}
                      onChange={(e) =>
                        update({ contains: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })
                      }
                    />
                  </Field>
                )}
              </div>
            </>
          )
        }}
      />
    </div>
  )
}

export default function GradingEditor({ config, setConfig, catalog }) {
  const strategy = config.grading_strategy || 'declarative_rules'
  const graders = catalog?.graders ?? []
  const ops = catalog?.rule_ops ?? []

  return (
    <div className="space-y-8">
      <Section
        title={<span className="inline-flex items-center gap-2"><Scale className="h-4 w-4" /> How this is scored</span>}
        hint="Two ways to grade, and the choice matters more than it looks: only one of them is safe when students can compare answers."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              key: 'registered_grader',
              title: 'A developer-written grader',
              body: 'Python that reads the output file and scores it against a reference recomputed per candidate. Safe for high-stakes work — two students get different data, so a shared answer is worth nothing.',
            },
            {
              key: 'declarative_rules',
              title: 'Rules you write here',
              body: 'A list of checks against fixed expected values. No code needed, but every candidate is measured against the SAME answers.',
            },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setConfig('grading_strategy', option.key)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors cursor-pointer',
                strategy === option.key
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-white hover:border-on-surface/25'
              )}
            >
              <p className="font-display text-[0.9rem] font-extrabold text-on-surface">{option.title}</p>
              <p className="mt-1.5 text-[0.76rem] leading-relaxed text-on-surface-variant">{option.body}</p>
            </button>
          ))}
        </div>
      </Section>

      {strategy === 'registered_grader' ? (
        <Section
          title="Which grader"
          hint="Only graders that actually exist are listed. Each says what it reads and what it is already grading."
        >
          {graders.length === 0 ? (
            <Note tone="warn">
              The grader list could not be loaded, so this cannot be set safely right now. Reload the
              page rather than typing a key — an unregistered key fails for every student at submit.
            </Note>
          ) : (
            <GraderPicker
              value={config.grader_key || ''}
              onChange={(key) => setConfig('grader_key', key)}
              graders={graders}
            />
          )}
        </Section>
      ) : (
        <Section
          title="The checks"
          hint="Each one reads a value out of the student's output file and awards points. Together they must total 100."
        >
          <Note tone="warn">
            Rule-graded tasks compare every candidate against the same fixed values. That is fine for
            practice; it is not safe for anything that counts, because one student who solves it can
            hand the answers to everyone.
          </Note>
          <div className="mt-4">
            <RulesEditor
              rules={config.rules ?? []}
              onChange={(rules) => setConfig('rules', rules)}
              ops={ops}
            />
          </div>
        </Section>
      )}
    </div>
  )
}
