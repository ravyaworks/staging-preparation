import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WhatsAppChannel } from '../channel'
import type { ChannelConfig, ChannelAuthConfig, OutgoingMessage, IncomingMessage } from '@conversation-platform/channel-core'

describe('WhatsAppChannel', () => {
  let channel: WhatsAppChannel
  let validConfig: ChannelConfig
  let validAuth: ChannelAuthConfig

  beforeEach(() => {
    channel = new WhatsAppChannel()
    validConfig = {
      enabled: true,
      customConfig: {
        phoneNumberId: '123456789',
        businessAccountId: '987654321',
        apiVersion: 'v21.0',
        webhookVerifyToken: 'verify-token-123',
        appSecret: 'app-secret-abc',
      },
    }
    validAuth = {
      type: 'bearer_token',
      credentials: { token: 'test-access-token' },
    }
  })

  describe('initialization', () => {
    it('should have correct type, displayName, and version', () => {
      expect(channel.type).toBe('whatsapp')
      expect(channel.displayName).toBe('WhatsApp Business')
      expect(channel.version).toBe('1.0.0')
    })

    it('should initialize with valid config', async () => {
      await channel.initialize(validConfig)
      const config = channel.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.customConfig?.phoneNumberId).toBe('123456789')
    })

    it('should initialize with defaults for missing optional config', async () => {
      const minConfig: ChannelConfig = {
        enabled: true,
        customConfig: {
          phoneNumberId: '123456789',
          appSecret: 'secret',
        },
      }
      await channel.initialize(minConfig)
      const config = channel.getConfig()
      expect(config.customConfig?.apiVersion).toBe('v21.0')
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

    it('should throw on connect without phoneNumberId', async () => {
      await channel.initialize({ enabled: true, customConfig: { appSecret: 'secret' } })
      await expect(channel.connect(validAuth)).rejects.toThrow('phoneNumberId is required')
    })

    it('should throw on connect with invalid auth type', async () => {
      await channel.initialize(validConfig)
      await expect(channel.connect({ type: 'api_key' })).rejects.toThrow('Valid bearer_token or oauth2')
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
      const disconnected = new WhatsAppChannel()
      const msg = createTestMessage('text')
      await expect(disconnected.sendMessage(msg)).rejects.toThrow('Channel not connected')
    })

    it('should send text message', async () => {
      const msg = createTestMessage('text')
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send image message', async () => {
      const msg = createTestMessage('image', { imageUrl: 'https://example.com/img.png' }, [{
        id: 'att-1',
        type: 'image',
        url: 'https://example.com/img.png',
        fileName: 'img.png',
        fileSizeBytes: 1024,
        mimeType: 'image/png',
      }])
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send document message', async () => {
      const msg = createTestMessage('document', {}, [{
        id: 'att-1',
        type: 'document',
        url: 'https://example.com/doc.pdf',
        fileName: 'doc.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
      }])
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send button message', async () => {
      const msg = createTestMessage('button', { text: 'Choose option' }, [], [
        { id: 'btn-1', title: 'Option 1', type: 'quick_reply' },
        { id: 'btn-2', title: 'Option 2', type: 'quick_reply' },
      ])
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send list message', async () => {
      const msg = createTestMessage('list', { text: 'Select option' }, [], [], [
        { id: 'opt-1', title: 'First', description: 'First option' },
        { id: 'opt-2', title: 'Second', description: 'Second option' },
      ])
      const result = await channel.sendMessage(msg)
      expect(result).toBeTruthy()
    })

    it('should send location message', async () => {
      const msg = createTestMessage('location')
      msg.location = { latitude: 37.7749, longitude: -122.4194, name: 'San Francisco' }
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

    it('should mark message as read', async () => {
      await expect(channel.markAsRead('msg-1', 'conv-1', 'tenant-1')).resolves.toBeUndefined()
    })

    it('should throw typing indicator when not connected', async () => {
      const disconnected = new WhatsAppChannel()
      await expect(disconnected.sendTypingIndicator('conv-1', true, 'tenant-1')).rejects.toThrow('Channel not connected')
    })
  })

  describe('capabilities', () => {
    it('should return WhatsApp capabilities', () => {
      const caps = channel.getCapabilities()
      expect(caps.incoming).toContain('text')
      expect(caps.incoming).toContain('image')
      expect(caps.incoming).toContain('location')
      expect(caps.incoming).toContain('contact')
      expect(caps.outgoing).toContain('template')
      expect(caps.outgoing).toContain('interactive')
      expect(caps.supportsReplies).toBe(true)
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

    it('should return errors for missing phoneNumberId', () => {
      const errors = channel.validateConfig({ enabled: true, customConfig: { appSecret: 'secret' } } as ChannelConfig)
      expect(errors).toContain('phoneNumberId is required')
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
        customConfig: { apiVersion: 'v22.0' } as Record<string, unknown>,
      })
      expect(channel.getConfig().customConfig?.apiVersion).toBe('v22.0')
    })
  })

  describe('processIncoming', () => {
    it('should process text message webhook payload', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload('text', { body: 'Hello!' })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('text')
      expect(messages[0]?.content.text).toBe('Hello!')
      expect(messages[0]?.user.id).toBe('12345')
    })

    it('should process image message webhook payload', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload('image', { id: 'img-1', mime_type: 'image/png', sha256: 'abc' })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.type).toBe('image')
    })

    it('should process location message webhook payload', async () => {
      await channel.initialize(validConfig)
      const payload = createWebhookPayload('location', { latitude: 37.7749, longitude: -122.4194 })
      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.location?.latitude).toBe(37.7749)
    })

    it('should handle message statuses', async () => {
      await channel.initialize(validConfig)
      const handler = vi.fn()
      channel.onEvent(handler)

      const payload: Record<string, unknown> = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123456789' },
              statuses: [{
                id: 'status-1',
                recipient_id: '5551234567',
                status: 'delivered',
                timestamp: String(Math.floor(Date.now() / 1000)),
              }],
            },
          }],
        }],
      }

      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(0)
      expect(handler).toHaveBeenCalled()
    })

    it('should handle interactive button reply', async () => {
      await channel.initialize(validConfig)
      const payload: Record<string, unknown> = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123456789' },
              contacts: [{ profile: { name: 'John' }, wa_id: '12345' }],
              messages: [{
                from: '12345',
                id: 'msg-123',
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: 'interactive',
                interactive: {
                  type: 'button_reply',
                  button_reply: { id: 'btn-1', title: 'Option A' },
                },
              }],
            },
          }],
        }],
      }

      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.buttons).toHaveLength(1)
      expect(messages[0]?.buttons[0]?.id).toBe('btn-1')
    })

    it('should handle interactive list reply', async () => {
      await channel.initialize(validConfig)
      const payload: Record<string, unknown> = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123456789' },
              contacts: [{ profile: { name: 'John' }, wa_id: '12345' }],
              messages: [{
                from: '12345',
                id: 'msg-456',
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: 'interactive',
                interactive: {
                  type: 'list_reply',
                  list_reply: { id: 'opt-1', title: 'Selected Option', description: 'Desc' },
                },
              }],
            },
          }],
        }],
      }

      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.quickReplies).toHaveLength(1)
      expect(messages[0]?.quickReplies[0]?.id).toBe('opt-1')
    })

    it('should process contacts', async () => {
      await channel.initialize(validConfig)
      const payload: Record<string, unknown> = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123456789' },
              contacts: [{ profile: { name: 'John' }, wa_id: '12345' }],
              messages: [{
                from: '12345',
                id: 'msg-789',
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: 'contacts',
                contacts: [{
                  name: { formatted_name: 'John', first_name: 'John' },
                  phones: [{ phone: '15551234567', type: 'CELL' }],
                }],
              }],
            },
          }],
        }],
      }

      const messages = await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(messages).toHaveLength(1)
      expect(messages[0]?.contact?.name).toBe('John')
    })

    it('should return empty for invalid payload', async () => {
      await channel.initialize(validConfig)
      const messages = await channel.processIncoming({}, { requestId: 'req-1' })
      expect(messages).toHaveLength(0)
    })
  })

  describe('webhook verification', () => {
    it('should verify with correct token', () => {
      channel['config'] = {
        enabled: true,
        phoneNumberId: '123',
        businessAccountId: '456',
        apiVersion: 'v21.0',
        webhookVerifyToken: 'my-verify-token',
        appSecret: 'secret',
      }
      const result = channel.verifyWebhook('subscribe', 'my-verify-token', 'challenge-123')
      expect(result.verified).toBe(true)
      expect(result.challenge).toBe('challenge-123')
    })

    it('should not verify with incorrect token', () => {
      channel['config'] = {
        enabled: true,
        phoneNumberId: '123',
        businessAccountId: '456',
        apiVersion: 'v21.0',
        webhookVerifyToken: 'my-verify-token',
        appSecret: 'secret',
      }
      const result = channel.verifyWebhook('subscribe', 'wrong-token', 'challenge-123')
      expect(result.verified).toBe(false)
    })
  })

  describe('event handler', () => {
    it('should emit events on incoming messages', async () => {
      await channel.initialize(validConfig)
      const handler = vi.fn()
      channel.onEvent(handler)

      const payload = createWebhookPayload('text', { body: 'Test' })
      await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(handler).toHaveBeenCalled()
      expect(handler.mock.calls[0]?.[0]?.type).toBe('message_received')
    })

    it('should emit events on status updates', async () => {
      await channel.initialize(validConfig)
      const handler = vi.fn()
      channel.onEvent(handler)

      const payload: Record<string, unknown> = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123456789' },
              statuses: [{
                id: 'status-1',
                recipient_id: '5551234567',
                status: 'read',
                timestamp: String(Math.floor(Date.now() / 1000)),
              }],
            },
          }],
        }],
      }

      await channel.processIncoming(payload, {
        requestId: 'req-1',
        tenantId: 'tenant-1',
      })
      expect(handler).toHaveBeenCalled()
      const eventType = handler.mock.calls[0]?.[0]?.type
      expect(eventType).toBe('message_read')
    })
  })
})

