import { describe, it, expect, beforeEach } from 'vitest'
import { WebsiteChannel } from '../channel'

describe('WebsiteChannel', () => {
  let channel: WebsiteChannel

  beforeEach(() => {
    channel = new WebsiteChannel()
  })

  it('initializes with default config', async () => {
    await channel.initialize({ enabled: true })
    expect(channel.getConfig().enabled).toBe(true)
  })

  it('connects and disconnects', async () => {
    await channel.initialize({ enabled: true })
    await channel.connect({ type: 'api_key' })
    const health = await channel.healthCheck()
    expect(health.healthy).toBe(true)
    expect(health.status).toBe('connected')

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
    const errors = channel.validateConfig({} as any)
    expect(errors).toContain('enabled is required')
  })

  it('manages sessions', () => {
    const session = channel.createSession('visitor-1', 'conv-1', 'tenant-1')
    expect(session.isActive).toBe(true)
    expect(channel.getSession(session.id)).toBeDefined()

    channel.endSession(session.id)
    expect(channel.getSession(session.id)?.isActive).toBe(false)
  })
})
