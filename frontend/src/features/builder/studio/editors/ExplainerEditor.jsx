import { Field, TextInput, TextArea, CodeArea, Repeater, Section, Note, LineList } from './Fields'

// The `explainer` block — the two-level reading layer the task page renders.
//
// This had NO EDITOR BEFORE. It exists on every task in the Frontend Developer
// and Junior Data Analyst simulations, it is what the redesigned task page is
// built to display, and the only way to author one was to write Python in
// app/cms_templates/ and run a sync script. A simulation built in the builder
// could not have one, so every simulation built in the builder rendered as a
// bare bullet list next to two that did not.
//
// ── THE AUTHORING CONTRACT ────────────────────────────────────────────────
//
// Every task explains itself TWICE, and the two are not summaries of each
// other:
//
//   plain   written for somebody who has genuinely never done this, in words,
//           assuming no vocabulary that has not been defined on the page.
//   deeper  the sentence a senior would add — the trade-off, the failure mode,
//           the reason it is done this way and not the obvious other way.
//
// A beginner reading only the plain text can finish the task. An experienced
// person reading only the deeper notes still finds something they did not
// know. The prompts under each field below say this, because an author who
// writes `deeper` as a restatement of `plain` produces something that looks
// complete and teaches nothing.

const BLANK_STEP = { title: '', plain: '', code: '', deeper: '' }
const BLANK_CONCEPT = { term: '', plain: '', why: '' }
const BLANK_CONTRACT = { name: '', must: '' }

