import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiChannel } from '../channel'
import type { ApiChannelConfig } from '../types'
import type { ChannelConfig, OutgoingMessage } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'

function createRequestContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    requestId: 'req-123',
    tenantId: 'tenant-1',
    userId: 'user-1',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    ...overrides,
  }
}

describe('ApiChannel', () => {
  let channel: ApiChannel

  beforeEach(() => {
    channel = new ApiChannel()
  })

  describe('initialize', () => {
    it('initializes with valid config', async () => {
      const config: ChannelConfig = { enabled: true }
      await expect(channel.initialize(config)).resolves.toBeUndefined()
      expect(channel.getConfig().enabled).toBe(true)
    })

    it('throws on invalid config', async () => {
      const config = {} as ChannelConfig
      await expect(channel.initialize(config)).rejects.toThrow()
    })
  })

  describe('connect / disconnect', () => {
    it('connects with api_key auth', async () => {
      await channel.initialize({ enabled: true })
      await channel.connect({ type: 'api_key', credentials: { apiKey: 'sk-test' } })
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.status).toBe('connected')
    })

    it('throws on missing api key', async () => {
      await channel.initialize({ enabled: true })
      await expect(channel.connect({ type: 'api_key' })).rejects.toThrow()
    })

    it('disconnects cleanly', async () => {
      await channel.initialize({ enabled: true })
      await channel.connect({ type: 'api_key', credentials: { apiKey: 'sk-test' } })
      await channel.disconnect()
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(false)
    })
  })

  describe('healthCheck', () => {
    it('returns healthy when connected', async () => {
      await channel.initialize({ enabled: true })
      await channel.connect({ type: 'api_key', credentials: { apiKey: 'sk-test' } })
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.version).toBe('1.0.0')
      expect(health.latencyMs).toBeGreaterThanOrEqual(0)
    })

    it('returns unhealthy when not connected', async () => {
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.status).toBe('disconnected')
    })
  })

  describe('sendMessage', () => {
    it('sends a message when connected', async () => {
      await channel.initialize({ enabled: true })
      await channel.connect({ type: 'api_key', credentials: { apiKey: 'sk-test' } })
      const msg: OutgoingMessage = {
        id: 'msg-1',
        type: 'text',
        content: { type: 'text', text: 'Hello' },
        attachments: [],
        buttons: [],
        listOptions: [],
        quickReplies: [],
        metadata: {
          messageId: 'msg-1',
          conversationId: 'conv-1',
          channelType: 'api',
          timestamp: new Date().toISOString(),
          source: 'bot',
        },
        user: { id: 'user-1' },
        conversation: { id: 'conv-1', channelType: 'api' },
        tenant: { id: 'tenant-1' },
      }
      const result = await channel.sendMessage(msg)
      expect(result).toBe('msg-1')
    })

    it('throws when not connected', async () => {
      const msg = {} as OutgoingMessage
      await expect(channel.sendMessage(msg)).rejects.toThrow()
    })
  })

  describe('sendTypingIndicator', () => {
    it('sends typing indicator when connected', async () => {
      await channel.initialize({ enabled: true })
      await channel.connect({ type: 'api_key', credentials: { apiKey: 'sk-test' } })
      await expect(channel.sendTypingIndicator('conv-1', true, 'tenant-1')).resolves.toBeUndefined()
    })

    it('throws when not connected', async () => {
      await expect(channel.sendTypingIndicator('conv-1', true, 'tenant-1')).rejects.toThrow()
    })
  })

  describe('markAsRead', () => {
    it('marks message as read', async () => {
      await channel.initialize({ enabled: true })
      await channel.connect({ type: 'api_key', credentials: { apiKey: 'sk-test' } })
      await expect(channel.markAsRead('msg-1', 'conv-1', 'tenant-1')).resolves.toBeUndefined()
    })
  })

  describe('getCapabilities', () => {
    it('returns full capabilities', () => {
      const caps = channel.getCapabilities()
      expect(caps.incoming).toContain('text')
      expect(caps.incoming).toContain('image')
      expect(caps.incoming).toContain('document')
      expect(caps.incoming).toContain('audio')
      expect(caps.incoming).toContain('video')
      expect(caps.incoming).toContain('file')
      expect(caps.incoming).toContain('button')
      expect(caps.incoming).toContain('list')
      expect(caps.incoming).toContain('quick_reply')
      expect(caps.incoming).toContain('location')
      expect(caps.incoming).toContain('contact')
      expect(caps.supportsReplies).toBe(true)
      expect(caps.supportsThreads).toBe(true)
      expect(caps.supportsRichText).toBe(true)
    })
  })

  describe('updateConfig', () => {
    it('updates config', async () => {
      await channel.initialize({ enabled: true })
      await channel.updateConfig({ enabled: false })
      expect(channel.getConfig().enabled).toBe(false)
    })

    it('rejects invalid config', async () => {
      await channel.initialize({ enabled: true })
      await expect(channel.updateConfig({ rateLimitPerMinute: -1 })).rejects.toThrow()
    })
  })

  describe('validateConfig', () => {
    it('returns no errors for valid config', () => {
      const errors = channel.validateConfig({ enabled: true })
      expect(errors).toHaveLength(0)
    })

    it('returns error when enabled is missing', () => {
      const errors = channel.validateConfig({} as ChannelConfig)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('enabled')
    })
  })

  describe('onEvent', () => {
    it('registers an event handler', () => {
      const handler = vi.fn()
      channel.onEvent(handler)
      expect(() => channel.onEvent(handler)).not.toThrow()
    })
  })

  describe('processIncoming', () => {
    it('processes a simple text payload', async () => {
      const payload = { text: 'Hello world', conversationId: 'conv-1' }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('text')
      expect(messages[0]?.content.text).toBe('Hello world')
      expect(messages[0]?.metadata.conversationId).toBe('conv-1')
    })

    it('processes an image payload', async () => {
      const payload = { imageUrl: 'https://example.com/image.png', conversationId: 'conv-1' }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('image')
      expect(messages[0]?.content.imageUrl).toBe('https://example.com/image.png')
    })

    it('processes a location payload', async () => {
      const payload = { latitude: 40.7128, longitude: -74.006, locationName: 'NYC' }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('location')
      expect(messages[0]?.location?.latitude).toBe(40.7128)
      expect(messages[0]?.location?.longitude).toBe(-74.006)
    })

    it('processes a contact payload', async () => {
      const payload = { contact: { name: 'John Doe', phone: '+1234567890', email: 'john@example.com' } }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('contact')
      expect(messages[0]?.contact?.name).toBe('John Doe')
    })

    it('processes multiple messages in a batch', async () => {
      const payload = {
        messages: [
          { text: 'First message' },
          { text: 'Second message' },
        ],
      }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(2)
      expect(messages[0]?.content.text).toBe('First message')
      expect(messages[1]?.content.text).toBe('Second message')
    })

    it('extracts attachments, buttons, list options, and quick replies', async () => {
      const payload = {
        text: 'Choose an option',
        attachments: [
          { id: 'att-1', type: 'image', url: 'https://example.com/img.png', fileName: 'img.png', fileSizeBytes: 1000, mimeType: 'image/png' },
        ],
        buttons: [
          { id: 'btn-1', title: 'Click me', type: 'postback', value: 'clicked' },
        ],
        listOptions: [
          { id: 'opt-1', title: 'Option A', description: 'Description A' },
        ],
        quickReplies: [
          { id: 'qr-1', title: 'Yes', payload: 'yes' },
        ],
      }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.attachments).toHaveLength(1)
      expect(messages[0]?.buttons).toHaveLength(1)
      expect(messages[0]?.listOptions).toHaveLength(1)
      expect(messages[0]?.quickReplies).toHaveLength(1)
    })

    it('uses context for defaults', async () => {
      const ctx = createRequestContext({ requestId: 'req-456', userId: 'user-456' })
      const messages = await channel.processIncoming({ text: 'Hello' }, ctx)
      expect(messages[0]?.user.id).toBe('user-456')
    })
  })
})
