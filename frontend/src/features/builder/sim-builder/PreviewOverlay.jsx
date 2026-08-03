import { X } from 'lucide-react'
import { blockTypeRegistry } from './blockTypeRegistry'

/** Toolbar "Preview" — a full-screen, read-only walkthrough of the whole
 * Weeks -> Pages -> Blocks tree using each block's static Preview renderer.
 * Admin-only, no persistence side effects — same spirit as the job-sim
 * builder's InteractiveSimPreview, but not a live/gradable runtime (AI Chat
 * and Coding Challenge blocks show their static preview here too). */
export default function PreviewOverlay({ project, onClose }) {
  const pages = project?.pages ?? []

  return (
    <div className="fixed inset-0 z-50 bg-surface-low flex flex-col">
      <header className="shrink-0 bg-white border-b border-border">
        <div className="max-w-container mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={onClose} className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium cursor-pointer">
            <X className="h-4 w-4" /> Close preview
          </button>
          <div className="h-6 w-px bg-border" />
          <p className="text-sm font-bold text-on-surface truncate">{project.title}</p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10 space-y-16">
          {pages.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-16">This project has no pages yet.</p>
          ) : (
            pages.map((page) => (
              <section key={page.id}>
                {page.week != null && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Week {page.week}</p>
                )}
                <h2 className="text-xl font-bold text-on-surface mb-6">{page.title}</h2>
                <div className="space-y-4">
                  {page.blocks.map((block) => {
                    const Preview = blockTypeRegistry[block.block_type]?.Preview
                    return Preview ? <div key={block.id}><Preview config={block.config} /></div> : null
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
