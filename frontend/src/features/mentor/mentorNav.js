import { Users, LayoutDashboard, ClipboardList, Blocks, Wand2 } from 'lucide-react'

/** Mentor sidebar sections; pass cms=true when teacher has cms_access. */
export function buildMentorNavSections(cms) {
  const items = [
    { label: 'Overview', icon: LayoutDashboard, to: '/mentor', end: true },
    { label: 'Students', icon: Users, to: '/mentor/students' },
    { label: 'Assignments', icon: ClipboardList, to: '/mentor/assignments' },
  ]
  const groups = [{ items }]
  if (cms) {
    groups.push({
      label: 'CMS',
      items: [
        { label: 'Simulations', icon: Blocks, to: '/mentor/simulations' },
        // Standalone full-screen tool, own tab — see adminNav.js's Sim Builder item.
        { label: 'Sim Builder', icon: Wand2, to: '/mentor/content/sim-builder', newTab: true },
      ],
    })
  }
  return groups
}

const MENTOR_TITLES = {
  '/mentor': 'Overview',
  '/mentor/students': 'Students',
  '/mentor/assignments': 'Assignments',
  '/mentor/simulations': 'Simulations',
  '/mentor/sim-builder': 'Sim Builder',
}

export function mentorTitleForPath(pathname) {
  if (MENTOR_TITLES[pathname]) return MENTOR_TITLES[pathname]
  if (pathname.startsWith('/mentor/simulations/')) return 'Simulation Builder'
  if (pathname.startsWith('/mentor/sim-builder/')) return 'Sim Builder'
  return 'Mentor'
}

export function isMentorCmsEditorPath(pathname) {
  return /^\/mentor\/simulations\/[^/]+$/.test(pathname)
    || /^\/mentor\/sim-builder\/[^/]+$/.test(pathname)
}
