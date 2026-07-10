import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler } from '@conversation-platform/channel-core'
import { ChannelError, ChannelNotImplementedError } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { WebsiteSession, WebsiteChannelConfig } from './types'

export class WebsiteChannel implements ChannelInterface {
  readonly type = 'website' as const
  readonly displayName = 'Website Widget'
  readonly version = '1.0.0'

  private config: WebsiteChannelConfig = { enabled: false }
  private connected = false
  private sessions: Map<string, WebsiteSession> = new Map()
  private eventHandler?: ChannelEventHandler
  private healthStatus: ChannelHealthStatus = {
    healthy: false,
    status: 'disconnected',
    latencyMs: 0,
    lastCheckedAt: new Date().toISOString(),
  }

  async initialize(config: ChannelConfig): Promise<void> {
    this.config = {
      enabled: config.enabled,
      allowedOrigins: config.customConfig?.allowedOrigins as string[] ?? ['*'],
      sessionTimeoutMinutes: config.customConfig?.sessionTimeoutMinutes as number ?? 30,
      maxMessageLength: config.customConfig?.maxMessageLength as number ?? 4096,
      widgetConfig: config.customConfig?.widgetConfig as WebsiteChannelConfig['widgetConfig'],
    }
  }

  async connect(_auth: ChannelAuthConfig): Promise<void> {
    this.connected = true
    this.healthStatus = {
      healthy: true,
      status: 'connected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.sessions.clear()
    this.healthStatus = {
      healthy: false,
      status: 'disconnected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }
  }

  async healthCheck(): Promise<ChannelHealthStatus> {
    return {
      ...this.healthStatus,
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'website')
    return message.id
  }

  async sendTypingIndicator(_conversationId: string, _isTyping: boolean, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'website')
  }

  async markAsRead(_messageId: string, _conversationId: string, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'website')
  }

  getCapabilities(): ChannelCapabilitySet {
    return {
      incoming: ['text', 'image', 'document', 'file', 'typing_indicator'],
      outgoing: ['text', 'image', 'document', 'file', 'typing_indicator', 'quick_reply', 'button'],
      supportsReplies: true,
      supportsThreads: false,
      supportsRichText: true,
      maxMessageLength: 4096,
      maxAttachmentSizeBytes: 25 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    }
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      customConfig: this.config as unknown as Record<string, unknown>,
    }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    if (config.enabled !== undefined) this.config.enabled = config.enabled
    if (config.customConfig) {
      this.config = { ...this.config, ...config.customConfig as Partial<WebsiteChannelConfig> }
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    throw new ChannelNotImplementedError('processIncoming', 'website')
  }

  createSession(visitorId: string, conversationId: string, tenantId: string, metadata?: Record<string, unknown>): WebsiteSession {
    const session: WebsiteSession = {
      id: crypto.randomUUID(),
      visitorId,
      conversationId,
      tenantId,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      metadata,
      isActive: true,
    }
    this.sessions.set(session.id, session)
    return session
  }

  getSession(sessionId: string): WebsiteSession | undefined {
    return this.sessions.get(sessionId)
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.isActive = false
      session.lastActivityAt = new Date().toISOString()
    }
  }

  getActiveSessions(tenantId: string): WebsiteSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.tenantId === tenantId && s.isActive)
  }
}
