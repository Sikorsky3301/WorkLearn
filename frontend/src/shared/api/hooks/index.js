// Barrel re-export — this file used to hold all 69+ hooks directly (one
// 639-line file). Split into domain files below so none of the existing
// import sites (`import { useX } from '../../shared/api/hooks'`) needed to
// change.
export * from './simulations'
export * from './sandbox'
export * from './tasks'
export * from './skills'
export * from './messages'
export * from './badges'
export * from './analytics'
export * from './mentor'
export * from './roleplay'
export * from './admin'
export * from './admin-simulations'
export * from './admin-sim-builder'
export * from './admin-management'
export * from './feature-flags'
export * from './platform-analytics'
export * from './platform-config'
