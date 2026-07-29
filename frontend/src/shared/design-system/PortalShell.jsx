import { ThemeProvider } from './theme/ThemeProvider'
import { useTheme } from './theme/useTheme'

function ShellRoot({ children }) {
  const { theme } = useTheme()
  return (
    <div className={theme === 'dark' ? 'wl-portal-dark' : ''}>
      <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </div>
    </div>
  )
}

/** Shared app-shell wrapper for the Admin and SuperAdmin portals — owns the
 * dark-mode class scope (see tailwind.config.js) so it can never leak into
 * the student-facing app, which never renders inside a PortalShell. Each
 * portal supplies its own <Sidebar> + main column as children. */
export default function PortalShell({ children }) {
  return (
    <ThemeProvider>
      <ShellRoot>{children}</ShellRoot>
    </ThemeProvider>
  )
}
