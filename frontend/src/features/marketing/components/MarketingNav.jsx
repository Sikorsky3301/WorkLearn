import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { useMarketingLinks } from '../useMarketingLinks'
import logo from '../../../assets/logo.png'

// Pricing is an on-page section rather than its own route, so it's an anchor
// from anywhere else on the site. Every item here resolves to something real.
// `homePath` is threaded through because the landing page answers on two
// paths — see AppRouter.jsx.
const navItems = (homePath) => [
  { label: 'About Us', to: '/about' },
  { label: 'Pricing', to: `${homePath}#pricing` },
  { label: 'Contact', to: '/contact' },
  { label: 'Blog', to: '/blog' },
]

/** Floating pill ("bean") nav for the marketing pages — detached from the
 * page edges, capsule-shaped, and it tightens/solidifies once you scroll off
 * the hero. Deliberately separate from components/Navbar.jsx, which is the
 * signed-in app nav and hard-depends on useAuth/useSimulations — none of
 * which resolve for a logged-out visitor. */
export default function MarketingNav() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // A signed-in visitor can reach the marketing site via /home (the app
  // Navbar's logo points there), so the CTAs have to switch — offering
  // "Log in" to someone already logged in is a dead end.
  const { signedIn, homePath, startPath, startLabel } = useMarketingLinks()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pointer-events-none">
      <header
        className={cn(
          'pointer-events-auto w-full max-w-4xl transition-all duration-300 ease-out',
          scrolled ? 'mt-2' : 'mt-4'
        )}
      >
        <nav
          className={cn(
            'flex items-center gap-6 rounded-full border transition-all duration-300 ease-out',
            scrolled
              ? 'bg-white/90 border-border shadow-lg backdrop-blur-xl px-4 py-2'
              : 'bg-white/70 border-white/40 shadow-md backdrop-blur-md px-5 py-2.5'
          )}
        >
          <Link to={homePath} className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-extrabold text-on-surface tracking-tight text-sm">WorkLearn</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 mx-auto">
            {navItems(homePath).map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm font-medium text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-full hover:bg-surface-container transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {signedIn ? (
              <button
                onClick={() => navigate(startPath)}
                className="bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-full px-4 py-1.5 transition-colors cursor-pointer active:scale-[0.98]"
              >
                {startLabel}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold text-on-surface hover:text-primary px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-full px-4 py-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                >
                  Get started
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="md:hidden ml-auto p-1.5 text-on-surface cursor-pointer"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile sheet — a rounded card under the pill, same floating language */}
        {open && (
          <div className="md:hidden mt-2 rounded-2xl border border-border bg-white/95 backdrop-blur-xl shadow-lg p-4 space-y-1">
            {navItems(homePath).map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block text-sm font-medium text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-border flex gap-2">
              {signedIn ? (
                <button
                  onClick={() => navigate(startPath)}
                  className="flex-1 bg-primary text-white text-sm font-bold rounded-full py-2 cursor-pointer"
                >
                  {startLabel}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 text-sm font-semibold text-on-surface border border-border rounded-full py-2 cursor-pointer"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 bg-primary text-white text-sm font-bold rounded-full py-2 cursor-pointer"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
