import { Terminal, FileInput, FileOutput, Database } from 'lucide-react'
import { Field, TextInput, CodeArea, Select, Section, Note, Toggle } from './Fields'

// What the student's machine looks like: the language, the two filenames that
// are the whole contract between their code and the grader, the dataset they
// are handed, and the code they open on.
//
// ── THE TWO FILENAMES ARE THE WHOLE CONTRACT ──────────────────────────────
//
// `output_filename` is the file the grader reads back. Get it wrong and every
// submission scores zero with no useful message, because nothing is broken —
// the grader simply looks for a file that was never written.
//
// `input_filename` means TWO DIFFERENT THINGS depending on the task, which is
// worth knowing before editing it:
//
//   with a dataset_key   it names the DATA file mounted into the workspace
//                        (dataset.csv). The student's own code is always saved
//                        as submission.py.
//   without one          it names the student's own file (submission.html,
//                        submission.jsx).
//
// The help text below switches on that, because getting it backwards is what
// made the builder's preview report "No submission.py found in /workspace".
//
// ── use_raw_dataset ───────────────────────────────────────────────────────
//
// The one setting here with a genuinely surprising effect, and the one that
// was silently deleted on every save until the schema was fixed (see the note
// on CodeSandboxConfig in app/schemas/cms.py). By default a task in a chain is
// handed the artifact the PREVIOUS task produced — which is right for "now
// build on your cleaned file" and catastrophically wrong for "count what was
// broken in the original", where every honest answer becomes zero.

const CHAIN_HINT =
  'By default this task receives the file the previous task produced, so a chain of tasks builds on itself.'

export default function SandboxEditor({ config, setConfig, catalog }) {
  const languages = catalog?.languages ?? []
  const datasets = catalog?.datasets ?? []
  const textOnly = config.submission_mode === 'text'
  const language = languages.find((l) => l.key === (config.language || 'python'))

  return (
    <div className="space-y-8">
      <Section
        title="The environment"
        hint="Every run happens in a throwaway container with no network access. Nothing a student writes can reach the internet, and nothing persists between runs except the file they produce."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Language" help={language?.hint}>
            <Select
              value={config.language || 'python'}
              onChange={(e) => setConfig('language', e.target.value)}
              options={languages.map((l) => ({ value: l.key, label: l.label }))}
            />
          </Field>

          <Field
            label="What the student submits"
            help={
              textOnly
                ? 'A written answer. Nothing is executed — pair this with an LLM-judged grader.'
                : 'Code, executed in the container.'
            }
          >
            <Select
              value={config.submission_mode || 'code'}
              onChange={(e) => setConfig('submission_mode', e.target.value)}
              options={[
                { value: 'code', label: 'Code — run in a container' },
                { value: 'text', label: 'Text — not executed' },
              ]}
            />
          </Field>
        </div>

        {language && language.runnable === false && !textOnly && (
          <div className="mt-3">
            <Note tone="warn">
              Plain text is not executed. Either switch the submission mode to Text, or pick a
              language that runs — otherwise the grader has no output file to read.
            </Note>
          </div>
        )}
      </Section>

      <Section
        title="The two filenames"
        hint="These are the contract between the student's code and the grader. Nothing else connects them."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={<span className="inline-flex items-center gap-1.5"><FileInput className="h-3.5 w-3.5" /> Input filename</span>}
            required={!textOnly}
            help={
              config.dataset_key
                ? 'On a dataset-backed task this names the DATA file mounted into the workspace — the file the student reads. Their own code is always saved as submission.py.'
                : 'What the student’s file is called inside the container — submission.html, submission.jsx, submission.py.'
            }
          >
            <TextInput
              value={config.input_filename || ''}
              onChange={(e) => setConfig('input_filename', e.target.value)}
              placeholder="dataset.csv"
              disabled={textOnly}
              className="font-mono text-[0.82rem] disabled:opacity-50"
            />
          </Field>

          <Field
            label={<span className="inline-flex items-center gap-1.5"><FileOutput className="h-3.5 w-3.5" /> Output filename</span>}
            required
            help="The file the grader reads back. If the student's code does not write exactly this name, they score zero and nothing explains why."
          >
            <TextInput
              value={config.output_filename || ''}
              onChange={(e) => setConfig('output_filename', e.target.value)}
              placeholder="output.json"
              className="font-mono text-[0.82rem]"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Note>
            Say both filenames in the briefing and in the explainer's contract. A student who guesses
            the output name is not being tested on the task.
          </Note>
        </div>
      </Section>

      <Section
        title={<span className="inline-flex items-center gap-2"><Database className="h-4 w-4" /> The data</span>}
        hint="Dataset-backed tasks generate a different file per candidate from a seed, so two students comparing answers get different numbers. This is the platform's strongest anti-cheating control."
      >
        <div className="space-y-4">
          <Field
            label="Dataset"
            help={
              datasets.length
                ? 'Generated per candidate at run time, with the reference answer recomputed server-side from the same seed.'
                : 'No dataset generators are registered yet. Tasks without one receive only the files listed below.'
            }
          >
            <Select
              value={config.dataset_key || ''}
              onChange={(e) => setConfig('dataset_key', e.target.value || null)}
              options={[
                { value: '', label: 'None — no generated dataset' },
                ...datasets.map((d) => ({ value: d.key, label: d.key })),
              ]}
            />
          </Field>

          {config.dataset_key && (
            <Toggle
              checked={!!config.use_raw_dataset}
              onChange={(v) => setConfig('use_raw_dataset', v)}
              label="Hand this task the ORIGINAL dataset"
              help={
                config.use_raw_dataset
                  ? 'On: this task always receives the freshly generated file. Use it for anything that measures what was wrong with the raw extract — profiling, quality counts, duplicate detection.'
                  : `Off: ${CHAIN_HINT} Turn this on only if the task must see the original.`
              }
            />
          )}

          {config.use_raw_dataset && (
            <Note tone="warn">
              With this on, the task never sees the student's earlier work. That is correct for a
              quality report and wrong for anything that builds on a cleaned file — a task that
              should have chained will quietly grade against the wrong input.
            </Note>
          )}
        </div>
      </Section>

      {!textOnly && (
        <Section
          title={<span className="inline-flex items-center gap-2"><Terminal className="h-4 w-4" /> Starter code</span>}
          hint="What the editor opens on. Give the imports, the file reads and writes, and a comment where the work begins — never the answer."
        >
          <CodeArea
            rows={16}
            value={config.starter_code || ''}
            onChange={(e) => setConfig('starter_code', e.target.value)}
            placeholder={'import pandas as pd\n\ndf = pd.read_csv("dataset.csv")\n\n# Your work starts here.\n\ndf.to_csv("output.csv", index=False)'}
          />
          <div className="mt-3">
            <Note>
              An empty editor is the most common reason a student never starts. The starter should
              already read the input and write the output, so the only thing missing is the thinking.
            </Note>
          </div>
        </Section>
      )}
    </div>
  )
}
