import { describe, it, expect, beforeEach } from 'vitest'
import { SmsChannel } from '../channel'

describe('SmsChannel', () => {
  let channel: SmsChannel

  beforeEach(() => {
    channel = new SmsChannel()
  })

  it('initializes with default config', async () => {
    await channel.initialize({ enabled: true })
    expect(channel.getConfig().enabled).toBe(true)
    expect(channel.getConfig().customConfig?.provider).toBe('twilio')
  })

  it('initializes with custom config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: {
        provider: 'vonage',
        authToken: 'test-token',
        fromNumber: '+1234567890',
      },
    })
    const config = channel.getConfig()
    expect(config.customConfig?.provider).toBe('vonage')
    expect(config.customConfig?.fromNumber).toBe('+1234567890')
  })

  it('connects with valid config', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: {
        provider: 'twilio',
        accountSid: 'test-sid',
        fromNumber: '+1234567890',
      },
    })
    await channel.connect({ type: 'api_key' })
    const health = await channel.healthCheck()
    expect(health.healthy).toBe(true)
    expect(health.status).toBe('connected')
  })

  it('fails to connect without fromNumber', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'twilio' },
    })
    await expect(channel.connect({ type: 'api_key' })).rejects.toThrow('fromNumber is required')
  })

  it('fails to connect without accountSid for twilio', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'twilio', fromNumber: '+1234567890' },
    })
    await expect(channel.connect({ type: 'api_key' })).rejects.toThrow('Twilio requires accountSid')
  })

  it('connects and disconnects', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'twilio', accountSid: 'test', fromNumber: '+1234567890' },
    })
    await channel.connect({ type: 'api_key' })
    await channel.disconnect()
    const health = await channel.healthCheck()
    expect(health.healthy).toBe(false)
    expect(health.status).toBe('disconnected')
  })

  it('returns correct type and display name', () => {
    expect(channel.type).toBe('sms')
    expect(channel.displayName).toBe('SMS')
    expect(channel.version).toBe('1.0.0')
  })

  it('returns capabilities from registry', () => {
    const caps = channel.getCapabilities()
    expect(caps.incoming).toContain('text')
    expect(caps.incoming).toContain('delivery_receipt')
    expect(caps.outgoing).toContain('text')
    expect(caps.outgoing).toContain('delivery_receipt')
    expect(caps.supportsReplies).toBe(true)
    expect(caps.supportsThreads).toBe(false)
    expect(caps.supportsRichText).toBe(false)
    expect(caps.maxMessageLength).toBe(1600)
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
    expect(errors).toContain('provider must be twilio, vonage, or custom')
  })

  it('validates fromNumber is required', () => {
    const errors = channel.validateConfig({ enabled: true, customConfig: { provider: 'twilio' } })
    expect(errors).toContain('fromNumber is required')
  })

  it('throws when sending message while disconnected', async () => {
    await expect(channel.sendMessage({} as any)).rejects.toThrow('Channel not connected')
  })

  it('throws when sending empty message', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'twilio', accountSid: 'test', fromNumber: '+1234567890' },
    })
    await channel.connect({ type: 'api_key' })
    await expect(channel.sendMessage({
      id: 'test',
      type: 'text',
      content: { type: 'text' },
      attachments: [],
      buttons: [],
      listOptions: [],
      quickReplies: [],
      metadata: {} as any,
      user: {} as any,
      conversation: {} as any,
      tenant: {} as any,
    })).rejects.toThrow('SMS message requires text content')
  })

  it('throws when message exceeds max length', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'twilio', accountSid: 'test', fromNumber: '+1234567890' },
    })
    await channel.connect({ type: 'api_key' })
    await expect(channel.sendMessage({
      id: 'test',
      type: 'text',
      content: { type: 'text', text: 'x'.repeat(1601) },
      attachments: [],
      buttons: [],
      listOptions: [],
      quickReplies: [],
      metadata: {} as any,
      user: {} as any,
      conversation: {} as any,
      tenant: {} as any,
    })).rejects.toThrow('exceeds maximum length')
  })

  it('processes incoming SMS webhook', async () => {
    const messages = await channel.processIncoming({
      MessageSid: 'SM123',
      From: '+1234567890',
      To: '+0987654321',
      Body: 'Hello from SMS',
    }, { requestId: 'req-1', tenantId: 'tenant-1' })

    expect(messages).toHaveLength(1)
    expect(messages[0]?.user.phone).toBe('+1234567890')
    expect(messages[0]?.content.text).toBe('Hello from SMS')
  })

  it('processes delivery receipts', async () => {
    const messages = await channel.processIncoming({
      MessageSid: 'SM123',
      MessageStatus: 'delivered',
      To: '+1234567890',
      From: '+0987654321',
    }, { requestId: 'req-1', tenantId: 'tenant-1' })

    expect(messages).toHaveLength(1)
    expect(messages[0]?.raw?.type).toBe('delivery_receipt')
    expect(messages[0]?.raw?.status).toBe('delivered')
  })

  it('throws for invalid SMS payload', async () => {
    await expect(channel.processIncoming({}, { requestId: 'test' })).rejects.toThrow('Invalid SMS webhook payload')
  })

  it('sends SMS via sendSms helper', async () => {
    await channel.initialize({
      enabled: true,
      customConfig: { provider: 'twilio', accountSid: 'test', fromNumber: '+1234567890' },
    })
    await channel.connect({ type: 'api_key' })

    const result = await channel.sendSms('+0987654321', 'Hello')
    expect(result.to).toBe('+0987654321')
    expect(result.from).toBe('+1234567890')
    expect(result.body).toBe('Hello')
    expect(result.status).toBe('queued')
  })

  it('manages event handler', () => {
    const handler = async () => {}
    channel.onEvent(handler)
  })
})
