import type { Logger } from '@conversation-platform/logger'
import type { EventBus } from '@conversation-platform/event-bus'
import { ChannelRegistry, ChannelManager, ChannelConfigLoader } from '@conversation-platform/channel-core'
import type { ChannelConfig, ChannelAuthConfig, ChannelType, ChannelStatus, ChannelInterface, ChannelRegistration } from '@conversation-platform/channel-core'
import { ChannelError } from '@conversation-platform/channel-core'

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

  constructor(options: ChannelOrchestratorOptions = {}) {
    this.registry = new ChannelRegistry()
    this.manager = new ChannelManager(this.registry, {
      logger: options.logger,
      healthCheckIntervalMs: options.healthCheckIntervalMs ?? 60000,
    })
    this.configLoader = new ChannelConfigLoader()
    this.logger = options.logger
    this.eventBus = options.eventBus
  }

  registerChannelImplementation(type: ChannelType, implementation: ChannelInterface): void {
    this.registry.register(type, implementation)
    this.logger?.info?.('Channel implementation registered', { channelType: type, name: implementation.displayName })
  }

  async connectChannel(tenantId: string, type: ChannelType, config: ChannelConfig, auth: ChannelAuthConfig): Promise<ChannelRegistration> {
    this.logger?.info?.('Connecting channel', { tenantId, channelType: type })
    const registration = await this.manager.connect(tenantId, type, config, auth)
    this.configLoader.set(tenantId, type, config)

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

    await this.eventBus?.publish('channel.disconnected', {
      tenantId,
      channelType: type,
      timestamp: new Date().toISOString(),
    })
  }

  async reconnectChannel(tenantId: string, type: ChannelType): Promise<void> {
    this.logger?.info?.('Reconnecting channel', { tenantId, channelType: type })
    await this.manager.reconnect(tenantId, type)

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
  }

  listRegisteredImplementations(): ChannelType[] {
    return this.registry.listImplementations()
  }

  dispose(): void {
    this.manager.dispose()
    this.configLoader.clear()
  }
}
