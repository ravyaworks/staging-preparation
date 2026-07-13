import { describe, it, expect } from 'vitest'
import { WhatsAppAuth } from '../auth/whatsapp-auth'
import { WhatsAppError } from '../types'

describe('WhatsAppAuth', () => {
  const auth = new WhatsAppAuth()

  describe('verifyToken', () => {
    it('should match valid tokens', () => {
      expect(auth.verifyToken('abc123', 'abc123')).toBe(true)
    })

    it('should reject mismatched tokens', () => {
      expect(auth.verifyToken('abc', 'xyz')).toBe(false)
    })
  })

  describe('validateAccessToken', () => {
    it('should accept valid tokens', () => {
      expect(() => auth.validateAccessToken('EAASB1234567890test')).not.toThrow()
    })

    it('should reject short tokens', () => {
      expect(() => auth.validateAccessToken('short')).toThrow(WhatsAppError)
      expect(() => auth.validateAccessToken('')).toThrow(WhatsAppError)
    })
  })

  describe('getAuthHeader', () => {
    it('should return Bearer header', () => {
      expect(auth.getAuthHeader('EAAToken1234567890')).toBe('Bearer EAAToken1234567890')
    })
  })
})
