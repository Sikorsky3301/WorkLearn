import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  User, GraduationCap, SlidersHorizontal, CreditCard, Receipt, Globe, LifeBuoy, LogOut,
} from 'lucide-react'
import logo from '../assets/logo.png'
import { useAuth } from '../features/auth/AuthContext'
import { useSimulations, useMyAssignments } from '../hooks'
import { resolveDomainIcon } from '../lib/domainIcons'
import { domainDescription } from '../lib/domainMeta'
import { resolveMediaUrl } from '../lib/client'

// Real, working destinations today. `to` is a route; `href` is used instead
// for the one item (Help & Support) that isn't a page in this app.
const PROFILE_MENU_ITEMS = [
  { label: 'Profile', icon: User, to: '/portfolio' },
  { label: 'My Learning', icon: GraduationCap, to: '/simulations?filter=enrolled' },
  { label: 'Account Settings', icon: SlidersHorizontal, to: '/settings' },
]

// Requested, but there's no billing/i18n system behind any of these yet
// (no payment provider is wired up anywhere in the app — see the
// SuperAdmin Configuration Center's own "not yet wired" notices — and there
// is no i18n/translation layer at all). Shown disabled with a "Soon" tag,
// same honest-preview treatment as the Navbar's future-domain entries,
// rather than linking somewhere that doesn't exist or faking the feature.
const PROFILE_MENU_SOON = [
  { label: 'Payment Methods', icon: CreditCard },
  { label: 'Purchase History', icon: Receipt },
  { label: 'Language', icon: Globe, note: 'English (US)' },
]

// Not tied to any real simulation yet — shown as muted "Coming soon" entries
// in the domain menu so it previews where the platform is headed without
// pretending there's content behind them. Mirrors the AI Mentor's existing
// persona domains (backend's app/ai/services/mentor_personas.py), so a
// future simulation in one of these areas slots into a concept that already
// exists elsewhere in the product rather than introducing a new one.
const FUTURE_DOMAINS = [
  'Product Management',
  'Marketing',
  'Customer Support',
  'Finance',
  'HR & Recruiting',
  'Healthcare Administration',
]

