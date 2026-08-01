// Barrel re-export — this file used to hold all 69+ hooks directly (one
// 639-line file). Split into domain files below so every existing import
// site (`import { useX } from '.../hooks'`) keeps resolving to this folder
// without needing to know which domain file a given hook actually lives in.
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
export * from './profile'
