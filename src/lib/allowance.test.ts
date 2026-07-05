import { describe, it, expect } from 'vitest'
import { computeDueDates, type AllowanceConfig } from './allowance'

function weekly(lastApplied: string, dayOfWeek: number): AllowanceConfig {
  return {
    amount: 5,
    frequency: 'weekly',
    dayOfWeek,
    lastAppliedAt: lastApplied,
    enabled: true,
  }
}

function monthly(lastApplied: string, dayOfMonth: number): AllowanceConfig {
  return {
    amount: 20,
    frequency: 'monthly',
    dayOfMonth,
    lastAppliedAt: lastApplied,
    enabled: true,
  }
}

describe('computeDueDates', () => {
  it('returns nothing when disabled', () => {
    const config = { ...weekly('2026-01-01T00:00:00.000Z', 6), enabled: false }
    expect(computeDueDates(config, new Date('2026-03-01T00:00:00.000Z'))).toEqual([])
  })

  it('returns nothing when amount is zero', () => {
    const config = { ...weekly('2026-01-01T00:00:00.000Z', 6), amount: 0 }
    expect(computeDueDates(config, new Date('2026-03-01T00:00:00.000Z'))).toEqual([])
  })

  it('computes weekly Saturdays after last applied', () => {
    // 2026-01-01 is a Thursday; Saturdays before Jan 20: 03, 10, 17
    const config = weekly('2026-01-01T12:00:00.000Z', 6)
    const due = computeDueDates(config, new Date('2026-01-20T12:00:00.000Z'))
    expect(due.map((d) => d.getDay())).toEqual([6, 6, 6])
    expect(due).toHaveLength(3)
  })

  it('does not duplicate the last applied date', () => {
    const config = weekly('2026-01-03T12:00:00.000Z', 6) // a Saturday
    const due = computeDueDates(config, new Date('2026-01-03T23:00:00.000Z'))
    expect(due).toHaveLength(0)
  })

  it('computes monthly occurrences', () => {
    const config = monthly('2026-01-15T12:00:00.000Z', 1)
    const due = computeDueDates(config, new Date('2026-04-02T12:00:00.000Z'))
    // Feb 1, Mar 1, Apr 1
    expect(due).toHaveLength(3)
    expect(due.every((d) => d.getDate() === 1)).toBe(true)
  })

  it('caps catch-up payments', () => {
    const config = weekly('2020-01-01T12:00:00.000Z', 6)
    const due = computeDueDates(config, new Date('2026-01-01T12:00:00.000Z'))
    expect(due.length).toBeLessThanOrEqual(8)
  })

  it('handles invalid lastAppliedAt gracefully', () => {
    const config = weekly('not-a-date', 6)
    expect(computeDueDates(config, new Date())).toEqual([])
  })

  it('does not infinite-loop on an out-of-range dayOfWeek', () => {
    // dayOfWeek = 7 (invalid) must be normalised, not spin forever.
    const config = weekly('2026-01-01T12:00:00.000Z', 7)
    const due = computeDueDates(config, new Date('2026-01-20T12:00:00.000Z'))
    // 7 % 7 === 0 (dimanche) : on obtient bien des dimanches, sans blocage.
    expect(due.every((d) => d.getDay() === 0)).toBe(true)
  })

  it('normalises a negative dayOfWeek', () => {
    const config = weekly('2026-01-01T12:00:00.000Z', -1)
    const due = computeDueDates(config, new Date('2026-01-20T12:00:00.000Z'))
    // -1 -> samedi (6)
    expect(due.every((d) => d.getDay() === 6)).toBe(true)
  })
})
