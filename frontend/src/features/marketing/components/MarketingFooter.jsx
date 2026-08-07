import { Link } from 'react-router-dom'
// LinkedIn's mark isn't in react-icons' Simple Icons set (v5 dropped it),
// so it comes from Font Awesome instead — same visual weight.
import { SiGithub, SiX } from 'react-icons/si'
import { FaLinkedin } from 'react-icons/fa6'
import { useMarketingLinks } from '../useMarketingLinks'
import logo from '../../../assets/logo.png'

// Only links that resolve. Product links point at real authenticated routes
// (visiting them logged-out lands on /login, which is the correct behaviour).
// `homePath` is threaded through the on-page anchors because the landing page
// answers on two paths — see AppRouter.jsx.
const columns = (homePath) => [
  {
    title: 'Product',
    links: [
      { label: 'Job Simulations', to: '/simulations' },
      { label: 'Skill GPS', to: '/skill-gps' },
      { label: 'AI Mentor', to: '/ai-mentor' },
      { label: 'MIRA Interviews', to: '/mira' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Pricing', to: `${homePath}#pricing` },
      { label: 'Contact', to: '/contact' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'For Institutions',
    links: [
      { label: 'Campus plans', to: `${homePath}#pricing` },
      { label: 'Mentor login', to: '/mentor/login' },
      { label: 'University login', to: '/university/login' },
    ],
  },
]

// Placeholder handles — these accounts don't exist yet.
// TODO(social): point at the real profiles once they're created.
const SOCIALS = [
  { label: 'GitHub', Icon: SiGithub },
  { label: 'LinkedIn', Icon: FaLinkedin },
  { label: 'X', Icon: SiX },
]

export default function MarketingFooter() {
  const { homePath } = useMarketingLinks()
  const COLUMNS = columns(homePath)

  return (
    <footer className="border-t border-border bg-surface-low">
      <div className="max-w-container mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link to={homePath} className="flex items-center gap-2 mb-3">
              <img src={logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-extrabold text-on-surface tracking-tight">WorkLearn</span>
            </Link>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
              Job simulations that let you do the work before you get the job — and prove you did it.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {SOCIALS.map(({ label, Icon }) => (
                <span
                  key={label}
                  title={`${label} — coming soon`}
                  className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-on-surface-variant"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface mb-3">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-on-surface-variant hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-12 pt-6 border-t border-border">
          <p className="text-xs text-on-surface-variant">© 2026 WorkLearn AI. All rights reserved.</p>
          <p className="text-xs text-on-surface-variant">Learn. Practice. Get hired.</p>
        </div>
      </div>
    </footer>
  )
}
