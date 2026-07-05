import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin, needsRehash } from './crypto'

describe('crypto', () => {
  describe('hashPin', () => {
    it('should hash a PIN in PBKDF2 format', async () => {
      const pin = '1234'
      const hash = await hashPin(pin)

      expect(hash).toBeDefined()
      expect(hash.startsWith('pbkdf2$')).toBe(true)
      expect(hash).not.toContain(pin)
    })

    it('should produce different hashes for the same PIN (random salt)', async () => {
      const pin = '1234'
      const hash1 = await hashPin(pin)
      const hash2 = await hashPin(pin)

      expect(hash1).not.toBe(hash2)
      expect(await verifyPin(pin, hash1)).toBe(true)
      expect(await verifyPin(pin, hash2)).toBe(true)
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

    it('should verify a legacy SHA-256 hash', async () => {
      // sha256('1234')
      const legacyHash =
        '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'

      expect(await verifyPin('1234', legacyHash)).toBe(true)
      expect(await verifyPin('0000', legacyHash)).toBe(false)
    })
  })

  describe('needsRehash', () => {
    it('should flag legacy hashes for migration', async () => {
      const legacyHash =
        '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
      expect(needsRehash(legacyHash)).toBe(true)
    })

    it('should not flag current-format hashes', async () => {
      const hash = await hashPin('1234')
      expect(needsRehash(hash)).toBe(false)
    })
  })
})
