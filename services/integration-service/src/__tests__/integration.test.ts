import { describe, it, expect, beforeEach } from 'vitest'
import { IntegrationManager } from '../manager'
import { ApiKeyManager } from '../api-keys'
import { UsageTracker } from '../usage'
import type { IntegrationConfig } from '../types'

function createConfig(overrides: Partial<IntegrationConfig> = {}): IntegrationConfig {
  return {
    id: 'int-1',
    tenantId: 'tenant-1',
    channelType: 'whatsapp',
    name: 'WhatsApp Business',
    enabled: true,
    status: 'pending',
    settings: {},
    ...overrides,
  }
}

describe('IntegrationManager', () => {
  let manager: IntegrationManager

  beforeEach(() => {
    manager = new IntegrationManager()
  })

  it('creates and retrieves integrations', () => {
    const config = createConfig()
    manager.createIntegration(config)
    expect(manager.getIntegration('int-1')).toBeDefined()
    expect(manager.getIntegration('int-1')?.name).toBe('WhatsApp Business')
  })

  it('throws when creating duplicate', () => {
    manager.createIntegration(createConfig())
    expect(() => manager.createIntegration(createConfig())).toThrow()
  })

  it('lists integrations by tenant', () => {
    manager.createIntegration(createConfig())
    manager.createIntegration(createConfig({ id: 'int-2', channelType: 'website' }))
    expect(manager.getIntegrationsByTenant('tenant-1')).toHaveLength(2)
  })

  it('updates integration status', () => {
    manager.createIntegration(createConfig())
    manager.updateStatus('int-1', 'connected')
    expect(manager.getIntegration('int-1')?.status).toBe('connected')
  })

  it('removes integration', () => {
    manager.createIntegration(createConfig())
    expect(manager.removeIntegration('int-1')).toBe(true)
    expect(manager.getIntegration('int-1')).toBeUndefined()
  })
})

describe('ApiKeyManager', () => {
  let manager: ApiKeyManager

  beforeEach(() => {
    manager = new ApiKeyManager()
  })

  it('creates API keys', () => {
    const { key, rawKey } = manager.createKey({
      tenantId: 'tenant-1',
      name: 'Test Key',
      scopes: ['messages:read', 'messages:write'],
    })
    expect(key.name).toBe('Test Key')
    expect(key.keyPrefix).toBe(rawKey.slice(0, 8))
    expect(key.enabled).toBe(true)
  })

  it('validates API keys', () => {
    const { rawKey } = manager.createKey({
      tenantId: 'tenant-1',
      name: 'Test Key',
      scopes: ['messages:read'],
    })
    const validated = manager.validateKey(rawKey)
    expect(validated).not.toBeNull()
    expect(validated?.scopes).toContain('messages:read')
  })

  it('rejects revoked keys', () => {
    const { key, rawKey } = manager.createKey({
      tenantId: 'tenant-1',
      name: 'Test Key',
      scopes: [],
    })
    manager.revokeKey(key.id)
    expect(manager.validateKey(rawKey)).toBeNull()
  })

  it('lists keys by tenant', () => {
    manager.createKey({ tenantId: 'tenant-1', name: 'Key 1', scopes: [] })
    manager.createKey({ tenantId: 'tenant-1', name: 'Key 2', scopes: [] })
    manager.createKey({ tenantId: 'tenant-2', name: 'Key 3', scopes: [] })
    expect(manager.getKeysByTenant('tenant-1')).toHaveLength(2)
  })
})

describe('UsageTracker', () => {
  let tracker: UsageTracker

  beforeEach(() => {
    tracker = new UsageTracker()
  })

  it('records and aggregates usage', () => {
    tracker.record({ integrationId: 'int-1', tenantId: 'tenant-1', messagesSent: 5, latencyMs: 100 })
    tracker.record({ integrationId: 'int-1', tenantId: 'tenant-1', messagesSent: 3, latencyMs: 50 })
    const usage = tracker.getUsage('int-1', 1)
    expect(usage).toHaveLength(1)
    expect(usage[0]?.messagesSent).toBe(8)
    expect(usage[0]?.averageLatencyMs).toBe(18.75)
  })

  it('calculates stats', () => {
    tracker.record({ integrationId: 'int-1', tenantId: 'tenant-1', messagesSent: 10 })
    const stats = tracker.getStats([{ id: 'int-1', channelType: 'whatsapp' }])
    expect(stats.totalMessagesToday).toBe(10)
    expect(stats.topChannels).toHaveLength(1)
    expect(stats.topChannels[0]?.channelType).toBe('whatsapp')
  })
})
