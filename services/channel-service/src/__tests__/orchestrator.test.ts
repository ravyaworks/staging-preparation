import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChannelOrchestrator } from '../orchestrator'
import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet } from '@conversation-platform/channel-core'

function createMockChannel(type: import('@conversation-platform/channel-core').ChannelType, displayName: string): ChannelInterface {
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
    } satisfies ChannelCapabilitySet),
    getConfig: vi.fn().mockReturnValue({ enabled: true } satisfies ChannelConfig),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    onEvent: vi.fn(),
    validateConfig: vi.fn().mockReturnValue([]),
    processIncoming: vi.fn().mockResolvedValue([]),
  }
}

describe('ChannelOrchestrator', () => {
  let orchestrator: ChannelOrchestrator

  beforeEach(() => {
    orchestrator = new ChannelOrchestrator({ healthCheckIntervalMs: 60000 })
  })

  it('registers channel implementations', () => {
    const channel = createMockChannel('whatsapp', 'WhatsApp')
    orchestrator.registerChannelImplementation('whatsapp', channel)
    expect(orchestrator.listRegisteredImplementations()).toContain('whatsapp')
  })

  it('connects a channel', async () => {
    orchestrator.registerChannelImplementation('whatsapp', createMockChannel('whatsapp', 'WhatsApp'))
    const reg = await orchestrator.connectChannel('tenant-1', 'whatsapp', { enabled: true }, { type: 'api_key' })
    expect(reg.status).toBe('connected')
    expect(reg.tenantId).toBe('tenant-1')
  })

  it('disconnects a channel', async () => {
    orchestrator.registerChannelImplementation('whatsapp', createMockChannel('whatsapp', 'WhatsApp'))
    await orchestrator.connectChannel('tenant-1', 'whatsapp', { enabled: true }, { type: 'api_key' })
    await orchestrator.disconnectChannel('tenant-1', 'whatsapp')
    expect(orchestrator.getConnectedChannels('tenant-1')).toHaveLength(0)
  })

  it('gets channel status', async () => {
    orchestrator.registerChannelImplementation('whatsapp', createMockChannel('whatsapp', 'WhatsApp'))
    await orchestrator.connectChannel('tenant-1', 'whatsapp', { enabled: true }, { type: 'api_key' })
    expect(orchestrator.getChannelStatus('tenant-1', 'whatsapp')).toBe('connected')
  })
})