export default function ExplainerEditor({ explainer, onChange, taskType }) {
  const value = explainer || {}
  const set = (key, v) => onChange({ ...value, [key]: v })

  return (
    <div className="space-y-8">
      <Section
        title="The brief"
        hint="The first two paragraphs a student reads. Everything below is optional; these two are not — without them the task page opens on a bullet list."
      >
        <div className="space-y-4">
          <Field
            label="Situation"
            required
            help="Why this work is happening, in the world of the simulation. Name the company, the mess, and who is waiting. This is the paragraph that makes the rest make sense."
          >
            <TextArea
              rows={5}
              value={value.situation || ''}
              onChange={(e) => set('situation', e.target.value)}
              placeholder="Lumen's order data comes out of three systems that were never designed to agree with each other…"
            />
          </Field>

          <Field
            label="What finished looks like"
            required
            help="The target, stated concretely enough to aim at. A file name, a shape, a number — not “a good analysis”."
          >
            <TextArea
              rows={3}
              value={value.outcome || ''}
              onChange={(e) => set('outcome', e.target.value)}
              placeholder="One cleaned CSV — output.csv — plus a written record of every decision you made to produce it."
            />
          </Field>

          <Field
            label="Before / after preview"
            help="Optional. Fixed-width text showing the transformation — rendered in a monospace block. Powerful for data tasks, pointless for prose ones."
          >
            <CodeArea
              rows={8}
              value={value.preview || ''}
              onChange={(e) => set('preview', e.target.value || null)}
              placeholder={'raw dataset.csv            output.csv\n  5,000 rows        →        ~4,850 rows\n  duplicate ids     →        one row per order'}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Steps"
        hint="The spine of the task page — numbered, in order, and the only section that carries code. Aim for five to eight; more than that is usually two tasks."
      >
        <Repeater
          items={value.steps || []}
          onChange={(v) => set('steps', v)}
          blank={BLANK_STEP}
          addLabel="Add a step"
          itemLabel={(s, i) => `${String(i + 1).padStart(2, '0')} · ${s.title || 'Untitled step'}`}
          empty="No steps yet. These are what a student actually follows — the briefing says what, the steps say how."
          renderItem={(step, i, update) => (
            <>
              <Field label="Step title" help="An instruction, not a topic. “Parse the dates” beats “Dates”.">
                <TextInput
                  value={step.title || ''}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="Parse every date column"
                />
              </Field>
              <Field
                label="Plain explanation"
                help="For someone who has never done this. No undefined jargon. If you use a term, define it in Concepts below."
              >
                <TextArea
                  rows={3}
                  value={step.plain || ''}
                  onChange={(e) => update({ plain: e.target.value })}
                />
              </Field>
              <Field
                label="Code shape"
                help="Optional. Show the SHAPE, never the answer — the student should still have to write the task."
              >
                <CodeArea
                  rows={5}
                  value={step.code || ''}
                  onChange={(e) => update({ code: e.target.value || null })}
                />
              </Field>
              <Field
                label="Why it works this way"
                help="Optional, collapsed on the task page. The trade-off or failure mode — NOT a restatement of the plain text. If it says the same thing twice, leave it empty."
              >
                <TextArea
                  rows={3}
                  value={step.deeper || ''}
                  onChange={(e) => update({ deeper: e.target.value || null })}
                />
              </Field>
            </>
          )}
        />
      </Section>

      <Section
        title="New ideas in this task"
        hint="Terms a student meets here for the first time. Collapsed on the task page under a count, so four good ones beat twelve."
        collapsible
        defaultOpen={(value.concepts || []).length > 0}
      >
        <Repeater
          items={value.concepts || []}
          onChange={(v) => set('concepts', v)}
          blank={BLANK_CONCEPT}
          addLabel="Add a concept"
          itemLabel={(c) => c.term || 'Untitled concept'}
          empty="Nothing listed. Add the terms this task uses that a student would have to look up."
          renderItem={(concept, i, update) => (
            <>
              <Field label="Term">
                <TextInput
                  value={concept.term || ''}
                  onChange={(e) => update({ term: e.target.value })}
                  placeholder="Flagging vs dropping"
                />
              </Field>
              <Field label="What it means" help="One or two sentences, in plain words.">
                <TextArea rows={2} value={concept.plain || ''} onChange={(e) => update({ plain: e.target.value })} />
              </Field>
              <Field label="Why it matters" help="The consequence of getting it wrong.">
                <TextArea rows={2} value={concept.why || ''} onChange={(e) => update({ why: e.target.value })} />
              </Field>
            </>
          )}
        />
      </Section>

      {taskType === 'code_sandbox' && (
        <Section
          title="Exact names the code must use"
          hint="Function names, output keys, column names — the things a grader checks literally."
          collapsible
          defaultOpen={(value.contract || []).length > 0}
        >
          <Note tone="warn">
            This must match the grader exactly. A contract that has drifted from what is actually
            checked is worse than no contract, because it teaches the student to aim at the wrong
            target and they have no way to know.
          </Note>
          <div className="mt-3">
            <Repeater
              items={value.contract || []}
              onChange={(v) => set('contract', v)}
              blank={BLANK_CONTRACT}
              addLabel="Add a required name"
              itemLabel={(c) => c.name || 'Unnamed'}
              empty="Nothing listed. Add every key the grader reads by name."
              renderItem={(item, i, update) => (
                <>
                  <Field label="Name">
                    <TextInput
                      value={item.name || ''}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder="summary.total_revenue"
                      className="font-mono text-[0.8rem]"
                    />
                  </Field>
                  <Field label="What it must be">
                    <TextInput
                      value={item.must || ''}
                      onChange={(e) => update({ must: e.target.value })}
                      placeholder="A number, rounded to 2 decimal places"
                    />
                  </Field>
                </>
              )}
            />
          </div>
        </Section>
      )}

      <Section
        title="Where this usually goes wrong"
        hint="One line per mistake. Written from having seen students make it, not from imagining they might."
        collapsible
        defaultOpen={(value.mistakes || []).length > 0}
      >
        <LineList
          rows={5}
          value={value.mistakes || []}
          onChange={(v) => set('mistakes', v)}
          placeholder={'Dropping rows with a negative quantity — those are returns, not errors.\nRounding before summing instead of after.'}
        />
      </Section>

      <Section
        title="If you want to go further"
        hint="One line per pointer. Shown last, collapsed — nothing here is required reading."
        collapsible
        defaultOpen={(value.further || []).length > 0}
      >
        <LineList
          rows={4}
          value={value.further || []}
          onChange={(v) => set('further', v)}
          placeholder={'pandas merge validation flags catch join mistakes at the point they happen.'}
        />
      </Section>
    </div>
  )
}
