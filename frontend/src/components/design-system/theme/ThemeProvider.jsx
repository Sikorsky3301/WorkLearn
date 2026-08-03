import { createContext, useEffect, useState } from 'react'

export const ThemeContext = createContext(null)
const STORAGE_KEY = 'wl_portal_theme'

/** Scoped to the Admin/SuperAdmin portals only. PortalShell.jsx applies the
 * resulting `theme` as the `wl-portal-dark` class on its own root div (see
 * tailwind.config.js's `darkMode: ['selector', '.wl-portal-dark']`) — never
 * on <html>/<body> — so dark mode can never leak into the student-facing
 * app, even if a shared component here is reused there later. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem(STORAGE_KEY) || 'light'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
