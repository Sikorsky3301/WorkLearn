import { ArrowUpRight, BookMarked, Cpu, Rocket, Library, MessageSquareText, NotebookText } from 'lucide-react'

// Five curated links, not five articles WorkLearn wrote — each card says so
// (an "External guide" tag) rather than implying original content the
// platform doesn't have yet. Every URL is a stable, well-known root or
// canonical docs entry point, not a deep link that can 404 the moment the
// target site reorganizes.
//
// Picked for what the platform's own simulations already ask a student to
// do: run something small and local (llama.cpp, Ollama), work with the
// open-model ecosystem the AI Mentor sits on top of (Hugging Face), write
// prompts that hold up (Prompting Guide), and work in the same notebook
// environment the Data Analyst track assumes (Jupyter).
const RESOURCES = [
  {
    icon: Cpu,
    title: 'Run a model locally on 8GB of RAM',
    description: 'llama.cpp — CPU-friendly inference for quantized open models, built for machines with no GPU to spare.',
    href: 'https://github.com/ggerganov/llama.cpp',
  },
  {
    icon: Rocket,
    title: 'Getting started with Ollama',
    description: 'Pull and run open models with one command — the fastest on-ramp to local inference.',
    href: 'https://ollama.com',
  },
  {
    icon: Library,
    title: 'Hugging Face documentation',
    description: 'Models, datasets and libraries — the reference for most of the open-source AI ecosystem.',
    href: 'https://huggingface.co/docs',
  },
  {
    icon: MessageSquareText,
    title: 'Prompt engineering guide',
    description: 'A community-maintained guide to writing prompts that hold up — the same skill the AI Mentor rewards.',
    href: 'https://www.promptingguide.ai',
  },
  {
    icon: NotebookText,
    title: 'Jupyter notebooks',
    description: 'The standard interactive environment for exploring data in Python — the workflow the Data Analyst sim assumes.',
    href: 'https://jupyter.org',
  },
]

function ResourceCard({ icon: Icon, title, description, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          External guide
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-on-surface transition-colors group-hover:text-primary">
          {title}
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-on-surface-variant transition-colors group-hover:text-primary" />
        </p>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{description}</p>
      </div>
    </a>
  )
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <header className="mb-7 border-b border-border pb-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
          <BookMarked className="h-3 w-3" /> Resources
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Guides worth reading</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          A short list of external guides that pair well with what the simulations ask you to do —
          running models locally, writing prompts that work, and working in the tools the tracks assume.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {RESOURCES.map((r) => (
          <ResourceCard key={r.href} {...r} />
        ))}
      </div>
    </div>
  )
}
