import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WhatsAppBusinessSender } from '../services/whatsapp-business-sender'
import type { WhatsAppConfig } from '../types'

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
    setLevel: vi.fn(),
    getLevel: vi.fn().mockReturnValue('debug'),
  }
}

function createTestConfig(): WhatsAppConfig {
  return {
    accessToken: 'EAATestAccessToken12345',
    phoneNumberId: '123456789',
    businessAccountId: '987654321',
    webhookVerifyToken: 'test-verify-token',
    apiVersion: 'v22.0',
    requestTimeoutMs: 5000,
    maxRetries: 2,
    retryDelayMs: 100,
  }
}

describe('WhatsAppBusinessSender', () => {
  let sender: WhatsAppBusinessSender
  const logger = createMockLogger()

  beforeEach(() => {
    sender = new WhatsAppBusinessSender(createTestConfig(), logger)
  })

  it('should have correct name and channel', () => {
    expect(sender.name).toBe('whatsapp-business-platform')
    expect(sender.channel).toBe('whatsapp')
  })

  it('should return failure for invalid phone numbers', async () => {
    const result = await sender.send('invalid', 'Hello')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should return failure for empty messages', async () => {
    const result = await sender.send('+1234567890', '')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should provide access to client, validator, and config', () => {
    expect(sender.getClient()).toBeDefined()
    expect(sender.getValidator()).toBeDefined()
    expect(sender.getConfig()).toBeDefined()
    expect(sender.getConfig().phoneNumberId).toBe('123456789')
  })
})
