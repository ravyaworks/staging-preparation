import type { Logger } from '@conversation-platform/logger'
import type { RequestContext } from '@conversation-platform/types'
import {
  ChannelConfigError,
  ChannelConnectionError,
  ChannelMessageError,
  CapabilityRegistry,
  createIncomingMessage,
} from '@conversation-platform/channel-core'
import type {
  ChannelInterface,
  ChannelConfig,
  ChannelAuthConfig,
  ChannelHealthStatus,
  ChannelCapabilitySet,
  ChannelEvent,
  ChannelEventHandler,
  IncomingMessage,
  OutgoingMessage,
} from '@conversation-platform/channel-core'
import type { ApiChannelConfig } from './types'

export class ApiChannel implements ChannelInterface {
  public readonly type = 'api' as const
  public readonly displayName = 'Public API'
  public readonly version = '1.0.0'

  private config: ApiChannelConfig = { enabled: true }
  private authConfig: ChannelAuthConfig = { type: 'api_key' }
  private connected = false
  private eventHandler?: ChannelEventHandler
  private logger?: Logger

  constructor(logger?: Logger) {
    this.logger = logger
  }

  async initialize(config: ChannelConfig): Promise<void> {
    const errors = this.validateConfig(config)
    if (errors.length > 0) {
      throw new ChannelConfigError(`Invalid API channel config: ${errors.join(', ')}`, this.type)
    }
    this.config = { ...this.config, ...config }
    this.logger?.info?.('API channel initialized', { config })
  }

  async connect(auth: ChannelAuthConfig): Promise<void> {
    this.authConfig = auth
    if (auth.type === 'api_key' && !auth.credentials?.apiKey && !this.config.apiKey) {
      throw new ChannelConnectionError('API key is required for API channel', this.type)
    }
    this.connected = true
    this.logger?.info?.('API channel connected', { authType: auth.type })

    await this.emitEvent({
      id: crypto.randomUUID(),
      channelType: this.type,
      type: 'channel_connected',
      payload: { authType: auth.type },
      timestamp: new Date().toISOString(),
      tenantId: '',
    })
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.logger?.info?.('API channel disconnected')

    await this.emitEvent({
      id: crypto.randomUUID(),
      channelType: this.type,
      type: 'channel_disconnected',
      payload: {},
      timestamp: new Date().toISOString(),
      tenantId: '',
    })
  }

