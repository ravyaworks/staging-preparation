import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SlackChannel } from '../channel'

describe('SlackChannel', () => {
  let channel: SlackChannel

  beforeEach(() => {
    channel = new SlackChannel()
  })

  it('initializes with default config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'xoxb-test', signingSecret: 'secret-123' },
    })
    expect(channel.getConfig().enabled).toBe(true)
  })

  it('throws on initialize without botToken', async () => {
    await expect(
      channel.initialize({
        enabled: true,
        customConfig: { signingSecret: 'secret-123' },
      }),
    ).rejects.toThrow()
  })

  it('throws on initialize without signingSecret', async () => {
    await expect(
      channel.initialize({
        enabled: true,
        customConfig: { botToken: 'xoxb-test' },
      }),
    ).rejects.toThrow()
  })

  it('connects and disconnects', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'xoxb-test', signingSecret: 'secret-123' },
    })
    await channel.connect({ type: 'bearer_token', credentials: { token: 'xoxb-test' } })
    const health = await channel.healthCheck()
    expect(health.healthy).toBe(false)

    await channel.disconnect()
    const health2 = await channel.healthCheck()
    expect(health2.healthy).toBe(false)
    expect(health2.status).toBe('disconnected')
  })

  it('returns capabilities', () => {
    const caps = channel.getCapabilities()
    expect(caps.incoming).toContain('text')
    expect(caps.outgoing).toContain('text')
    expect(caps.supportsThreads).toBe(true)
    expect(caps.supportsRichText).toBe(true)
  })

  it('validates config', () => {
    const errors = channel.validateConfig({ enabled: true } as any)
    expect(errors).toContain('botToken is required')
    expect(errors).toContain('signingSecret is required')
  })

  it('processes incoming event_callback', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'xoxb-test', signingSecret: 'secret-123' },
    })
    const messages = await channel.processIncoming(
      {
        type: 'event_callback',
        team_id: 'T001',
        api_app_id: 'A001',
        event: {
          type: 'message',
          channel: 'C001',
          user: 'U001',
          text: 'Hello from Slack',
          ts: '1234567890.123456',
        },
      },
      { requestId: 'req-1', tenantId: 'tenant-1' },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.content.text).toBe('Hello from Slack')
    expect(messages[0]?.user.id).toBe('U001')
    expect(messages[0]?.conversation.channelConversationId).toBe('C001')
  })

  it('processes url_verification without returning messages', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'xoxb-test', signingSecret: 'secret-123' },
    })
    const messages = await channel.processIncoming(
      {
        type: 'url_verification',
        challenge: '3eZbrw1aBm2rZgRNFdxV',
        team_id: 'T001',
        api_app_id: 'A001',
      },
      { requestId: 'req-2' },
    )
    expect(messages).toHaveLength(0)
  })

  it('processes slash command payload', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'xoxb-test', signingSecret: 'secret-123' },
    })
    const messages = await channel.processIncoming(
      {
        type: 'slash_command',
        token: 'token-123',
        team_id: 'T001',
        team_domain: 'test',
        channel_id: 'C001',
        channel_name: 'general',
        user_id: 'U001',
        user_name: 'testuser',
        command: '/hello',
        text: 'world',
        api_app_id: 'A001',
        response_url: 'https://hooks.slack.com/respond',
        trigger_id: 'trigger-123',
      },
      { requestId: 'req-3', tenantId: 'tenant-1' },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.content.text).toBe('/hello world')
    expect(messages[0]?.user.id).toBe('U001')
  })

  it('throws on sendMessage when not connected', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'xoxb-test', signingSecret: 'secret-123' },
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
        channelType: 'slack' as const,
        timestamp: new Date().toISOString(),
        source: 'bot' as const,
      },
      user: { id: 'user-1' },
      conversation: { id: 'C001', channelType: 'slack' as const },
      tenant: { id: 'tenant-1' },
    }
    await expect(channel.sendMessage(message)).rejects.toThrow('Channel not connected')
  })

  it('updates config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'xoxb-test', signingSecret: 'secret-123' },
    })
    await channel.updateConfig({
      enabled: false,
      customConfig: { botToken: 'xoxb-new' },
    })
    const config = channel.getConfig()
    expect(config.enabled).toBe(false)
  })
})
