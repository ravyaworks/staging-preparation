import { describe, it, expect, beforeEach } from 'vitest'
import { EmailChannel } from '../channel'

describe('EmailChannel', () => {
  let channel: EmailChannel

  beforeEach(() => {
    channel = new EmailChannel()
  })

  it('initializes with default config', async () => {
    await channel.initialize({ enabled: true })
    expect(channel.getConfig().enabled).toBe(true)
    expect(channel.getConfig().customConfig?.provider).toBe('smtp')
  })

  it('initializes with custom config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: {
        provider: 'sendgrid',
        apiKey: 'test-key',
        fromAddress: 'test@example.com',
        fromName: 'Test Sender',
      },
    })
    const config = channel.getConfig()
    expect(config.customConfig?.provider).toBe('sendgrid')
    expect(config.customConfig?.fromAddress).toBe('test@example.com')
  })

  it('connects with valid config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: {
        provider: 'smtp',
        fromAddress: 'test@example.com',
        smtpHost: 'smtp.example.com',
      },
    })
    await channel.connect({ type: 'api_key' })
    const health = await channel.healthCheck()
    expect(health.healthy).toBe(true)
    expect(health.status).toBe('connected')
  })

  it('fails to connect without fromAddress', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'smtp', smtpHost: 'smtp.example.com' },
    })
    await expect(channel.connect({ type: 'api_key' })).rejects.toThrow('fromAddress is required')
  })

  it('fails to connect without smtpHost for smtp provider', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'smtp', fromAddress: 'test@example.com' },
    })
    await expect(channel.connect({ type: 'api_key' })).rejects.toThrow('SMTP requires smtpHost')
  })

  it('connects and disconnects', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'smtp', fromAddress: 'test@example.com', smtpHost: 'smtp.example.com' },
    })
    await channel.connect({ type: 'api_key' })
    await channel.disconnect()
    const health = await channel.healthCheck()
    expect(health.healthy).toBe(false)
    expect(health.status).toBe('disconnected')
  })

  it('returns correct type and display name', () => {
    expect(channel.type).toBe('email')
    expect(channel.displayName).toBe('Email')
    expect(channel.version).toBe('1.0.0')
  })

  it('returns capabilities from registry', () => {
    const caps = channel.getCapabilities()
    expect(caps.incoming).toContain('text')
    expect(caps.incoming).toContain('document')
    expect(caps.outgoing).toContain('text')
    expect(caps.supportsReplies).toBe(true)
    expect(caps.supportsThreads).toBe(true)
    expect(caps.supportsRichText).toBe(true)
  })

  it('validates config', () => {
    const errors = channel.validateConfig({} as any)
    expect(errors).toContain('enabled is required')
  })

  it('validates provider value', () => {
    const errors = channel.validateConfig({
      enabled: true,
      customConfig: { provider: 'invalid' },
    })
    expect(errors).toContain('provider must be sendgrid, ses, or smtp')
  })

  it('validates fromAddress is required', () => {
    const errors = channel.validateConfig({ enabled: true, customConfig: { provider: 'smtp' } })
    expect(errors).toContain('fromAddress is required')
  })

  it('throws when sending message while disconnected', async () => {
    await expect(channel.sendMessage({} as any)).rejects.toThrow('Channel not connected')
  })

  it('processes incoming email payload', async () => {
    const messages = await channel.processIncoming({
      id: 'email-1',
      subject: 'Test Subject',
      body: 'Hello from email',
      from: { name: 'John', address: 'john@example.com' },
      to: [{ name: 'Support', address: 'support@example.com' }],
      threadId: 'thread-1',
    }, { requestId: 'req-1', tenantId: 'tenant-1' })

    expect(messages).toHaveLength(1)
    expect(messages[0]?.metadata.channelType).toBe('email')
    expect(messages[0]?.user.email).toBe('john@example.com')
    expect(messages[0]?.content.text).toBe('Hello from email')
  })

  it('processes incoming email with attachments', async () => {
    const messages = await channel.processIncoming({
      id: 'email-2',
      subject: 'With Attachment',
      body: 'See attached',
      from: { address: 'sender@example.com' },
      to: [{ address: 'support@example.com' }],
      attachments: [
        { filename: 'report.pdf', content: 'base64', contentType: 'application/pdf', size: 1024 },
        { filename: 'photo.jpg', content: 'base64', contentType: 'image/jpeg', size: 2048 },
      ],
    }, { requestId: 'req-2', tenantId: 'tenant-1' })

    expect(messages[0]?.attachments).toHaveLength(2)
    expect(messages[0]?.attachments[0]?.fileName).toBe('report.pdf')
    expect(messages[0]?.attachments[1]?.type).toBe('image')
  })

  it('throws for invalid incoming email payload', async () => {
    await expect(channel.processIncoming({}, { requestId: 'test' })).rejects.toThrow('Invalid incoming email payload')
  })

  it('manages event handler', () => {
    const handler = async () => {}
    channel.onEvent(handler)
  })
})
