import { lazy } from 'react'

// Lazy — a regular student never downloads this bundle (shell + every page +
// shared admin components). See App.jsx's Suspense boundary around this route.
export default lazy(() => import('../../features/admin-portal/AdminPortal'))
