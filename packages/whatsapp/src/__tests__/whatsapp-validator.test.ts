import { describe, it, expect } from 'vitest'
import { WhatsAppValidator } from '../validation/whatsapp-validator'
import { WhatsAppError } from '../types'

describe('WhatsAppValidator', () => {
  const validator = new WhatsAppValidator()

  describe('validatePhoneNumber', () => {
    it('should accept valid E.164 numbers', () => {
      expect(validator.validatePhoneNumber('+1234567890')).toBe('+1234567890')
      expect(validator.validatePhoneNumber('1234567890')).toBe('+1234567890')
      expect(validator.validatePhoneNumber('+919876543210')).toBe('+919876543210')
    })

    it('should reject invalid phone numbers', () => {
      expect(() => validator.validatePhoneNumber('')).toThrow(WhatsAppError)
      expect(() => validator.validatePhoneNumber('abc')).toThrow(WhatsAppError)
      expect(() => validator.validatePhoneNumber('+12')).toThrow(WhatsAppError)
    })
  })

  describe('validateMessageBody', () => {
    it('should accept valid messages', () => {
      expect(() => validator.validateMessageBody('Hello')).not.toThrow()
      expect(() => validator.validateMessageBody(' '.repeat(100))).toThrow(WhatsAppError)
    })

    it('should reject empty messages', () => {
      expect(() => validator.validateMessageBody('')).toThrow(WhatsAppError)
      expect(() => validator.validateMessageBody('   ')).toThrow(WhatsAppError)
    })

    it('should reject overly long messages', () => {
      expect(() => validator.validateMessageBody('x'.repeat(5000))).toThrow(WhatsAppError)
    })
  })

  describe('validateTemplateName', () => {
    it('should accept valid template names', () => {
      expect(() => validator.validateTemplateName('welcome_message')).not.toThrow()
      expect(() => validator.validateTemplateName('order_confirmation_2024')).not.toThrow()
    })

    it('should reject invalid template names', () => {
      expect(() => validator.validateTemplateName('')).toThrow(WhatsAppError)
      expect(() => validator.validateTemplateName('UPPERCASE')).toThrow(WhatsAppError)
      expect(() => validator.validateTemplateName('has spaces')).toThrow(WhatsAppError)
    })
  })

  describe('validateMediaFile', () => {
    it('should accept valid media files', () => {
      expect(() => validator.validateMediaFile('photo.jpg', 'image/jpeg', 1024 * 1024)).not.toThrow()
      expect(() => validator.validateMediaFile('doc.pdf', 'application/pdf', 50 * 1024 * 1024)).not.toThrow()
    })

    it('should reject unsupported types', () => {
      expect(() => validator.validateMediaFile('file.exe', 'application/x-msdownload', 1024)).toThrow(WhatsAppError)
    })

    it('should reject oversized files', () => {
      expect(() => validator.validateMediaFile('big.jpg', 'image/jpeg', 10 * 1024 * 1024)).toThrow(WhatsAppError)
    })
  })

  describe('validateWebhookPayload', () => {
    it('should accept valid payloads', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{ id: '1', changes: [] }],
      }
      expect(validator.validateWebhookPayload(payload)).toBe(true)
    })

    it('should reject invalid payloads', () => {
      expect(validator.validateWebhookPayload(null)).toBe(false)
      expect(validator.validateWebhookPayload({})).toBe(false)
      expect(validator.validateWebhookPayload({ object: 'not_whatsapp' })).toBe(false)
    })
  })
})
