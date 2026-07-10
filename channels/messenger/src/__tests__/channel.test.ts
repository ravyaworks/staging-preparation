import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MessengerChannel } from '../channel'
import type { ChannelConfig, ChannelAuthConfig, OutgoingMessage } from '@conversation-platform/channel-core'

describe('MessengerChannel', () => {
  let channel: MessengerChannel
  let validConfig: ChannelConfig
  let validAuth: ChannelAuthConfig

  beforeEach(() => {
    channel = new MessengerChannel()
    validConfig = {
      enabled: true,
      customConfig: {
        pageId: 'page-123',
        appSecret: 'app-secret-abc',
        accessToken: 'test-access-token',
        webhookVerifyToken: 'verify-token-123',
      },
    }
    validAuth = {
      type: 'bearer_token',
      credentials: { token: 'test-access-token' },
    }
  })

  describe('initialization', () => {
    it('should have correct type, displayName, and version', () => {
      expect(channel.type).toBe('messenger')
      expect(channel.displayName).toBe('Facebook Messenger')
      expect(channel.version).toBe('1.0.0')
    })

    it('should initialize with valid config', async () => {
      await channel.initialize(validConfig)
      const config = channel.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.customConfig?.pageId).toBe('page-123')
    })

    it('should initialize with persistentMenu from config', async () => {
      const configWithMenu: ChannelConfig = {
        enabled: true,
        customConfig: {
          pageId: 'page-123',
          appSecret: 'secret',
          accessToken: 'token',
          persistentMenu: [{
            locale: 'default',
            call_to_actions: [
              { title: 'Help', type: 'postback', payload: 'HELP' },
              { title: 'Contact', type: 'postback', payload: 'CONTACT' },
            ],
          }],
        },
      }
      await channel.initialize(configWithMenu)
      const config = channel.getConfig()
      expect(config.customConfig?.persistentMenu).toBeDefined()
    })
  })

  describe('connection', () => {
    it('should connect with valid auth', async () => {
      await channel.initialize(validConfig)
      await channel.connect(validAuth)
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.status).toBe('connected')
    })

    it('should throw on connect without pageId', async () => {
      await channel.initialize({ enabled: true, customConfig: { appSecret: 'secret' } })
      await expect(channel.connect(validAuth)).rejects.toThrow('pageId is required')
    })

    it('should throw on connect without appSecret', async () => {
      await channel.initialize({ enabled: true, customConfig: { pageId: 'page-123' } })
      await expect(channel.connect(validAuth)).rejects.toThrow('appSecret is required')
    })

    it('should disconnect cleanly', async () => {
      await channel.initialize(validConfig)
      await channel.connect(validAuth)
      await channel.disconnect()
      const health = await channel.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.status).toBe('disconnected')
    })
  })

  describe('sendMessage', () => {
    beforeEach(async () => {
      await channel.initialize(validConfig)
      await channel.connect(validAuth)
    })

    it('should throw when not connected', async () => {
      const disconnected = new MessengerChannel()
      const msg = createTestMessage('text')
      await expect(disconnected.sendMessage(msg)).rejects.toThrow('Channel not connected')
    })

    it('should send text message', async () => {
      const msg = createTestMessage('text')
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send image with attachment', async () => {
      const msg = createTestMessage('image', {}, [{
        id: 'att-1',
        type: 'image',
        url: 'https://example.com/img.jpg',
        fileName: 'img.jpg',
        fileSizeBytes: 1024,
        mimeType: 'image/jpeg',
      }])
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send button message', async () => {
      const msg = createTestMessage('button', { text: 'Choose option' }, [], [
        { id: 'btn-1', title: 'Option A', type: 'postback' },
        { id: 'btn-2', title: 'Option B', type: 'postback' },
      ])
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send message with quick replies', async () => {
      const msg = createTestMessage('text', { text: 'Select one' }, [], [], [], [
        { id: 'qr-1', title: 'Yes' },
        { id: 'qr-2', title: 'No' },
      ])
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })
  })

  describe('typing indicator and read receipts', () => {
    beforeEach(async () => {
      await channel.initialize(validConfig)
      await channel.connect(validAuth)
    })

    it('should send typing indicator', async () => {
      await expect(channel.sendTypingIndicator('conv-1', true, 'tenant-1')).resolves.toBeUndefined()
    })

    it('should send stop typing indicator', async () => {
      await expect(channel.sendTypingIndicator('conv-1', false, 'tenant-1')).resolves.toBeUndefined()
    })

    it('should mark message as read', async () => {
      await expect(channel.markAsRead('msg-1', 'conv-1', 'tenant-1')).resolves.toBeUndefined()
    })
  })

  describe('capabilities', () => {
    it('should return Messenger capabilities', () => {
      const caps = channel.getCapabilities()
      expect(caps.incoming).toContain('text')
      expect(caps.incoming).toContain('image')
      expect(caps.incoming).toContain('button')
      expect(caps.incoming).toContain('location')
      expect(caps.incoming).toContain('typing_indicator')
      expect(caps.incoming).toContain('delivery_receipt')
      expect(caps.incoming).toContain('read_receipt')
      expect(caps.outgoing).toContain('text')
      expect(caps.outgoing).toContain('image')
      expect(caps.outgoing).toContain('button')
      expect(caps.outgoing).toContain('quick_reply')
      expect(caps.supportsReplies).toBe(true)
      expect(caps.supportsThreads).toBe(true)
    })
  })

  describe('config validation', () => {
    it('should return no errors for valid config', () => {
      const errors = channel.validateConfig(validConfig)
      expect(errors).toHaveLength(0)
    })

    it('should return errors for missing enabled', () => {
      const errors = channel.validateConfig({ customConfig: {} } as ChannelConfig)
      expect(errors).toContain('enabled is required')
    })

    it('should return errors for missing pageId', () => {
      const errors = channel.validateConfig({ enabled: true, customConfig: { appSecret: 'secret' } } as ChannelConfig)
      expect(errors).toContain('pageId is required')
    })
  })

  describe('config management', () => {
    it('should update config partially', async () => {
      await channel.initialize(validConfig)
      await channel.updateConfig({ enabled: false })
      expect(channel.getConfig().enabled).toBe(false)
    })

    it('should update custom config', async () => {
      await channel.initialize(validConfig)
      await channel.updateConfig({
        customConfig: { accessToken: 'new-token' } as Record<string, unknown>,
      })
      expect(channel.getConfig().customConfig?.accessToken).toBe('***')
    })
  })

  describe('processIncoming', () => {
    it('should process text message', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload({
        sender: { id: 'sender-123' },
        recipient: { id: 'page-123' },
        timestamp: Date.now(),
        message: {
          mid: 'mid-123',
          text: 'Hello from Messenger!',
        },
      })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('text')
      expect(messages[0]?.content.text).toBe('Hello from Messenger!')
      expect(messages[0]?.user.id).toBe('sender-123')
    })

    it('should process image attachment', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload({
        sender: { id: 'sender-123' },
        recipient: { id: 'page-123' },
        timestamp: Date.now(),
        message: {
          mid: 'mid-456',
          attachments: [{
            type: 'image',
            payload: {
              url: 'https://example.com/img.jpg',
              id: 'att-1',
              mime_type: 'image/jpeg',
            },
          }],
        },
      })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.attachments).toHaveLength(1)
    })

    it('should process postback', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload({
        sender: { id: 'sender-123' },
        recipient: { id: 'page-123' },
        timestamp: Date.now(),
        postback: {
          mid: 'mid-789',
          title: 'Get Started',
          payload: 'GET_STARTED',
        },
      })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('button')
      expect(messages[0]?.buttons[0]?.id).toBe('GET_STARTED')
    })

    it('should process quick reply', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload({
        sender: { id: 'sender-123' },
        recipient: { id: 'page-123' },
        timestamp: Date.now(),
        message: {
          mid: 'mid-101',
          text: 'Yes',
          quick_reply: { payload: 'option_yes' },
        },
      })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.quickReplies).toHaveLength(1)
      expect(messages[0]?.quickReplies[0]?.id).toBe('option_yes')
    })

    it('should process read receipt', async () => {
      await channel.initialize(validConfig)
      const handler = vi.fn()
      channel.onEvent(handler)

      const payload = createWebhookPayload({
        sender: { id: 'sender-123' },
        recipient: { id: 'page-123' },
        timestamp: Date.now(),
        read: { mid: 'mid-read', watermark: Date.now() },
      })
      await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(handler).toHaveBeenCalled()
    })

    it('should process delivery receipt', async () => {
      await channel.initialize(validConfig)
      const handler = vi.fn()
      channel.onEvent(handler)

      const payload = createWebhookPayload({
        sender: { id: 'sender-123' },
        recipient: { id: 'page-123' },
        timestamp: Date.now(),
        delivery: { mids: ['mid-1', 'mid-2'], watermark: Date.now() },
      })
      await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(handler).toHaveBeenCalled()
    })

    it('should process echo messages', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload({
        sender: { id: 'sender-123' },
        recipient: { id: 'page-123' },
        timestamp: Date.now(),
        message: {
          mid: 'mid-echo',
          text: 'Echo',
          is_echo: true,
        },
      })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(0)
    })

    it('should return empty for invalid payload', async () => {
      await channel.initialize(validConfig)
      const messages = await channel.processIncoming({}, { requestId: 'req-1' })
      expect(messages).toHaveLength(0)
    })
  })

  describe('webhook verification', () => {
    beforeEach(async () => {
      await channel.initialize(validConfig)
    })

    it('should verify with correct token', () => {
      const result = channel.verifyWebhook('subscribe', 'verify-token-123', 'challenge-xyz')
      expect(result.verified).toBe(true)
      expect(result.challenge).toBe('challenge-xyz')
    })

    it('should not verify with incorrect token', () => {
      const result = channel.verifyWebhook('subscribe', 'wrong-token', 'challenge-xyz')
      expect(result.verified).toBe(false)
    })
  })

  describe('persistent menu', () => {
    it('should throw setPersistentMenu when not connected', async () => {
      await channel.initialize(validConfig)
      await expect(channel.setPersistentMenu([
        {
          locale: 'default',
          call_to_actions: [{ title: 'Help', type: 'postback', payload: 'HELP' }],
        },
      ])).rejects.toThrow('Channel not connected')
    })
  })

  describe('getProfile', () => {
    it('should return null when not connected', async () => {
      await channel.initialize(validConfig)
      const profile = await channel.getProfile('user-123')
      expect(profile).toBeNull()
    })
  })
})

function createTestMessage(
  type: OutgoingMessage['type'],
  content: Partial<OutgoingMessage['content']> = {},
  attachments: OutgoingMessage['attachments'] = [],
  buttons: OutgoingMessage['buttons'] = [],
  listOptions: OutgoingMessage['listOptions'] = [],
  quickReplies: OutgoingMessage['quickReplies'] = [],
): OutgoingMessage {
  return {
    id: `msg-${Date.now()}`,
    type,
    content: {
      type,
      text: content.text ?? 'Test message',
      ...content,
    },
    attachments,
    buttons,
    listOptions,
    quickReplies,
    metadata: {
      messageId: `msg-${Date.now()}`,
      conversationId: 'conv-1',
      channelType: 'messenger',
      timestamp: new Date().toISOString(),
      source: 'agent',
    },
    user: { id: 'user-1', name: 'Test User' },
    conversation: { id: 'conv-1', channelType: 'messenger' },
    tenant: { id: 'tenant-1' },
  }
}

function createWebhookPayload(messagingEvent: Record<string, unknown>): Record<string, unknown> {
  return {
    object: 'page',
    entry: [{
      id: 'page-123',
      time: Date.now(),
      messaging: [messagingEvent],
    }],
  }
}
