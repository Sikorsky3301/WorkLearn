import { describe, it, expect, beforeEach } from 'vitest'
import { createGenericSimStore } from './useGenericSimStore'

describe('createGenericSimStore', () => {
  let store

  beforeEach(() => {
    // A fresh store (and a fresh localStorage key) per test — this factory
    // exists specifically so each simulation gets an isolated instance, so
    // testing that isolation is the point, not incidental.
    localStorage.clear()
    store = createGenericSimStore('test-sim')
  })

  it('starts in not_started with no active enrollment', () => {
    expect(store.getState().status).toBe('not_started')
    expect(store.getState().enrollmentId).toBeNull()
  })

  it('startSimulation moves to in_progress and records the enrollment', () => {
    store.getState().startSimulation('enroll-1')
    expect(store.getState().status).toBe('in_progress')
    expect(store.getState().enrollmentId).toBe('enroll-1')
  })

  it('startSimulation is a no-op once already in progress with the same enrollment', () => {
    store.getState().startSimulation('enroll-1')
    store.getState().goToTask(3)
    store.getState().startSimulation('enroll-1')
    // Must not reset progress just because the same enrollment starts again.
    expect(store.getState().currentTaskIndex).toBe(3)
  })

  it('startSimulation resets progress when a DIFFERENT enrollment begins', () => {
    store.getState().startSimulation('enroll-1')
    store.getState().completeTask(1, 3)
    store.getState().startSimulation('enroll-2')
    expect(store.getState().enrollmentId).toBe('enroll-2')
    expect(store.getState().completedTasks).toEqual([])
    expect(store.getState().currentTaskIndex).toBe(1)
  })

  it('completeTask advances to the next task and does not double-count repeats', () => {
    store.getState().startSimulation('enroll-1')
    store.getState().completeTask(1, 3)
    expect(store.getState().completedTasks).toEqual([1])
    expect(store.getState().currentTaskIndex).toBe(2)

    store.getState().completeTask(1, 3) // repeat completion of the same task
    expect(store.getState().completedTasks).toEqual([1])
    expect(store.getState().currentTaskIndex).toBe(2) // did not advance again
  })

  it('completeTask marks the simulation completed once every task is done', () => {
    store.getState().startSimulation('enroll-1')
    store.getState().completeTask(1, 2)
    store.getState().completeTask(2, 2)
    expect(store.getState().status).toBe('completed')
    expect(store.getState().completedTasks).toEqual([1, 2])
  })

  it('tick only advances elapsedSeconds while in_progress', () => {
    store.getState().tick()
    expect(store.getState().elapsedSeconds).toBe(0) // not started yet

    store.getState().startSimulation('enroll-1')
    store.getState().tick()
    store.getState().tick()
    expect(store.getState().elapsedSeconds).toBe(2)
  })

  it('resetSimulation returns every field to its initial value', () => {
    store.getState().startSimulation('enroll-1')
    store.getState().completeTask(1, 3)
    store.getState().tick()
    store.getState().resetSimulation()

    expect(store.getState()).toMatchObject({
      status: 'not_started',
      enrollmentId: null,
      currentTaskIndex: 1,
      completedTasks: [],
      elapsedSeconds: 0,
    })
  })
})
