import type { Logger } from '@conversation-platform/logger'
import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelStatus, ChannelHealthStatus, ChannelType, ChannelRegistration, ChannelEvent, ChannelEventHandler } from './types'
import { ChannelConfigError, ChannelAuthError, ChannelConnectionError } from './types'
import { ChannelRegistry } from './registry'

export interface ChannelManagerOptions {
  logger?: Logger
  healthCheckIntervalMs?: number
}

export class ChannelManager {
  private registry: ChannelRegistry
  private logger?: Logger
  private healthCheckTimers = new Map<string, ReturnType<typeof setInterval>>()
  private eventHandlers: ChannelEventHandler[] = []
  private options: Required<ChannelManagerOptions>

  constructor(registry: ChannelRegistry, options: ChannelManagerOptions = {}) {
    this.registry = registry
    this.options = {
      logger: options.logger ?? undefined as unknown as Logger,
      healthCheckIntervalMs: options.healthCheckIntervalMs ?? 60000,
    }
    this.logger = options.logger
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandlers.push(handler)
  }

  private async emitEvent(event: ChannelEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler(event)
      } catch (error) {
        this.logger?.error?.('Channel event handler error', { error, eventId: event.id })
      }
    }
  }

  async connect(tenantId: string, type: ChannelType, config: ChannelConfig, auth: ChannelAuthConfig): Promise<ChannelRegistration> {
    const implementation = this.registry.getImplementation(type)
    const configErrors = implementation.validateConfig(config)
    if (configErrors.length > 0) {
      throw new ChannelConfigError(`Invalid config: ${configErrors.join(', ')}`, type)
    }

    await implementation.initialize(config)

    try {
      await implementation.connect(auth)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown connection error'
      throw new ChannelConnectionError(`Failed to connect ${type}: ${msg}`, type)
    }

    const health = await implementation.healthCheck()
    const status: ChannelStatus = health.healthy ? 'connected' : 'error'

    const registration: ChannelRegistration = {
      channel: implementation,
      tenantId,
      config,
      auth,
      status,
      connectedAt: new Date().toISOString(),
      lastError: health.error,
    }

    this.registry.connect(tenantId, type, registration)
    this.startHealthChecks(tenantId, type)

    await this.emitEvent({
      id: crypto.randomUUID(),
      channelType: type,
      type: status === 'connected' ? 'channel_connected' : 'channel_error',
      payload: { tenantId, status, error: health.error },
      timestamp: new Date().toISOString(),
      tenantId,
    })

    return registration
  }

  async disconnect(tenantId: string, type: ChannelType): Promise<void> {
    const reg = this.registry.get(tenantId, type)
    if (!reg) return

    this.stopHealthChecks(tenantId, type)

    try {
      await reg.channel.disconnect()
    } catch (error) {
      this.logger?.error?.('Error disconnecting channel', { error, tenantId, channelType: type })
    }

    this.registry.disconnect(tenantId, type)

    await this.emitEvent({
      id: crypto.randomUUID(),
      channelType: type,
      type: 'channel_disconnected',
      payload: { tenantId },
      timestamp: new Date().toISOString(),
      tenantId,
    })
  }

  async getHealth(tenantId: string, type: ChannelType): Promise<ChannelHealthStatus | null> {
    const reg = this.registry.get(tenantId, type)
    if (!reg) return null
    try {
      return await reg.channel.healthCheck()
    } catch {
      return {
        healthy: false,
        status: 'error',
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        error: 'Health check failed',
      }
    }
  }

  async updateConfig(tenantId: string, type: ChannelType, config: Partial<ChannelConfig>): Promise<void> {
    const reg = this.registry.get(tenantId, type)
    if (!reg) throw new ChannelConfigError(`Channel ${type} not connected for tenant ${tenantId}`, type)

    const merged: ChannelConfig = { ...reg.config, ...config }
    const configErrors = reg.channel.validateConfig(merged)
    if (configErrors.length > 0) {
      throw new ChannelConfigError(`Invalid config: ${configErrors.join(', ')}`, type)
    }

    await reg.channel.updateConfig({ ...reg.config, ...config })
    reg.config = merged
  }

  async reconnect(tenantId: string, type: ChannelType): Promise<void> {
    const reg = this.registry.get(tenantId, type)
    if (!reg) throw new ChannelConnectionError(`Channel ${type} not connected for tenant ${tenantId}`, type)

    reg.status = 'connecting'

    try {
      await reg.channel.disconnect()
      await reg.channel.connect(reg.auth)
      const health = await reg.channel.healthCheck()
      reg.status = health.healthy ? 'connected' : 'error'
      reg.connectedAt = new Date().toISOString()
    } catch (error) {
      reg.status = 'error'
      reg.lastError = error instanceof Error ? error.message : 'Reconnection failed'
      throw error
    }
  }

  listChannels(options?: { tenantId?: string; type?: ChannelType; status?: ChannelStatus }): ChannelRegistration[] {
    return this.registry.list(options)
  }

  private startHealthChecks(tenantId: string, type: ChannelType): void {
    const key = `${tenantId}:${type}`
    if (this.healthCheckTimers.has(key)) return

    const timer = setInterval(async () => {
      try {
        const health = await this.getHealth(tenantId, type)
        if (health) {
          this.registry.updateStatus(tenantId, type, health.healthy ? 'connected' : 'error')
        }
      } catch {
        this.registry.updateStatus(tenantId, type, 'error')
      }
    }, this.options.healthCheckIntervalMs)

    this.healthCheckTimers.set(key, timer)
  }

  private stopHealthChecks(tenantId: string, type: ChannelType): void {
    const key = `${tenantId}:${type}`
    const timer = this.healthCheckTimers.get(key)
    if (timer) {
      clearInterval(timer)
      this.healthCheckTimers.delete(key)
    }
  }

  dispose(): void {
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer)
    }
    this.healthCheckTimers.clear()
    this.registry.clear()
  }
}