function createTestMessage(
  type: OutgoingMessage['type'],
  content: Partial<OutgoingMessage['content']> = {},
  attachments: OutgoingMessage['attachments'] = [],
  buttons: OutgoingMessage['buttons'] = [],
  listOptions: OutgoingMessage['listOptions'] = [],
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
    quickReplies: [],
    metadata: {
      messageId: `msg-${Date.now()}`,
      conversationId: 'conv-1',
      channelType: 'whatsapp',
      timestamp: new Date().toISOString(),
      source: 'agent',
    },
    user: { id: 'user-1', name: 'Test User' },
    conversation: { id: 'conv-1', channelType: 'whatsapp' },
    tenant: { id: 'tenant-1' },
  }
}

function createWebhookPayload(messageType: string, messageContent: Record<string, unknown>): Record<string, unknown> {
  const message: Record<string, unknown> = {
    from: '12345',
    id: `wa-${Date.now()}`,
    timestamp: String(Math.floor(Date.now() / 1000)),
    type: messageType,
  }

  if (messageType === 'text') {
    message.text = messageContent
  } else if (messageType === 'image') {
    message.image = messageContent
  } else if (messageType === 'location') {
    message.location = messageContent
  } else if (messageType === 'contacts') {
    message.contacts = messageContent.contacts
  } else {
    message[messageType] = messageContent
  }

  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: '123',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '15551234567',
            phone_number_id: '123456789',
          },
          contacts: [{ profile: { name: 'John' }, wa_id: '12345' }],
          messages: [message],
        },
      }],
    }],
  }
}
