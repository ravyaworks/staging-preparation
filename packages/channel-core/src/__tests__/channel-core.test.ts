import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChannelRegistry } from '../registry'
import { CapabilityRegistry } from '../capabilities'
import { VersionRegistry } from '../versions'
import { ChannelManager } from '../manager'
import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage } from '../types'
import type { ChannelType } from '../types'
import { createIncomingMessage, createOutgoingMessage } from '../message'

function createMockChannel(type: ChannelType, displayName: string): ChannelInterface {
  return {
    type,
    displayName,
    version: '1.0.0',
    initialize: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue({
      healthy: true,
      status: 'connected',
      latencyMs: 10,
      lastCheckedAt: new Date().toISOString(),
    } satisfies ChannelHealthStatus),
    sendMessage: vi.fn().mockResolvedValue('msg_123'),
    sendTypingIndicator: vi.fn().mockResolvedValue(undefined),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    getCapabilities: vi.fn().mockReturnValue({
      incoming: ['text'],
      outgoing: ['text'],
      supportsReplies: true,
      supportsThreads: false,
      supportsRichText: false,
      maxMessageLength: 4096,
    } satisfies ChannelCapabilitySet),
    getConfig: vi.fn().mockReturnValue({ enabled: true } satisfies ChannelConfig),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    onEvent: vi.fn(),
    validateConfig: vi.fn().mockReturnValue([]),
    processIncoming: vi.fn().mockResolvedValue([]),
  }
}

describe('ChannelRegistry', () => {
  let registry: ChannelRegistry
  const mockChannel = createMockChannel('whatsapp', 'WhatsApp')

  beforeEach(() => {
    registry = new ChannelRegistry()
  })

  it('registers and retrieves channel implementations', () => {
    registry.register('whatsapp', mockChannel)
    expect(registry.getImplementation('whatsapp')).toBe(mockChannel)
  })

  it('throws when registering duplicate', () => {
    registry.register('whatsapp', mockChannel)
    expect(() => registry.register('whatsapp', mockChannel)).toThrow()
  })

  it('throws when getting unregistered implementation', () => {
    expect(() => registry.getImplementation('website' as ChannelType)).toThrow()
  })

  it('lists registered implementations', () => {
    registry.register('whatsapp', mockChannel)
    registry.register('website', createMockChannel('website', 'Website'))
    expect(registry.listImplementations()).toEqual(['whatsapp', 'website'])
  })

  it('connects, retrieves, and disconnects tenant channels', () => {
    registry.register('whatsapp', mockChannel)
    registry.connect('tenant-1', 'whatsapp', {
      channel: mockChannel,
      tenantId: 'tenant-1',
      config: { enabled: true },
      auth: { type: 'api_key' },
      status: 'connected',
    })
    expect(registry.get('tenant-1', 'whatsapp')).toBeDefined()
    expect(registry.get('tenant-1', 'whatsapp')?.status).toBe('connected')
    expect(registry.disconnect('tenant-1', 'whatsapp')).toBe(true)
    expect(registry.get('tenant-1', 'whatsapp')).toBeUndefined()
  })

  it('lists channels by tenant', () => {
    registry.register('whatsapp', mockChannel)
    registry.register('website', createMockChannel('website', 'Website'))
    registry.connect('tenant-1', 'whatsapp', { channel: mockChannel, tenantId: 'tenant-1', config: { enabled: true }, auth: { type: 'api_key' }, status: 'connected' })
    registry.connect('tenant-1', 'website', { channel: createMockChannel('website', 'Website'), tenantId: 'tenant-1', config: { enabled: true }, auth: { type: 'api_key' }, status: 'connected' })
    registry.connect('tenant-2', 'whatsapp', { channel: mockChannel, tenantId: 'tenant-2', config: { enabled: true }, auth: { type: 'api_key' }, status: 'connected' })
    expect(registry.getByTenant('tenant-1')).toHaveLength(2)
    expect(registry.getByTenant('tenant-2')).toHaveLength(1)
  })

  it('filters by options', () => {
    registry.register('whatsapp', mockChannel)
    registry.connect('tenant-1', 'whatsapp', { channel: mockChannel, tenantId: 'tenant-1', config: { enabled: true }, auth: { type: 'api_key' }, status: 'connected' })
    expect(registry.list({ tenantId: 'tenant-1' })).toHaveLength(1)
    expect(registry.list({ status: 'error' })).toHaveLength(0)
  })

  it('updates status', () => {
    registry.register('whatsapp', mockChannel)
    registry.connect('tenant-1', 'whatsapp', { channel: mockChannel, tenantId: 'tenant-1', config: { enabled: true }, auth: { type: 'api_key' }, status: 'connected' })
    registry.updateStatus('tenant-1', 'whatsapp', 'error')
    expect(registry.get('tenant-1', 'whatsapp')?.status).toBe('error')
  })
})

