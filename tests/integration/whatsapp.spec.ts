import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WhatsAppBusinessSender, WhatsAppApiClient, WhatsAppWebhookProcessor, MediaService, loadWhatsAppConfig, WhatsAppValidator } from '@conversation-platform/whatsapp'
import type { WhatsAppConfig, WhatsAppWebhookPayload } from '@conversation-platform/whatsapp'

function createTestConfig(overrides?: Partial<WhatsAppConfig>): WhatsAppConfig {
  return {
    accessToken: overrides?.accessToken ?? 'test-access-token',
    phoneNumberId: overrides?.phoneNumberId ?? '123456789',
    businessAccountId: overrides?.businessAccountId ?? '987654321',
    apiVersion: overrides?.apiVersion ?? 'v21.0',
    webhookVerifyToken: overrides?.webhookVerifyToken ?? 'test-verify-token',
    appSecret: overrides?.appSecret ?? 'test-app-secret',
    baseUrl: overrides?.baseUrl ?? 'https://graph.facebook.com',
    requestTimeoutMs: overrides?.requestTimeoutMs ?? 30000,
    maxRetries: overrides?.maxRetries ?? 3,
    retryDelayMs: overrides?.retryDelayMs ?? 1000,
  }
}

function createTextPayload(): WhatsAppWebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: '987654321',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: '123456789', display_phone_number: '15551234567' },
          contacts: [{ profile: { name: 'John' }, wa_id: '15551234567' }],
          messages: [{
            from: '15551234567',
            id: 'wamid.test123',
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { body: 'Hello!' },
            type: 'text',
          }],
        },
      }],
    }],
  }
}

function createStatusPayload(): WhatsAppWebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: '987654321',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: '123456789', display_phone_number: '15551234567' },
          statuses: [{
            id: 'wamid.status123',
            recipient_id: '15551234567',
            status: 'delivered',
            timestamp: String(Math.floor(Date.now() / 1000)),
          }],
        },
      }],
    }],
  }
}

describe('WhatsApp Integration', () => {
  const config = createTestConfig()

  describe('Webhook Validation', () => {
    it('should validate a webhook request with correct token', () => {
      const validator = new WhatsAppValidator()
      const result = validator.validateWebhookPayload(createTextPayload())
      expect(result).toBe(true)
    })

    it('should reject invalid webhook payload', () => {
      const validator = new WhatsAppValidator()
      expect(validator.validateWebhookPayload({})).toBe(false)
    })
  })

  describe('Webhook Event Processing', () => {
    it('should extract a text message from webhook payload', async () => {
      const deliveryTracker = { recordEvent: vi.fn().mockResolvedValue(undefined) } as any
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any
      const processor = new WhatsAppWebhookProcessor(deliveryTracker, logger)

      const result = await processor.process(createTextPayload())
      expect(result.incomingMessages).toHaveLength(1)
      expect(result.incomingMessages[0].from).toBe('15551234567')
      expect(result.incomingMessages[0].text).toBe('Hello!')
    })

    it('should extract a status update from webhook payload', async () => {
      const deliveryTracker = { recordEvent: vi.fn().mockResolvedValue(undefined) } as any
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any
      const processor = new WhatsAppWebhookProcessor(deliveryTracker, logger)

      const result = await processor.process(createStatusPayload())
      expect(result.acknowledgedStatuses).toHaveLength(1)
      expect(result.acknowledgedStatuses[0].status).toBe('delivered')
      expect(result.acknowledgedStatuses[0].messageId).toBe('wamid.status123')
    })

    it('should return empty for invalid payload', async () => {
      const deliveryTracker = { recordEvent: vi.fn() } as any
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any
      const processor = new WhatsAppWebhookProcessor(deliveryTracker, logger)

      const result = await processor.process({} as WhatsAppWebhookPayload)
      expect(result.recordedEvents).toBe(0)
      expect(result.incomingMessages).toHaveLength(0)
    })
  })

  describe('Configuration Loading', () => {
    it('should throw on missing required env vars', () => {
      const origEnv = { ...process.env }
      delete process.env.WHATSAPP_ACCESS_TOKEN
      delete process.env.WHATSAPP_PHONE_NUMBER_ID
      delete process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
      delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      expect(() => loadWhatsAppConfig()).toThrow('Missing required WhatsApp configuration')
      Object.assign(process.env, origEnv)
    })

    it('should load config with all env vars set', () => {
      const origEnv = { ...process.env }
      process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone'
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test-business'
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test-verify'
      process.env.WHATSAPP_API_VERSION = 'v21.0'
      process.env.WHATSAPP_APP_SECRET = 'test-app-secret'

      const loaded = loadWhatsAppConfig()
      expect(loaded.accessToken).toBe('test-token')
      expect(loaded.appSecret).toBe('test-app-secret')
      expect(loaded.apiVersion).toBe('v21.0')

      Object.assign(process.env, origEnv)
    })
  })

  describe('Message Sending', () => {
    it('should create sender with correct config', () => {
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any
      const sender = new WhatsAppBusinessSender(config, logger)
      expect(sender).toBeDefined()
    })
  })

  describe('Media Handling', () => {
    it('should create media service with correct config', async () => {
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any
      const client = new WhatsAppApiClient(config, logger)
      const mediaService = new MediaService(client, config, logger)
      expect(mediaService).toBeDefined()
    })
  })
})
