import MarketingNav from './MarketingNav'
import MarketingFooter from './MarketingFooter'

/** Shared chrome for the secondary marketing pages (About / Contact / Blog)
 * — light title band, then content on white. Keeps those three pages to just
 * their own content instead of each re-declaring nav/header/footer. */
export default function MarketingPageShell({ eyebrow, title, intro, children }) {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">
        <div className="border-b border-border bg-surface-low">
          {/* pt clears the fixed pill nav (see MarketingNav). */}
          <div className="max-w-container mx-auto px-6 pt-32 pb-16">
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{eyebrow}</p>
            )}
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface mb-3">{title}</h1>
            {intro && <p className="text-base text-on-surface-variant leading-relaxed max-w-2xl">{intro}</p>}
          </div>
        </div>
        <div className="max-w-container mx-auto px-6 py-16">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  )
}
