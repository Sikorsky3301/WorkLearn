import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Simulations', to: '/simulations' },
      { label: 'Skill GPS', to: '/skill-gps' },
      { label: 'AI Mentor', to: '/ai-mentor' },
      { label: 'Portfolio', to: '/portfolio' },
      { label: 'Analytics', to: '/analytics' },
    ],
  },
  {
    title: 'MIRA',
    links: [
      { label: 'Overview', to: '/mira' },
      { label: 'Start Mock Interview', to: '/mira/setup' },
      { label: 'How It Works', to: '/mira#mira-how-it-works' },
      { label: 'Practice History', to: '/mira/results' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Community', to: '/community' },
      { label: 'Settings', to: '/settings' },
      { label: 'Interview Tips', href: '#' },
      { label: 'FAQs', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms and Conditions', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-on-surface px-6 sm:px-10 py-10 mt-10">
      <div className="max-w-container mx-auto">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={logo} alt="WorkLearn" className="w-8 h-8 rounded object-cover" />
          <span className="text-white font-bold text-lg">WorkLearn</span>
        </div>
        <p className="text-sm text-white/60 max-w-md leading-relaxed">
          Your AI-managed career learning platform — job simulations, an AI mentor, skill tracking, and MIRA mock interviews, all in one place.
        </p>

        <div className="border-t border-white/10 my-8" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {COLUMNS.map(col => (
            <div key={col.title}>
              <p className="text-white text-sm font-bold mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="text-sm text-white/50 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <span>© 2026 WorkLearn AI. All rights reserved.</span>
          <span>Learn. Practice. Get hired.</span>
        </div>
      </div>
    </footer>
  )
}
