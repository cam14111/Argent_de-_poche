import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin } from './crypto'

describe('crypto', () => {
  describe('hashPin', () => {
    it('should hash a PIN', async () => {
      const pin = '1234'
      const hash = await hashPin(pin)

      expect(hash).toBeDefined()
      expect(hash).toHaveLength(64)
      expect(hash).not.toBe(pin)
    })

    it('should produce consistent hashes', async () => {
      const pin = '1234'
      const hash1 = await hashPin(pin)
      const hash2 = await hashPin(pin)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different PINs', async () => {
      const hash1 = await hashPin('1234')
      const hash2 = await hashPin('5678')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPin', () => {
    it('should verify a correct PIN', async () => {
      const pin = '1234'
      const hash = await hashPin(pin)

      const isValid = await verifyPin(pin, hash)

      expect(isValid).toBe(true)
    })

    it('should reject an incorrect PIN', async () => {
      const hash = await hashPin('1234')

      const isValid = await verifyPin('5678', hash)

      expect(isValid).toBe(false)
    })
  })
})
