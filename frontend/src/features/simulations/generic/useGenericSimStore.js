import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Shell-level slice for any CMS-authored simulation — mirrors
// sales-crm-sim/store/useCrmSimStore.js's shell slice (status/enrollmentId/
// currentStageIndex/completedStages/elapsedSeconds) but without that store's
// CRM-domain entity state (leads/accounts/etc.) — a crm_workspace task still
// uses useCrmSimStore directly for that, mounted only while such a task is
// active. One store instance per simulation, keyed by simulation id in the
// persist key so switching between simulations doesn't mix up progress.
export function createGenericSimStore(simId) {
  return create(
    persist(
      (set, get) => ({
        status: 'not_started', // not_started | in_progress | completed
        enrollmentId: null,
        currentTaskIndex: 1,
        completedTasks: [],
        elapsedSeconds: 0,

        startSimulation: (enrollmentId) => set((s) => {
          if (s.enrollmentId && s.enrollmentId !== enrollmentId) {
            return {
              status: 'in_progress', enrollmentId, currentTaskIndex: 1,
              completedTasks: [], elapsedSeconds: 0,
            }
          }
          if (s.status !== 'not_started') return {}
          return { status: 'in_progress', enrollmentId }
        }),

        tick: () => set((s) => (s.status === 'in_progress' ? { elapsedSeconds: s.elapsedSeconds + 1 } : {})),

        goToTask: (index) => set({ currentTaskIndex: index }),

        completeTask: (index, totalTasks) => set((s) => {
          if (s.completedTasks.includes(index)) return {}
          const completedTasks = [...s.completedTasks, index]
          const nextIndex = s.currentTaskIndex + 1
          const allDone = completedTasks.length >= totalTasks
          return {
            completedTasks,
            currentTaskIndex: allDone ? s.currentTaskIndex : nextIndex,
            status: allDone ? 'completed' : s.status,
          }
        }),

        resetSimulation: () => set({
          status: 'not_started', enrollmentId: null, currentTaskIndex: 1,
          completedTasks: [], elapsedSeconds: 0,
        }),
      }),
      { name: `wl-generic-sim-${simId}`, version: 1 }
    )
  )
}

// One store instance per simId, created lazily and cached — components call
// useGenericSimStore(simId) the same way useCrmSimStore() is called directly.
const storeCache = new Map()

export function useGenericSimStore(simId, selector) {
  if (!storeCache.has(simId)) {
    storeCache.set(simId, createGenericSimStore(simId))
  }
  return storeCache.get(simId)(selector)
}
