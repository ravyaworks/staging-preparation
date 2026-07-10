import { describe, it, expect, beforeEach } from 'vitest'
import { TeamsChannel } from '../channel'

describe('TeamsChannel', () => {
  let channel: TeamsChannel

  beforeEach(() => {
    channel = new TeamsChannel()
  })

  it('initializes with default config', async () => {
    await channel.initialize({ enabled: true })
    expect(channel.getConfig().enabled).toBe(true)
  })

  it('initializes with custom config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: {
        botId: 'test-bot',
        tenantId: 'test-tenant',
        appId: 'test-app',
        appPassword: 'test-password',
        enableAdaptiveCards: true,
      },
    })
    const config = channel.getConfig()
    expect(config.enabled).toBe(true)
    expect(config.customConfig?.botId).toBe('test-bot')
  })

  it('connects and disconnects', async () => {
    await channel.initialize({ enabled: true, customConfig: { appId: 'test', appPassword: 'test', tenantId: 'test' } })
    await expect(channel.connect({ type: 'oauth2' })).rejects.toThrow()
  })

  it('returns correct type and display name', () => {
    expect(channel.type).toBe('teams')
    expect(channel.displayName).toBe('Microsoft Teams')
    expect(channel.version).toBe('1.0.0')
  })

  it('returns capabilities from registry', () => {
    const caps = channel.getCapabilities()
    expect(caps.incoming).toContain('text')
    expect(caps.incoming).toContain('adaptive_card')
    expect(caps.outgoing).toContain('text')
    expect(caps.outgoing).toContain('adaptive_card')
    expect(caps.supportsReplies).toBe(true)
    expect(caps.supportsThreads).toBe(true)
    expect(caps.supportsRichText).toBe(true)
  })

  it('validates config', () => {
    const errors = channel.validateConfig({} as any)
    expect(errors).toContain('enabled is required')
  })

  it('requires botId or appId in config', () => {
    const errors = channel.validateConfig({ enabled: true })
    expect(errors).toContain('botId or appId is required')
  })

  it('requires appPassword when appId is provided', () => {
    const errors = channel.validateConfig({
      enabled: true,
      customConfig: { appId: 'test-app' },
    })
    expect(errors).toContain('appPassword is required when appId is provided')
  })

  it('throws when sending message while disconnected', async () => {
    await expect(channel.sendMessage({} as any)).rejects.toThrow('Channel not connected')
  })

  it('throws on processIncoming with not implemented', async () => {
    await expect(channel.processIncoming({}, { requestId: 'test' })).rejects.toThrow('not implemented')
  })

  it('manages event handler', () => {
    const handler = async () => {}
    channel.onEvent(handler)
  })

  it('updates config', async () => {
    await channel.initialize({ enabled: true, customConfig: { botId: 'old-bot' } })
    await channel.updateConfig({
      enabled: false,
      customConfig: { botId: 'new-bot' },
    })
    expect(channel.getConfig().enabled).toBe(false)
    expect(channel.getConfig().customConfig?.botId).toBe('new-bot')
  })
})
