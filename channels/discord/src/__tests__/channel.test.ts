import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DiscordChannel } from '../channel'

describe('DiscordChannel', () => {
  let channel: DiscordChannel

  beforeEach(() => {
    channel = new DiscordChannel()
  })

  it('initializes with default config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'discord-token', applicationId: 'app-123', publicKey: 'key-456' },
    })
    expect(channel.getConfig().enabled).toBe(true)
  })

  it('throws on initialize without botToken', async () => {
    await expect(
      channel.initialize({
        enabled: true,
        customConfig: { applicationId: 'app-123', publicKey: 'key-456' },
      }),
    ).rejects.toThrow()
  })

  it('throws on initialize without applicationId', async () => {
    await expect(
      channel.initialize({
        enabled: true,
        customConfig: { botToken: 'discord-token', publicKey: 'key-456' },
      }),
    ).rejects.toThrow()
  })

  it('connects and disconnects', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'discord-token', applicationId: 'app-123', publicKey: 'key-456' },
    })
    await channel.connect({ type: 'bearer_token', credentials: { token: 'discord-token' } })
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
    expect(errors).toContain('applicationId is required')
    expect(errors).toContain('publicKey is required')
  })

  it('processes incoming INTERACTION_CREATE (slash command)', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'discord-token', applicationId: 'app-123', publicKey: 'key-456' },
    })
    const messages = await channel.processIncoming(
      {
        id: 'interaction-1',
        application_id: 'app-123',
        type: 2,
        data: {
          id: 'cmd-1',
          name: 'greet',
          options: [{ name: 'name', type: 3, value: 'World' }],
        },
        guild_id: 'guild-1',
        channel_id: 'channel-1',
        member: {
          user: { id: 'user-1', username: 'TestUser', discriminator: '0000' },
          roles: [],
          joined_at: '2024-01-01T00:00:00Z',
          deaf: false,
          mute: false,
        },
        token: 'interaction-token',
        version: 1,
      },
      { requestId: 'req-1', tenantId: 'tenant-1' },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.content.text).toBe('/greet World')
    expect(messages[0]?.user.id).toBe('user-1')
    expect(messages[0]?.conversation.channelConversationId).toBe('channel-1')
  })

  it('processes incoming MESSAGE_CREATE', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'discord-token', applicationId: 'app-123', publicKey: 'key-456' },
    })
    const messages = await channel.processIncoming(
      {
        id: 'msg-1',
        channel_id: 'channel-1',
        author: { id: 'user-2', username: 'AnotherUser', discriminator: '1234' },
        content: 'Hello from Discord',
        timestamp: new Date().toISOString(),
        tts: false,
        mention_everyone: false,
        mentions: [],
        attachments: [],
        embeds: [],
      },
      { requestId: 'req-2', tenantId: 'tenant-1' },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.content.text).toBe('Hello from Discord')
    expect(messages[0]?.user.id).toBe('user-2')
    expect(messages[0]?.conversation.channelConversationId).toBe('channel-1')
  })

  it('skips bot messages in MESSAGE_CREATE', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'discord-token', applicationId: 'app-123', publicKey: 'key-456' },
    })
    const messages = await channel.processIncoming(
      {
        id: 'msg-2',
        channel_id: 'channel-1',
        author: { id: 'bot-1', username: 'Botty', discriminator: '0000', bot: true },
        content: 'I am a bot',
        timestamp: new Date().toISOString(),
        tts: false,
        mention_everyone: false,
        mentions: [],
        attachments: [],
        embeds: [],
      },
      { requestId: 'req-3' },
    )
    expect(messages).toHaveLength(0)
  })

  it('throws on sendMessage when not connected', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'discord-token', applicationId: 'app-123', publicKey: 'key-456' },
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
        channelType: 'discord' as const,
        timestamp: new Date().toISOString(),
        source: 'bot' as const,
      },
      user: { id: 'user-1' },
      conversation: { id: 'channel-1', channelType: 'discord' as const },
      tenant: { id: 'tenant-1' },
    }
    await expect(channel.sendMessage(message)).rejects.toThrow('Channel not connected')
  })

  it('updates config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { botToken: 'discord-token', applicationId: 'app-123', publicKey: 'key-456' },
    })
    await channel.updateConfig({
      enabled: false,
      customConfig: { botToken: 'new-token' },
    })
    const config = channel.getConfig()
    expect(config.enabled).toBe(false)
  })
})