describe('CapabilityRegistry', () => {
  let capRegistry: CapabilityRegistry

  beforeEach(() => {
    capRegistry = new CapabilityRegistry()
  })

  it('registers and retrieves capabilities', () => {
    capRegistry.register('whatsapp', CapabilityRegistry.DEFAULT_CAPABILITIES.whatsapp)
    const caps = capRegistry.get('whatsapp')
    expect(caps).toBeDefined()
    expect(caps?.incoming).toContain('text')
    expect(caps?.outgoing).toContain('text')
  })

  it('checks capability support', () => {
    capRegistry.register('whatsapp', CapabilityRegistry.DEFAULT_CAPABILITIES.whatsapp)
    expect(capRegistry.has('whatsapp', 'text')).toBe(true)
    expect(capRegistry.has('whatsapp', 'adaptive_card')).toBe(false)
  })

  it('has default capabilities for all channel types', () => {
    const types = ['website', 'whatsapp', 'instagram', 'messenger', 'telegram', 'slack', 'discord', 'teams', 'email', 'sms', 'api', 'custom']
    for (const type of types) {
      expect(CapabilityRegistry.DEFAULT_CAPABILITIES[type as ChannelType]).toBeDefined()
    }
  })
})

describe('VersionRegistry', () => {
  let versionRegistry: VersionRegistry

  beforeEach(() => {
    versionRegistry = new VersionRegistry()
  })

  it('registers and retrieves versions', () => {
    versionRegistry.register({ version: '1.0.0', channelType: 'whatsapp', supported: true, releasedAt: '2024-01-01' })
    const info = versionRegistry.get('whatsapp', '1.0.0')
    expect(info).toBeDefined()
    expect(info?.supported).toBe(true)
  })

  it('gets latest version', () => {
    versionRegistry.register({ version: '1.0.0', channelType: 'whatsapp', supported: true, releasedAt: '2024-01-01' })
    versionRegistry.register({ version: '2.0.0', channelType: 'whatsapp', supported: true, releasedAt: '2024-06-01' })
    expect(versionRegistry.getLatest('whatsapp')?.version).toBe('2.0.0')
  })
})

describe('ChannelManager', () => {
  let registry: ChannelRegistry
  let manager: ChannelManager
  const mockChannel = createMockChannel('whatsapp', 'WhatsApp')

  beforeEach(() => {
    registry = new ChannelRegistry()
    registry.register('whatsapp', mockChannel)
    manager = new ChannelManager(registry, { healthCheckIntervalMs: 60000 })
  })

  it('connects a channel successfully', async () => {
    const reg = await manager.connect('tenant-1', 'whatsapp', { enabled: true }, { type: 'api_key' })
    expect(reg.status).toBe('connected')
    expect(reg.tenantId).toBe('tenant-1')
  })

  it('disconnects a channel', async () => {
    await manager.connect('tenant-1', 'whatsapp', { enabled: true }, { type: 'api_key' })
    await manager.disconnect('tenant-1', 'whatsapp')
    const channels = manager.listChannels({ tenantId: 'tenant-1' })
    expect(channels).toHaveLength(0)
  })

  it('throws on connect with invalid config', async () => {
    const badChannel = createMockChannel('whatsapp', 'WhatsApp')
    badChannel.validateConfig = vi.fn().mockReturnValue(['enabled is required'])
    const badRegistry = new ChannelRegistry()
    badRegistry.register('whatsapp', badChannel)
    const badManager = new ChannelManager(badRegistry)
    await expect(badManager.connect('tenant-1', 'whatsapp', { enabled: true }, { type: 'api_key' })).rejects.toThrow()
  })

  it('lists channels', async () => {
    await manager.connect('tenant-1', 'whatsapp', { enabled: true }, { type: 'api_key' })
    expect(manager.listChannels({ tenantId: 'tenant-1' })).toHaveLength(1)
    expect(manager.listChannels()).toHaveLength(1)
  })
})

describe('Message helpers', () => {
  it('creates incoming message with defaults', () => {
    const msg = createIncomingMessage({
      metadata: { channelType: 'whatsapp', conversationId: 'conv-1' },
      user: { id: 'user-1', name: 'John' },
      conversation: { id: 'conv-1', channelType: 'whatsapp' },
      tenant: { id: 'tenant-1' },
    })
    expect(msg.type).toBe('text')
    expect(msg.metadata.conversationId).toBe('conv-1')
    expect(msg.user.name).toBe('John')
    expect(msg.attachments).toEqual([])
    expect(msg.buttons).toEqual([])
  })

  it('creates outgoing message with content', () => {
    const msg = createOutgoingMessage({
      type: 'image',
      content: { text: 'Check this out', imageUrl: 'https://example.com/img.png' },
      metadata: { channelType: 'website', conversationId: 'conv-1' },
      user: { id: 'user-1' },
      conversation: { id: 'conv-1', channelType: 'website' },
      tenant: { id: 'tenant-1' },
    })
    expect(msg.type).toBe('image')
    expect(msg.content.imageUrl).toBe('https://example.com/img.png')
  })
})
