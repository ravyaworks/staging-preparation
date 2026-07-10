import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CustomChannel } from '../channel'
import type { CustomChannelConfig, CustomParserFunction } from '../types'
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

describe('CustomChannel', () => {
  let channel: CustomChannel

  beforeEach(() => {
    channel = new CustomChannel()
  })

  describe('initialize', () => {
    it('initializes with valid config', async () => {
      const config: CustomChannelConfig = { enabled: true, channelName: 'My Integration' }
      await expect(channel.initialize(config)).resolves.toBeUndefined()
      expect(channel.getConfig().enabled).toBe(true)
    })

    it('throws when channelName is missing', async () => {
      const config = { enabled: true } as CustomChannelConfig
      await expect(channel.initialize(config)).rejects.toThrow()
    })

    it('throws when channelName is empty', async () => {
      const config: CustomChannelConfig = { enabled: true, channelName: '' }
      await expect(channel.initialize(config)).rejects.toThrow()
    })
  })

  describe('connect / disconnect', () => {
    it('connects and disconnects', async () => {
      await channel.initialize({ enabled: true, channelName: 'My Integration' } as CustomChannelConfig)
      await channel.connect({ type: 'api_key' })
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(true)

      await channel.disconnect()
      const healthAfter = await channel.healthCheck()
      expect(healthAfter.healthy).toBe(false)
    })
  })

  describe('healthCheck', () => {
    it('returns healthy when connected', async () => {
      await channel.initialize({ enabled: true, channelName: 'Test' } as CustomChannelConfig)
      await channel.connect({ type: 'bearer_token' })
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.version).toBe('1.0.0')
    })

    it('returns unhealthy when not connected', async () => {
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.status).toBe('disconnected')
    })
  })

  describe('sendMessage', () => {
    it('sends a message when connected', async () => {
      await channel.initialize({ enabled: true, channelName: 'Test' } as CustomChannelConfig)
      await channel.connect({ type: 'api_key' })
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
          channelType: 'custom',
          timestamp: new Date().toISOString(),
          source: 'bot',
        },
        user: { id: 'user-1' },
        conversation: { id: 'conv-1', channelType: 'custom' },
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
      await channel.initialize({ enabled: true, channelName: 'Test' } as CustomChannelConfig)
      await channel.connect({ type: 'api_key' })
      await expect(channel.sendTypingIndicator('conv-1', true, 'tenant-1')).resolves.toBeUndefined()
    })

    it('throws when not connected', async () => {
      await expect(channel.sendTypingIndicator('conv-1', true, 'tenant-1')).rejects.toThrow()
    })
  })

  describe('markAsRead', () => {
    it('marks message as read', async () => {
      await channel.initialize({ enabled: true, channelName: 'Test' } as CustomChannelConfig)
      await channel.connect({ type: 'api_key' })
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
      await channel.initialize({ enabled: true, channelName: 'Test' } as CustomChannelConfig)
      await channel.updateConfig({ enabled: false })
      expect(channel.getConfig().enabled).toBe(false)
    })

    it('rejects when removing channelName', async () => {
      await channel.initialize({ enabled: true, channelName: 'Test' } as CustomChannelConfig)
      await expect(channel.updateConfig({ channelName: '' } as unknown as Partial<ChannelConfig>)).rejects.toThrow()
    })
  })

  describe('validateConfig', () => {
    it('returns no errors for valid config', () => {
      const errors = channel.validateConfig({ enabled: true, channelName: 'Test' } as CustomChannelConfig)
      expect(errors).toHaveLength(0)
    })

    it('returns error when channelName is missing', () => {
      const errors = channel.validateConfig({ enabled: true } as ChannelConfig)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('returns error for invalid authType', () => {
      const errors = channel.validateConfig({
        enabled: true,
        channelName: 'Test',
        authType: 'invalid',
      } as unknown as ChannelConfig)
      expect(errors.length).toBeGreaterThan(0)
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
      const payload = { text: 'Hello', conversationId: 'conv-1' }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('text')
      expect(messages[0]?.content.text).toBe('Hello')
    })

    it('processes an image payload', async () => {
      const payload = { imageUrl: 'https://example.com/img.png' }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('image')
    })

    it('processes location payload', async () => {
      const payload = { latitude: 40.7128, longitude: -74.006 }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('location')
    })

    it('processes contact payload', async () => {
      const payload = { contact: { name: 'Jane Doe' } }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('contact')
      expect(messages[0]?.contact?.name).toBe('Jane Doe')
    })

    it('uses custom parser when provided', async () => {
      const customParser: CustomParserFunction = (raw) => {
        const inner = raw.data as Record<string, unknown> | undefined
        if (inner) {
          return {
            text: inner.message,
            conversationId: inner.convId,
            userId: inner.sender,
          }
        }
        return raw
      }

      const channelWithParser = new CustomChannel(undefined, customParser)
      const payload = { data: { message: 'Custom parsed!', convId: 'conv-1', sender: 'user-2' } }
      const messages = await channelWithParser.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.content.text).toBe('Custom parsed!')
      expect(messages[0]?.user.id).toBe('user-2')
    })

    it('extracts rich message components', async () => {
      const payload = {
        text: 'Pick one',
        attachments: [{ id: 'a1', type: 'file', url: 'https://example.com/doc.pdf', fileName: 'doc.pdf', fileSizeBytes: 5000, mimeType: 'application/pdf' }],
        buttons: [{ id: 'b1', title: 'Go', type: 'url', value: 'https://example.com' }],
        quickReplies: [{ id: 'q1', title: 'OK', payload: 'ok' }],
      }
      const messages = await channel.processIncoming(payload, createRequestContext())
      expect(messages).toHaveLength(1)
      expect(messages[0]?.attachments).toHaveLength(1)
      expect(messages[0]?.buttons).toHaveLength(1)
      expect(messages[0]?.quickReplies).toHaveLength(1)
    })

    it('handles custom parser returning an array', async () => {
      const customParser: CustomParserFunction = () => [
        { text: 'First' },
        { text: 'Second' },
      ]

      const channelWithParser = new CustomChannel(undefined, customParser)
      const messages = await channelWithParser.processIncoming({}, createRequestContext())
      expect(messages).toHaveLength(2)
      expect(messages[0]?.content.text).toBe('First')
      expect(messages[1]?.content.text).toBe('Second')
    })
  })
})
