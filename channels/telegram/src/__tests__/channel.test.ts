import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TelegramChannel } from '../channel'

describe('TelegramChannel', () => {
  let channel: TelegramChannel

  beforeEach(() => {
    channel = new TelegramChannel()
  })

  it('initializes with default config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'test-token' },
    })
    expect(channel.getConfig().enabled).toBe(true)
  })

  it('throws on initialize without botToken', async () => {
    await expect(channel.initialize({ enabled: true })).rejects.toThrow()
  })

  it('connects and disconnects', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'test-token' },
    })
    await channel.connect({ type: 'bearer_token', credentials: { token: 'test-token' } })
    const health = await channel.healthCheck()
    expect(health.status).toBe('connected')
    expect(health.healthy).toBe(true)

    await channel.disconnect()
    const health2 = await channel.healthCheck()
    expect(health2.healthy).toBe(false)
    expect(health2.status).toBe('disconnected')
  })

  it('returns capabilities', () => {
    const caps = channel.getCapabilities()
    expect(caps.incoming).toContain('text')
    expect(caps.outgoing).toContain('text')
    expect(caps.supportsRichText).toBe(true)
  })

  it('validates config', () => {
    const errors = channel.validateConfig({ enabled: true } as any)
    expect(errors).toContain('botToken is required')
  })

  it('validates config requires enabled', () => {
    const errors = channel.validateConfig({} as any)
    expect(errors).toContain('enabled is required')
  })

  it('updates config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'token-1' },
    })
    await channel.updateConfig({
      enabled: false,
      customConfig: { botToken: 'token-2' },
    })
    const config = channel.getConfig()
    expect(config.enabled).toBe(false)
  })

  it('processes incoming message update', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'test-token' },
    })
    const messages = await channel.processIncoming(
      {
        update_id: 12345,
        message: {
          message_id: 100,
          from: { id: 98765, is_bot: false, first_name: 'Test' },
          chat: { id: -123456, type: 'group', title: 'Test Group' },
          date: Math.floor(Date.now() / 1000),
          text: 'Hello from Telegram',
        },
      },
      { requestId: 'req-1', tenantId: 'tenant-1' },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.content.text).toBe('Hello from Telegram')
    expect(messages[0]?.user.id).toBe('98765')
    expect(messages[0]?.conversation.channelConversationId).toBe('-123456')
  })

  it('processes incoming callback_query update', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'test-token' },
    })
    const messages = await channel.processIncoming(
      {
        update_id: 12346,
        callback_query: {
          id: 'callback-1',
          from: { id: 98765, is_bot: false, first_name: 'Test' },
          message: {
            message_id: 200,
            from: { id: 12345, is_bot: true, first_name: 'Bot' },
            chat: { id: -123456, type: 'group', title: 'Test Group' },
            date: Math.floor(Date.now() / 1000),
            text: 'Click me',
          },
          chat_instance: 'instance-1',
          data: 'button_clicked',
        },
      },
      { requestId: 'req-2', tenantId: 'tenant-1' },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.type).toBe('button')
  })

  it('returns empty for unknown update type', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'test-token' },
    })
    const messages = await channel.processIncoming(
      { update_id: 99999 },
      { requestId: 'req-3' },
    )
    expect(messages).toHaveLength(0)
  })

  it('throws on sendMessage when not connected', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'test-token' },
    })
    const message = {
      id: 'msg-1',
      type: 'text' as const,
      content: { type: 'text' as const, text: 'Hello' },
      attachments: [],
      buttons: [],
      listOptions: [],
      quickReplies: [],
      metadata: {
        messageId: 'msg-1',
        conversationId: 'conv-1',
        channelType: 'telegram' as const,
        timestamp: new Date().toISOString(),
        source: 'bot' as const,
      },
      user: { id: 'user-1' },
      conversation: { id: 'conv-1', channelType: 'telegram' as const },
      tenant: { id: 'tenant-1' },
    }
    await expect(channel.sendMessage(message)).rejects.toThrow('Channel not connected')
  })
})
