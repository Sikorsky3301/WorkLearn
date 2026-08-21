import {
  LayoutDashboard, Users, Building2, LineChart, Flag, ClipboardList,
  Blocks, Wand2, SlidersHorizontal,
} from 'lucide-react'

/** Shared Admin portal sidebar sections — used by AdminPortal and AdminCmsLayout. */
export const ADMIN_NAV_SECTIONS = [
  { items: [{ label: 'Overview', icon: LayoutDashboard, to: '/admin', end: true, need: null }] },
  {
    label: 'People',
    items: [
      { label: 'Users', icon: Users, to: '/admin/users', need: 'users.view' },
      { label: 'Universities', icon: Building2, to: '/admin/universities', need: 'users.view' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Simulations', icon: Blocks, to: '/admin/simulations', need: 'simulations.view' },
      { label: 'Sim Builder', icon: Wand2, to: '/admin/sim-builder', need: 'simulations.view' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', icon: LineChart, to: '/admin/analytics', need: 'analytics.view_platform' },
      { label: 'Feature Flags', icon: Flag, to: '/admin/feature-flags', need: 'feature_flags.view' },
      { label: 'Activity', icon: ClipboardList, to: '/admin/activity', need: 'activity.view_feed' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Configuration', icon: SlidersHorizontal, to: '/admin/configuration', need: 'config.view' },
    ],
  },
]

export const ADMIN_TITLES = {
  '/admin': 'Overview',
  '/admin/users': 'Users',
  '/admin/universities': 'Universities',
  '/admin/simulations': 'Simulations',
  '/admin/sim-builder': 'Sim Builder',
  '/admin/analytics': 'Analytics',
  '/admin/feature-flags': 'Feature Flags',
  '/admin/activity': 'Activity',
  '/admin/configuration': 'Configuration',
}

/** Topbar title for CMS list + editor paths under /admin. */
export function adminTitleForPath(pathname) {
  if (ADMIN_TITLES[pathname]) return ADMIN_TITLES[pathname]
  if (pathname.startsWith('/admin/simulations/')) return 'Simulation Builder'
  if (pathname.startsWith('/admin/sim-builder/')) return 'Sim Builder'
  return 'Admin'
}

export function isAdminCmsEditorPath(pathname) {
  return /^\/admin\/simulations\/[^/]+$/.test(pathname)
    || /^\/admin\/sim-builder\/[^/]+$/.test(pathname)
}
