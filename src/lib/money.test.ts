import { describe, it, expect } from 'vitest'
import {
  roundCents,
  sumAmounts,
  parseAmount,
  formatEuros,
  formatSignedEuros,
} from './money'

describe('money', () => {
  describe('roundCents', () => {
    it('rounds to the nearest cent', () => {
      expect(roundCents(1.005)).toBe(1.01)
      expect(roundCents(1.004)).toBe(1)
      expect(roundCents(0.1 + 0.2)).toBe(0.3)
    })
  })

  describe('sumAmounts', () => {
    it('sums without floating point drift', () => {
      expect(sumAmounts([0.1, 0.2])).toBe(0.3)
      expect(sumAmounts([10, -3.5])).toBe(6.5)
      const many = Array.from({ length: 10 }, () => 0.1)
      expect(sumAmounts(many)).toBe(1)
    })

    it('handles empty arrays', () => {
      expect(sumAmounts([])).toBe(0)
    })
  })

  describe('parseAmount', () => {
    it('accepts comma and dot decimals', () => {
      expect(parseAmount('12,50')).toBe(12.5)
      expect(parseAmount('12.50')).toBe(12.5)
      expect(parseAmount(' 7 ')).toBe(7)
    })

    it('rejects invalid or negative input', () => {
      expect(parseAmount('')).toBeNull()
      expect(parseAmount('abc')).toBeNull()
      expect(parseAmount('-5')).toBeNull()
      expect(parseAmount('1.234')).toBeNull()
      expect(parseAmount('1e3')).toBeNull()
    })
  })

  describe('formatEuros', () => {
    it('formats in French euro style', () => {
      expect(formatEuros(6.5)).toContain('6,50')
      expect(formatEuros(6.5)).toContain('€')
    })
  })

  describe('formatSignedEuros', () => {
    it('prefixes sign by transaction type', () => {
      expect(formatSignedEuros(10, 'CREDIT').startsWith('+')).toBe(true)
      expect(formatSignedEuros(10, 'DEBIT').startsWith('-')).toBe(true)
    })
  })
})