export default function Navbar() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, logout } = useAuth()
  const { data: simsData }        = useSimulations()
  const { data: assignmentsData } = useMyAssignments()
  const simulations = simsData?.simulations || []
  const assignments = assignmentsData?.assignments || []

  // Domains actually in use across published simulations — same source
  // SimulationWorkspace's DomainFilterBar reads, so a new CMS-authored
  // domain shows up here automatically.
  const domains = useMemo(() => {
    const set = new Set()
    for (const sim of simulations) {
      if (sim.domain) set.add(sim.domain)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [simulations])

  const futureDomains = useMemo(
    () => FUTURE_DOMAINS.filter((d) => !domains.includes(d)),
    [domains]
  )

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const [profileOpen, setProfileOpen] = useState(false)
  const [simOpen,     setSimOpen]     = useState(false)

  const profileRef        = useRef(null)
  const simCloseTimer      = useRef(null)
  const profileCloseTimer  = useRef(null)

  const xp      = user?.xp ?? 0
  const level   = Math.floor(xp / 500) + 1
  const xpInLvl = xp % 500
  const xpPct   = Math.round((xpInLvl / 500) * 100)

  const isSimActive = location.pathname.startsWith('/simulations')

  // Profile dropdown: close on outside click
  useEffect(() => {
    function handle(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Sim dropdown: delayed close to bridge the gap between trigger and panel
  const openSim  = useCallback(() => {
    clearTimeout(simCloseTimer.current)
    setSimOpen(true)
  }, [])

  const closeSim = useCallback(() => {
    simCloseTimer.current = setTimeout(() => setSimOpen(false), 80)
  }, [])

  // Profile dropdown: same hover-with-bridge-delay pattern as the
  // Simulations menu, layered on top of the existing click-toggle/
  // outside-click-close behavior (both still work).
  const openProfile  = useCallback(() => {
    clearTimeout(profileCloseTimer.current)
    setProfileOpen(true)
  }, [])

  const closeProfile = useCallback(() => {
    profileCloseTimer.current = setTimeout(() => setProfileOpen(false), 80)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLink = ({ isActive }) =>
    `px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'text-primary font-semibold bg-surface-low'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-low'
    }`

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      {/* XP progress strip */}
      <div className="h-0.5 bg-surface-high w-full">
        <div className="h-full bg-primary transition-all" style={{ width: `${xpPct}%` }} />
      </div>

      {/* Full-bleed — unlike the page content below (which stays capped at
          max-w-container), the header itself spans the entire viewport so
          the nav links sit flush against the left edge and the XP/avatar
          cluster sits flush against the right edge, instead of both being
          stranded inside a centered 1280px column with dead space on either
          side on wide screens. */}
      <div className="w-full px-6 flex items-center gap-1" style={{ height: 52 }}>

        {/* Logo */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 shrink-0 mr-4">
          <img src={logo} alt="WorkLearn" className="w-8 h-8 rounded object-cover" />
          <span className="font-bold text-on-surface text-sm tracking-tight">WorkLearn</span>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          <NavLink to="/dashboard" className={navLink}>Dashboard</NavLink>

          {/* Simulations hover dropdown */}
          <div
            className="relative"
            onMouseEnter={openSim}
            onMouseLeave={closeSim}
          >
            <button
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                isSimActive
                  ? 'text-primary font-semibold bg-surface-low'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-low'
              }`}
              onClick={() => { navigate('/simulations'); setSimOpen(false) }}
            >
              Simulations
              <svg
                width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className={`transition-transform duration-150 ${simOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Invisible bridge: fills the gap so mouse doesn't leave the hover zone */}
            {simOpen && <div className="absolute left-0 top-full h-2 w-full" />}

            {simOpen && (
              <div
                className="absolute left-0 top-full pt-2 w-[640px] z-50"
                onMouseEnter={openSim}
                onMouseLeave={closeSim}
              >
                <div className="bg-white border border-border rounded-xl shadow-xl overflow-hidden">
                  <div className="grid grid-cols-3 gap-x-6 p-5">

                    {/* Domains, not individual simulations — clicking one goes
                        to the browse page pre-filtered to it (each card
                        there is tagged with its domain, same treatment as
                        the Dashboard's JobSimulationsSection). */}
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                        Job Simulations by Domain
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {domains.map((domain) => {
                          const Icon = resolveDomainIcon(domain)
                          return (
                            <button
                              key={domain}
                              onClick={() => { navigate(`/simulations?domain=${encodeURIComponent(domain)}`); setSimOpen(false) }}
                              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-low transition-colors text-left group"
                            >
                              <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                                  {domain}
                                </p>
                                <p className="text-xs text-on-surface-variant leading-snug">
                                  {domainDescription(domain)}
                                </p>
                              </div>
                            </button>
                          )
                        })}

                        {futureDomains.map((domain) => {
                          const Icon = resolveDomainIcon(domain)
                          return (
                            <div key={domain} className="flex items-start gap-3 p-2.5 rounded-lg opacity-50 cursor-default">
                              <Icon className="h-5 w-5 text-on-surface-variant shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                                  {domain}
                                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-surface-high text-on-surface-variant">
                                    Soon
                                  </span>
                                </p>
                                <p className="text-xs text-on-surface-variant leading-snug">
                                  {domainDescription(domain)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Simulations the student is already enrolled in */}
                    <div className="col-span-1 border-l border-border pl-5">
                      <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                        Enrolled
                      </p>
                      {assignments.length === 0 ? (
                        <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                          You haven't enrolled in a simulation yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {assignments.map((a) => (
                            <button
                              key={a.simulation_id}
                              onClick={() => { navigate(`/simulations/${a.simulation_id}/overview`); setSimOpen(false) }}
                              className="w-full text-left group"
                            >
                              <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                                {a.simulation_title}
                              </p>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">
                                {a.completed_count}/{a.total_tasks} tasks done
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => { navigate('/simulations'); setSimOpen(false) }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-primary bg-surface-low hover:bg-surface-container transition-colors border-t border-border"
                  >
                    View all simulations
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/skill-gps" className={navLink}>Skill GPS</NavLink>
          <NavLink to="/ai-mentor" className={navLink}>AI Mentor</NavLink>
          <NavLink to="/mira" className={navLink}>MIRA</NavLink>
          <NavLink to="/analytics" className={navLink}>Analytics</NavLink>
          <NavLink to="/portfolio" className={navLink}>Portfolio</NavLink>
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2.5">

          {/* XP badge */}
          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-1.5 bg-surface-low border border-border rounded-full px-2.5 py-1 hover:border-primary transition-colors"
          >
            <span className="text-xs font-bold text-primary">Lv.{level}</span>
            <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="text-xs text-on-surface-variant">{xp.toLocaleString()} XP</span>
          </button>

          {/* Avatar + profile dropdown — opens on hover (with a bridge
              delay, same pattern as the Simulations menu) or on click;
              closes on outside click, mouse-leave, or Escape. */}
          <div
            className="relative"
            ref={profileRef}
            onMouseEnter={openProfile}
            onMouseLeave={closeProfile}
          >
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all ring-offset-2 ${
                user?.photo_url ? '' : 'bg-primary'
              } ${profileOpen ? 'ring-2 ring-primary/40' : 'hover:opacity-90 hover:scale-105'}`}
              title={user?.name || 'Profile'}
            >
              {/* Initials are the fallback, not the only state — this used to
                  render them unconditionally, so an uploaded photo never
                  showed here even though the Portfolio displayed it fine. */}
              {user?.photo_url ? (
                <img src={resolveMediaUrl(user.photo_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{avatarInitials}</span>
              )}
            </button>

            {/* Invisible bridge: fills the gap so mouse doesn't leave the hover zone */}
            {profileOpen && <div className="absolute right-0 top-full h-2 w-full" />}

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-border rounded-xl shadow-xl z-50 py-1.5">
                <div className="px-3.5 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-on-surface truncate">{user?.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email || user?.roll_no}</p>
                </div>

                <div className="py-1">
                  {PROFILE_MENU_ITEMS.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.to); setProfileOpen(false) }}
                      className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors cursor-pointer"
                    >
                      <item.icon className="h-4 w-4 text-on-surface-variant shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="py-1 border-t border-border">
                  {PROFILE_MENU_SOON.map((item) => (
                    <div
                      key={item.label}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-on-surface-variant opacity-60 cursor-default"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.note ? (
                        <span className="text-xs">{item.note}</span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-surface-high">
                          Soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="py-1 border-t border-border">
                  <a
                    href="mailto:support@worklearn.ai"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors cursor-pointer"
                  >
                    <LifeBuoy className="h-4 w-4 text-on-surface-variant shrink-0" />
                    Help &amp; Support
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
