import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logo from '../../../assets/logo.png'

// Pricing is an on-page section rather than its own route, so it's an anchor
// from anywhere else on the site. Every item here resolves to something real.
const NAV_ITEMS = [
  { label: 'About Us', to: '/about' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Contact', to: '/contact' },
  { label: 'Blog', to: '/blog' },
]

/** Public top nav for the marketing pages. Deliberately separate from
 * components/Navbar.jsx, which is the signed-in app nav and hard-depends on
 * useAuth/useSimulations/useMyAssignments — none of which resolve for a
 * logged-out visitor. */
export default function MarketingNav() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-border">
      <nav className="max-w-container mx-auto px-6 h-16 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-extrabold text-on-surface tracking-tight">WorkLearn</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0 ml-auto">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer"
          >
            Log in
          </button>
          <button onClick={() => navigate('/login')} className="btn-primary text-sm px-4 py-2 cursor-pointer">
            Get started
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="md:hidden ml-auto p-2 -mr-2 text-on-surface cursor-pointer"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-white px-6 py-4 space-y-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-on-surface-variant hover:text-on-surface"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border flex gap-3">
            <button onClick={() => navigate('/login')} className="btn-secondary text-sm px-4 py-2 flex-1 cursor-pointer">
              Log in
            </button>
            <button onClick={() => navigate('/login')} className="btn-primary text-sm px-4 py-2 flex-1 cursor-pointer">
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
