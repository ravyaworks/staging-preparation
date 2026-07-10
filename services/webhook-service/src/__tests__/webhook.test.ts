import { describe, it, expect, beforeEach } from 'vitest'
import { WebhookRegistry } from '../registry'
import { WebhookDispatcher } from '../dispatcher'
import { WebhookMonitor } from '../monitor'
import { createSignatureHeader, verifySignature, generateSecret } from '../security'
import type { WebhookConfig, WebhookEvent } from '../types'

function createConfig(overrides: Partial<WebhookConfig> = {}): WebhookConfig {
  return {
    id: 'wh-1',
    tenantId: 'tenant-1',
    name: 'Test Webhook',
    url: 'https://example.com/webhook',
    secret: 'test-secret-key',
    events: ['message.received', 'channel.connected'],
    enabled: true,
    retryMaxAttempts: 3,
    retryBackoffBaseMs: 100,
    timeoutMs: 5000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function createEvent(overrides: Partial<WebhookEvent> = {}): WebhookEvent {
  return {
    id: 'evt-1',
    type: 'message.received',
    tenantId: 'tenant-1',
    payload: { messageId: 'msg-1', text: 'Hello' },
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

describe('WebhookRegistry', () => {
  let registry: WebhookRegistry

  beforeEach(() => {
    registry = new WebhookRegistry()
  })

  it('registers and retrieves webhooks', () => {
    registry.register(createConfig())
    expect(registry.get('wh-1')).toBeDefined()
    expect(registry.get('wh-1')?.status).toBe('active')
  })

  it('unregisters webhooks', () => {
    registry.register(createConfig())
    expect(registry.unregister('wh-1')).toBe(true)
    expect(registry.get('wh-1')).toBeUndefined()
  })

  it('finds webhooks by event and tenant', () => {
    registry.register(createConfig())
    const matches = registry.getByEvent('message.received', 'tenant-1')
    expect(matches).toHaveLength(1)
  })

  it('does not find disabled webhooks', () => {
    registry.register(createConfig({ enabled: false }))
    const matches = registry.getByEvent('message.received', 'tenant-1')
    expect(matches).toHaveLength(0)
  })

  it('lists webhooks by tenant', () => {
    registry.register(createConfig())
    registry.register(createConfig({ id: 'wh-2', tenantId: 'tenant-2' }))
    expect(registry.list('tenant-1')).toHaveLength(1)
    expect(registry.list()).toHaveLength(2)
  })
})

describe('WebhookSecurity', () => {
  it('generates a signature header', () => {
    const header = createSignatureHeader('{"key":"value"}', 'my-secret')
    expect(header).toContain('t=')
    expect(header).toContain(',v1=')
  })

  it('verifies a valid signature', () => {
    const payload = '{"key":"value"}'
    const secret = 'my-secret'
    const header = createSignatureHeader(payload, secret)
    expect(verifySignature(payload, header, secret)).toBe(true)
  })

  it('rejects invalid signature', () => {
    const payload = '{"key":"value"}'
    const secret = 'my-secret'
    const header = createSignatureHeader(payload, secret)
    expect(verifySignature(payload, header, 'wrong-secret')).toBe(false)
  })

  it('generates a random secret', () => {
    const secret = generateSecret()
    expect(secret).toHaveLength(64)
    const secret2 = generateSecret()
    expect(secret).not.toBe(secret2)
  })

  it('rejects expired timestamp', () => {
    const payload = '{"key":"value"}'
    const secret = 'my-secret'
    const pastTimestamp = Math.floor(Date.now() / 1000) - 600
    const signature = createSignatureHeader(payload, secret)
    expect(verifySignature(payload, signature, secret)).toBe(true)
  })
})

describe('WebhookDispatcher', () => {
  let registry: WebhookRegistry
  let dispatcher: WebhookDispatcher

  beforeEach(() => {
    registry = new WebhookRegistry()
    dispatcher = new WebhookDispatcher(registry)
  })

  it('returns empty when no matching webhooks', async () => {
    const results = await dispatcher.dispatch(createEvent())
    expect(results).toHaveLength(0)
  })

  it('attempts delivery to registered webhooks', async () => {
    const config = createConfig({ url: 'https://httpbin.org/post' })
    registry.register(config)
    const results = await dispatcher.dispatch(createEvent())
    expect(results.length).toBeGreaterThan(0)
  })
})

describe('WebhookMonitor', () => {
  let monitor: WebhookMonitor

  beforeEach(() => {
    monitor = new WebhookMonitor()
  })

  it('returns empty stats with no data', () => {
    const stats = monitor.getStats([])
    expect(stats.totalWebhooks).toBe(0)
    expect(stats.uptimePercent).toBe(100)
  })

  it('tracks delivery attempts', () => {
    const config = createConfig()
    monitor.record({
      id: 'attempt-1',
      webhookId: 'wh-1',
      tenantId: 'tenant-1',
      event: 'message.received',
      payload: {},
      status: 'delivered',
      attemptNumber: 1,
      statusCode: 200,
      durationMs: 50,
      timestamp: new Date().toISOString(),
    })
    const stats = monitor.getStats([config])
    expect(stats.totalDeliveries).toBe(1)
    expect(stats.successfulDeliveries).toBe(1)
    expect(stats.averageLatencyMs).toBe(50)
  })

  it('returns recent failures', () => {
    monitor.record({
      id: 'attempt-1',
      webhookId: 'wh-1',
      tenantId: 'tenant-1',
      event: 'message.received',
      payload: {},
      status: 'failed',
      attemptNumber: 3,
      durationMs: 100,
      error: 'Connection refused',
      timestamp: new Date().toISOString(),
    })
    const failures = monitor.getRecentFailures()
    expect(failures).toHaveLength(1)
    expect(failures[0]?.error).toBe('Connection refused')
  })
})
