import { describe, it, expect } from 'vitest'
import { computeProgress, type SavingsGoal } from './goals'

const baseGoal: SavingsGoal = {
  id: 'g1',
  profileId: 1,
  name: 'Vélo',
  icon: '🚲',
  targetAmount: 100,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('computeProgress', () => {
  it('computes partial progress', () => {
    const p = computeProgress(baseGoal, 25)
    expect(p.progress).toBe(25)
    expect(p.reached).toBe(false)
  })

  it('caps progress at 100 when balance exceeds target', () => {
    const p = computeProgress(baseGoal, 150)
    expect(p.progress).toBe(100)
    expect(p.reached).toBe(true)
  })

  it('marks reached when balance equals target', () => {
    const p = computeProgress(baseGoal, 100)
    expect(p.reached).toBe(true)
  })

  it('floors progress at 0 for a negative balance', () => {
    const p = computeProgress(baseGoal, -10)
    expect(p.progress).toBe(0)
    expect(p.reached).toBe(false)
  })

  it('handles a zero target safely', () => {
    const p = computeProgress({ ...baseGoal, targetAmount: 0 }, 50)
    expect(p.progress).toBe(0)
    expect(p.reached).toBe(false)
  })
})
