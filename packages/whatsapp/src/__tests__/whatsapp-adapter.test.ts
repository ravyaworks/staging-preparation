import { describe, it, expect, vi } from 'vitest'

describe('WhatsAppAdapter', () => {
  it('should be creatable', async () => {
    const { createWhatsAppAdapter } = await import('../adapter/whatsapp-adapter')
    const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
    const adapter = createWhatsAppAdapter(logger)
    expect(adapter).toBeDefined()
    expect(adapter.channelInfo.channelType).toBe('whatsapp')
    expect(adapter.channelInfo.isActive).toBe(true)
  })

  it('should validate a correct webhook payload', async () => {
    const { createWhatsAppAdapter } = await import('../adapter/whatsapp-adapter')
    const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
    const adapter = createWhatsAppAdapter(logger)
    const validPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: '456' },
            contacts: [{ profile: { name: 'John' }, wa_id: '789' }],
            messages: [{ from: '789', id: 'msg1', type: 'text', text: { body: 'Hello' }, timestamp: '1700000000' }],
          },
          field: 'messages',
        }],
      }],
    }
    expect(adapter.validate(validPayload as any)).toBe(true)
  })

  it('should reject invalid payload', async () => {
    const { createWhatsAppAdapter } = await import('../adapter/whatsapp-adapter')
    const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
    const adapter = createWhatsAppAdapter(logger)
    expect(adapter.validate({})).toBe(false)
    expect(adapter.validate(null as any)).toBe(false)
    expect(adapter.validate({ entry: [] })).toBe(false)
  })

  it('should normalize a text message payload', async () => {
    const { createWhatsAppAdapter } = await import('../adapter/whatsapp-adapter')
    const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
    const adapter = createWhatsAppAdapter(logger)
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: '456' },
            contacts: [{ profile: { name: 'John Doe' }, wa_id: '789' }],
            messages: [{ from: '789', id: 'wa-msg-1', type: 'text', text: { body: 'Hello World' }, timestamp: '1700000000' }],
          },
          field: 'messages',
        }],
      }],
    }
    const normalized = adapter.normalize(payload as any)
    expect(normalized.channel).toBe('whatsapp')
    expect(normalized.content).toBe('Hello World')
    expect(normalized.sender.phone).toBe('789')
    expect(normalized.sender.name).toBe('John Doe')
    expect(normalized.recipient.phone).toBe('456')
    expect(normalized.messageType).toBe('text')
    expect(normalized.direction).toBe('inbound')
  })
})
