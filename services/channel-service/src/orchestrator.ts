import type { Logger } from '@conversation-platform/logger'
import type { EventBus } from '@conversation-platform/event-bus'
import { ChannelRegistry, ChannelManager, ChannelConfigLoader } from '@conversation-platform/channel-core'
import type { ChannelConfig, ChannelAuthConfig, ChannelType, ChannelStatus, ChannelInterface, ChannelRegistration } from '@conversation-platform/channel-core'
import { ChannelError } from '@conversation-platform/channel-core'
import type { ChannelConnectionRepository } from '@conversation-platform/database'

export interface ChannelOrchestratorOptions {
  logger?: Logger
  eventBus?: EventBus
  healthCheckIntervalMs?: number
}

export class ChannelOrchestrator {
  public registry: ChannelRegistry
  public manager: ChannelManager
  public configLoader: ChannelConfigLoader
  private logger?: Logger
  private eventBus?: EventBus
  private connectionRepo?: ChannelConnectionRepository

  constructor(options: ChannelOrchestratorOptions = {}, connectionRepo?: ChannelConnectionRepository) {
    this.registry = new ChannelRegistry()
    this.manager = new ChannelManager(this.registry, {
      logger: options.logger,
      healthCheckIntervalMs: options.healthCheckIntervalMs ?? 60000,
    })
    this.configLoader = new ChannelConfigLoader()
    this.logger = options.logger
    this.eventBus = options.eventBus
    this.connectionRepo = connectionRepo
  }

  registerChannelImplementation(type: ChannelType, implementation: ChannelInterface): void {
    this.registry.register(type, implementation)
    this.logger?.info?.('Channel implementation registered', { channelType: type, name: implementation.displayName })
  }

  async connectChannel(tenantId: string, type: ChannelType, config: ChannelConfig, auth: ChannelAuthConfig): Promise<ChannelRegistration> {
    this.logger?.info?.('Connecting channel', { tenantId, channelType: type })
    const registration = await this.manager.connect(tenantId, type, config, auth)
    this.configLoader.set(tenantId, type, config)

    if (this.connectionRepo) {
      const existing = await this.connectionRepo.findByTenantAndType(tenantId, type)
      if (existing) {
        await this.connectionRepo.update(existing.id, {
          status: registration.status,
          config: config as any,
          authConfig: auth as any,
          connectedAt: new Date(),
          lastActivity: new Date(),
        })
      } else {
        await this.connectionRepo.create({
          channelType: type,
          name: implementation(type),
          status: registration.status,
          config: config as any,
          authConfig: auth as any,
          connectedAt: new Date(),
          lastActivity: new Date(),
          tenant: { connect: { id: tenantId } },
        })
      }
    }

    await this.eventBus?.publish('channel.connected', {
      tenantId,
      channelType: type,
      status: registration.status,
      timestamp: new Date().toISOString(),
    })

    return registration
  }

  async disconnectChannel(tenantId: string, type: ChannelType): Promise<void> {
    this.logger?.info?.('Disconnecting channel', { tenantId, channelType: type })
    await this.manager.disconnect(tenantId, type)
    this.configLoader.remove(tenantId, type)

    if (this.connectionRepo) {
      const existing = await this.connectionRepo.findByTenantAndType(tenantId, type)
      if (existing) {
        await this.connectionRepo.update(existing.id, {
          status: 'disconnected',
          error: null,
        })
      }
    }

    await this.eventBus?.publish('channel.disconnected', {
      tenantId,
      channelType: type,
      timestamp: new Date().toISOString(),
    })
  }

  async reconnectChannel(tenantId: string, type: ChannelType): Promise<void> {
    this.logger?.info?.('Reconnecting channel', { tenantId, channelType: type })
    await this.manager.reconnect(tenantId, type)

    if (this.connectionRepo) {
      const existing = await this.connectionRepo.findByTenantAndType(tenantId, type)
      if (existing) {
        await this.connectionRepo.update(existing.id, {
          status: 'connected',
          lastActivity: new Date(),
        })
      }
    }

    await this.eventBus?.publish('channel.reconnected', {
      tenantId,
      channelType: type,
      timestamp: new Date().toISOString(),
    })
  }

  async sendMessage(tenantId: string, type: ChannelType, message: import('@conversation-platform/channel-core').OutgoingMessage): Promise<string> {
    const impl = this.registry.getImplementation(type)
    return impl.sendMessage(message)
  }

  async sendTypingIndicator(tenantId: string, type: ChannelType, conversationId: string, isTyping: boolean): Promise<void> {
    const reg = this.registry.get(tenantId, type)
    if (!reg) throw new ChannelError(`Channel ${type} not connected for tenant ${tenantId}`, 'CHANNEL_NOT_CONNECTED', type)
    await reg.channel.sendTypingIndicator(conversationId, isTyping, tenantId)
  }

  async processIncomingPayload(tenantId: string, type: ChannelType, rawPayload: Record<string, unknown>, context: import('@conversation-platform/types').RequestContext): Promise<import('@conversation-platform/channel-core').IncomingMessage[]> {
    const impl = this.registry.getImplementation(type)
    const messages = await impl.processIncoming(rawPayload, context)

    if (this.connectionRepo) {
      const existing = await this.connectionRepo.findByTenantAndType(tenantId, type)
      if (existing) {
        await this.connectionRepo.update(existing.id, {
          lastActivity: new Date(),
        })
      }
    }

    for (const message of messages) {
      await this.eventBus?.publish('message.received', {
        tenantId,
        channelType: type,
        message,
        timestamp: new Date().toISOString(),
      })
    }

    return messages
  }

  getConnectedChannels(tenantId: string): ChannelRegistration[] {
    return this.manager.listChannels({ tenantId })
  }

  async getConnectedChannelsFromDb(tenantId: string) {
    if (!this.connectionRepo) return undefined
    return this.connectionRepo.findByTenant(tenantId)
  }

  getChannelHealth(tenantId: string, type: ChannelType) {
    return this.manager.getHealth(tenantId, type)
  }

  getChannelStatus(tenantId: string, type: ChannelType): ChannelStatus | null {
    const reg = this.registry.get(tenantId, type)
    return reg?.status ?? null
  }

  async updateChannelConfig(tenantId: string, type: ChannelType, config: Partial<ChannelConfig>): Promise<void> {
    await this.manager.updateConfig(tenantId, type, config)
    this.configLoader.set(tenantId, type, { ...this.configLoader.get(tenantId, type), ...config } as ChannelConfig)

    if (this.connectionRepo) {
      const existing = await this.connectionRepo.findByTenantAndType(tenantId, type)
      if (existing) {
        await this.connectionRepo.update(existing.id, {
          config: { ...(existing.config as any), ...config } as any,
        })
      }
    }
  }

  listRegisteredImplementations(): ChannelType[] {
    return this.registry.listImplementations()
  }

  dispose(): void {
    this.manager.dispose()
    this.configLoader.clear()
  }
}

function implementation(type: ChannelType): string {
  return `${type} Channel`
}