  async healthCheck(): Promise<ChannelHealthStatus> {
    const start = Date.now()
    return {
      healthy: this.connected,
      status: this.connected ? 'connected' : 'disconnected',
      latencyMs: Date.now() - start,
      lastCheckedAt: new Date().toISOString(),
      version: this.version,
    }
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    if (!this.connected) {
      throw new ChannelMessageError('API channel is not connected', this.type)
    }
    if (this.config.rateLimitPerMinute) {
      // rate limiting would be applied at the transport layer
    }
    return message.id
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean, tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelMessageError('API channel is not connected', this.type)
    }
    await this.emitEvent({
      id: crypto.randomUUID(),
      channelType: this.type,
      type: isTyping ? 'typing_start' : 'typing_stop',
      payload: { conversationId, tenantId },
      timestamp: new Date().toISOString(),
      tenantId,
    })
  }

  async markAsRead(messageId: string, conversationId: string, tenantId: string): Promise<void> {
    await this.emitEvent({
      id: crypto.randomUUID(),
      channelType: this.type,
      type: 'message_read',
      payload: { messageId, conversationId, tenantId },
      timestamp: new Date().toISOString(),
      tenantId,
    })
  }

  getCapabilities(): ChannelCapabilitySet {
    return CapabilityRegistry.DEFAULT_CAPABILITIES.api
  }

  getConfig(): ChannelConfig {
    return { ...this.config }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    const merged: ApiChannelConfig = { ...this.config, ...config }
    const errors = this.validateConfig(merged)
    if (errors.length > 0) {
      throw new ChannelConfigError(`Invalid API channel config update: ${errors.join(', ')}`, this.type)
    }
    this.config = merged
    this.logger?.info?.('API channel config updated')
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) {
      errors.push('enabled is required')
    }
    if (config.rateLimitPerMinute !== undefined && (typeof config.rateLimitPerMinute !== 'number' || config.rateLimitPerMinute < 1)) {
      errors.push('rateLimitPerMinute must be a positive number')
    }
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    const messages: IncomingMessage[] = []
    const payloads = Array.isArray(rawPayload.messages) ? rawPayload.messages as Record<string, unknown>[] : [rawPayload]

    for (const payload of payloads) {
      const messageType = this.inferMessageType(payload)
      const msg = createIncomingMessage({
        type: messageType,
        content: {
          type: messageType,
          text: payload.text as string | undefined,
          imageUrl: payload.imageUrl as string | undefined,
          documentUrl: payload.documentUrl as string | undefined,
          audioUrl: payload.audioUrl as string | undefined,
          videoUrl: payload.videoUrl as string | undefined,
          fileUrl: payload.fileUrl as string | undefined,
          fileName: payload.fileName as string | undefined,
          fileSizeBytes: payload.fileSizeBytes as number | undefined,
          mimeType: payload.mimeType as string | undefined,
        },
        attachments: this.extractAttachments(payload),
        buttons: this.extractButtons(payload),
        listOptions: this.extractListOptions(payload),
        quickReplies: this.extractQuickReplies(payload),
        location: this.extractLocation(payload),
        contact: this.extractContact(payload),
        metadata: {
          channelType: this.type,
          conversationId: (payload.conversationId as string) ?? context.requestId ?? '',
          channelMessageId: payload.id as string | undefined,
          source: (payload.source as 'user' | 'agent' | 'system' | 'bot') ?? 'user',
          timestamp: (payload.timestamp as string) ?? new Date().toISOString(),
        },
        user: {
          id: (payload.userId as string) ?? context.userId ?? 'anonymous',
          name: payload.userName as string | undefined,
          avatarUrl: payload.userAvatarUrl as string | undefined,
          email: payload.userEmail as string | undefined,
          phone: payload.userPhone as string | undefined,
        },
        conversation: {
          id: (payload.conversationId as string) ?? context.requestId ?? `conv_${Date.now()}`,
          channelType: this.type,
          channelConversationId: payload.channelConversationId as string | undefined,
          metadata: payload.conversationMetadata as Record<string, unknown> | undefined,
        },
        tenant: {
          id: context.tenantId ?? 'default',
        },
        raw: payload,
      })
      messages.push(msg)
    }
    return messages
  }

  private inferMessageType(payload: Record<string, unknown>): 'text' | 'image' | 'document' | 'audio' | 'video' | 'file' | 'button' | 'list' | 'quick_reply' | 'location' | 'contact' {
    if (payload.imageUrl) return 'image'
    if (payload.documentUrl) return 'document'
    if (payload.audioUrl) return 'audio'
    if (payload.videoUrl) return 'video'
    if (payload.fileUrl) return 'file'
    if (payload.buttons || payload.button) return 'button'
    if (payload.listOptions || payload.listSections) return 'list'
    if (payload.quickReplies || payload.quick_replies) return 'quick_reply'
    if (payload.latitude !== undefined || payload.location) return 'location'
    if (payload.contact) return 'contact'
    return 'text'
  }

  private extractAttachments(payload: Record<string, unknown>): import('@conversation-platform/channel-core').ChannelMessageAttachment[] {
    const raw = payload.attachments
    if (!raw) return []
    if (Array.isArray(raw)) {
      return raw.map((att: Record<string, unknown>) => ({
        id: (att.id as string) ?? crypto.randomUUID(),
        type: (att.type as 'image' | 'document' | 'audio' | 'video' | 'file') ?? 'file',
        url: att.url as string,
        fileName: (att.fileName as string) ?? 'attachment',
        fileSizeBytes: (att.fileSizeBytes as number) ?? 0,
        mimeType: (att.mimeType as string) ?? 'application/octet-stream',
        width: att.width as number | undefined,
        height: att.height as number | undefined,
        durationSeconds: att.durationSeconds as number | undefined,
      }))
    }
    return []
  }

  private extractButtons(payload: Record<string, unknown>): import('@conversation-platform/channel-core').ChannelMessageButton[] {
    const raw = payload.buttons ?? payload.button
    if (!raw) return []
    if (Array.isArray(raw)) {
      return raw.map((btn: Record<string, unknown>) => ({
        id: (btn.id as string) ?? crypto.randomUUID(),
        title: btn.title as string,
        type: (btn.type as 'url' | 'postback' | 'phone_number' | 'quick_reply') ?? 'postback',
        value: btn.value as string | undefined,
      }))
    }
    return []
  }

  private extractListOptions(payload: Record<string, unknown>): import('@conversation-platform/channel-core').ChannelMessageListOption[] {
    const raw = payload.listOptions ?? payload.listSections
    if (!raw) return []
    if (Array.isArray(raw)) {
      return raw.map((opt: Record<string, unknown>) => ({
        id: (opt.id as string) ?? crypto.randomUUID(),
        title: opt.title as string,
        description: opt.description as string | undefined,
      }))
    }
    return []
  }

  private extractQuickReplies(payload: Record<string, unknown>): import('@conversation-platform/channel-core').ChannelQuickReply[] {
    const raw = payload.quickReplies ?? payload.quick_replies
    if (!raw) return []
    if (Array.isArray(raw)) {
      return raw.map((qr: Record<string, unknown>) => ({
        id: (qr.id as string) ?? crypto.randomUUID(),
        title: qr.title as string,
        payload: qr.payload as string | undefined,
        imageUrl: qr.imageUrl as string | undefined,
      }))
    }
    return []
  }

  private extractLocation(payload: Record<string, unknown>): import('@conversation-platform/channel-core').ChannelLocation | undefined {
    const loc = payload.location as Record<string, unknown> | undefined
    if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: loc.name as string | undefined,
        address: loc.address as string | undefined,
      }
    }
    if (typeof payload.latitude === 'number' && typeof payload.longitude === 'number') {
      return {
        latitude: payload.latitude as number,
        longitude: payload.longitude as number,
        name: payload.locationName as string | undefined,
        address: payload.locationAddress as string | undefined,
      }
    }
    return undefined
  }

  private extractContact(payload: Record<string, unknown>): import('@conversation-platform/channel-core').ChannelContact | undefined {
    const contact = payload.contact as Record<string, unknown> | undefined
    if (contact && contact.name) {
      return {
        name: contact.name as string,
        phone: contact.phone as string | undefined,
        email: contact.email as string | undefined,
        avatarUrl: contact.avatarUrl as string | undefined,
        organization: contact.organization as string | undefined,
      }
    }
    return undefined
  }

  private async emitEvent(event: ChannelEvent): Promise<void> {
    try {
      await this.eventHandler?.(event)
    } catch (error) {
      this.logger?.error?.('API channel event handler error', { error, eventId: event.id })
    }
  }
}
