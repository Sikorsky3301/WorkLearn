import { PenLine } from 'lucide-react'
import MarketingPageShell from './components/MarketingPageShell'

/** Blog index. There is no CMS or posts table behind this yet, so rather
 * than fabricate article cards that lead nowhere, this states plainly that
 * writing is on the way.
 * TODO(blog): wire to a real posts source and render the index. */
export default function BlogPage() {
  return (
    <MarketingPageShell
      eyebrow="Blog"
      title="Notes on hiring, skills, and doing the work"
      intro="We're putting together writing on what actually moves people from learning to hired."
    >
      <div className="rounded-xl border border-dashed border-border py-16 px-6 text-center max-w-xl mx-auto">
        <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <PenLine className="h-5 w-5" />
        </span>
        <h2 className="text-base font-bold text-on-surface mb-2">Nothing published yet</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
          The first posts are being written. If there's something you'd want us to
          dig into, tell us — we'd rather write what's useful than what's easy.
        </p>
        <a href="mailto:hello@worklearn.ai" className="btn-secondary text-sm px-5 py-2 inline-flex">
          Suggest a topic
        </a>
      </div>
    </MarketingPageShell>
  )
}
