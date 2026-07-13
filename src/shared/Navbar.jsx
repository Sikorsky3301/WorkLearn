import { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuth } from '../features/auth/AuthContext'

export default function Navbar() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, logout } = useAuth()

  const avatarInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const [profileOpen, setProfileOpen] = useState(false)
  const [simOpen,     setSimOpen]     = useState(false)

  const profileRef   = useRef(null)
  const simCloseTimer = useRef(null)

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

      <div className="max-w-container mx-auto px-6 flex items-center gap-1" style={{ height: 52 }}>

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
                className="absolute left-0 top-full pt-2 w-72 z-50"
                onMouseEnter={openSim}
                onMouseLeave={closeSim}
              >
                <div className="bg-white border border-border rounded-xl shadow-xl py-2">

                  <p className="px-3 pt-1 pb-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
                    My Simulations
                  </p>
                  <button
                    onClick={() => { navigate('/simulations?filter=enrolled'); setSimOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-low transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        My Enrolled Simulations
                      </p>
                      <p className="text-xs text-on-surface-variant">View progress across active simulations</p>
                    </div>
                  </button>

                  <div className="mx-3 my-2 border-t border-border" />

                  <button
                    onClick={() => { navigate('/simulations'); setSimOpen(false) }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-low transition-colors rounded"
                  >
                    Browse all simulations
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

          {/* Avatar + profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
              title={user?.name || 'Profile'}
            >
              <span className="text-white text-xs font-bold">{avatarInitials}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-xl shadow-lg z-50 py-1">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-sm font-semibold text-on-surface">{user?.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email || user?.roll_no}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setProfileOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
