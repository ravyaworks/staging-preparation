import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler, ChannelMessageAttachment, ChannelMessageButton, ChannelQuickReply, ChannelLocation, ChannelContact } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelAuthError, ChannelConnectionError, ChannelMessageError, ChannelRateLimitError, ChannelNotImplementedError, CapabilityRegistry } from '@conversation-platform/channel-core'
import { createIncomingMessage } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { WhatsAppChannelConfig, WhatsAppWebhookPayload, WhatsAppWebhookEntry, WhatsAppMessageStatus, WhatsAppTemplate, WhatsAppInteractiveMessage } from './types'

export class WhatsAppChannel implements ChannelInterface {
  readonly type = 'whatsapp' as const
  readonly displayName = 'WhatsApp Business'
  readonly version = '1.0.0'

  private config!: WhatsAppChannelConfig
  private connected = false
  private eventHandler?: ChannelEventHandler
  private healthStatus: ChannelHealthStatus = {
    healthy: false,
    status: 'disconnected',
    latencyMs: 0,
    lastCheckedAt: new Date().toISOString(),
  }
  private accessToken: string | null = null
  private baseUrl: string = ''
  private requestCount = 0
  private lastRequestReset = Date.now()

  async initialize(config: ChannelConfig): Promise<void> {
    const customConfig = config.customConfig ?? {}
    this.config = {
      enabled: config.enabled,
      phoneNumberId: customConfig.phoneNumberId as string ?? '',
      businessAccountId: customConfig.businessAccountId as string ?? '',
      apiVersion: customConfig.apiVersion as string ?? 'v21.0',
      webhookVerifyToken: customConfig.webhookVerifyToken as string ?? '',
      appSecret: customConfig.appSecret as string ?? '',
      webhookUrl: config.webhookUrl,
      rateLimitPerMinute: config.rateLimitPerMinute,
      retryMaxAttempts: config.retryMaxAttempts,
      retryBackoffBaseMs: config.retryBackoffBaseMs,
    }
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`
  }

  async connect(auth: ChannelAuthConfig): Promise<void> {
    if (!this.config.phoneNumberId) {
      throw new ChannelConfigError('phoneNumberId is required for WhatsApp channel', 'whatsapp')
    }
    if (!this.config.appSecret) {
      throw new ChannelConfigError('appSecret is required for WhatsApp channel', 'whatsapp')
    }

    if (auth.type === 'bearer_token' && auth.credentials?.token) {
      this.accessToken = auth.credentials.token
    } else if (auth.type === 'oauth2' && auth.credentials?.access_token) {
      this.accessToken = auth.credentials.access_token
    } else {
      throw new ChannelAuthError('Valid bearer_token or oauth2 auth with token is required', 'whatsapp')
    }

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
    this.accessToken = null
    this.requestCount = 0
    this.healthStatus = {
      healthy: false,
      status: 'disconnected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }
  }

  async healthCheck(): Promise<ChannelHealthStatus> {
    return { ...this.healthStatus, lastCheckedAt: new Date().toISOString() }
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    if (!this.connected || !this.accessToken) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'whatsapp')
    }

    this.checkRateLimit()

    if (this.eventHandler) {
      await this.eventHandler({
        id: crypto.randomUUID(),
        channelType: 'whatsapp',
        type: 'message_sent',
        payload: { messageId: message.id },
        timestamp: new Date().toISOString(),
        tenantId: message.tenant.id,
      })
    }

    return message.id
  }

  async sendTypingIndicator(conversationId: string, _isTyping: boolean, tenantId: string): Promise<void> {
    if (!this.connected || !this.accessToken) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'whatsapp')
    }

    this.checkRateLimit()

    try {
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`
      const payload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        to: conversationId,
        type: 'text',
        text: { body: '...' },
      }

      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (this.eventHandler) {
        await this.eventHandler({
          id: crypto.randomUUID(),
          channelType: 'whatsapp',
          type: _isTyping ? 'typing_start' : 'typing_stop',
          payload: { conversationId, tenantId },
          timestamp: new Date().toISOString(),
          tenantId,
        })
      }
    } catch {
      // Typing indicators are best-effort; swallow errors
    }
  }

  async markAsRead(messageId: string, conversationId: string, tenantId: string): Promise<void> {
    if (!this.connected || !this.accessToken) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'whatsapp')
    }

    this.checkRateLimit()

    try {
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`
      const payload = {
        messaging_product: 'whatsapp',
        to: conversationId,
        status: 'read',
        message_id: messageId,
      }

      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (this.eventHandler) {
        await this.eventHandler({
          id: crypto.randomUUID(),
          channelType: 'whatsapp',
          type: 'message_read',
          payload: { messageId, conversationId, tenantId },
          timestamp: new Date().toISOString(),
          tenantId,
        })
      }
    } catch {
      // Read receipts are best-effort; swallow errors
    }
  }

  getCapabilities(): ChannelCapabilitySet {
    return CapabilityRegistry.DEFAULT_CAPABILITIES.whatsapp
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookUrl: this.config.webhookUrl,
      rateLimitPerMinute: this.config.rateLimitPerMinute,
      retryMaxAttempts: this.config.retryMaxAttempts,
      retryBackoffBaseMs: this.config.retryBackoffBaseMs,
      customConfig: {
        phoneNumberId: this.config.phoneNumberId,
        businessAccountId: this.config.businessAccountId,
        apiVersion: this.config.apiVersion,
        webhookVerifyToken: this.config.webhookVerifyToken,
        appSecret: this.config.appSecret ? '***' : '',
      },
    }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    if (config.enabled !== undefined) this.config.enabled = config.enabled
    if (config.webhookUrl !== undefined) this.config.webhookUrl = config.webhookUrl
    if (config.rateLimitPerMinute !== undefined) this.config.rateLimitPerMinute = config.rateLimitPerMinute
    if (config.retryMaxAttempts !== undefined) this.config.retryMaxAttempts = config.retryMaxAttempts
    if (config.retryBackoffBaseMs !== undefined) this.config.retryBackoffBaseMs = config.retryBackoffBaseMs
    if (config.customConfig) {
      const cc = config.customConfig
      if (cc.phoneNumberId) this.config.phoneNumberId = cc.phoneNumberId as string
      if (cc.businessAccountId) this.config.businessAccountId = cc.businessAccountId as string
      if (cc.apiVersion) this.config.apiVersion = cc.apiVersion as string
      if (cc.webhookVerifyToken) this.config.webhookVerifyToken = cc.webhookVerifyToken as string
      if (cc.appSecret) this.config.appSecret = cc.appSecret as string
      this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')

    const customConfig = config.customConfig ?? {}
    if (!customConfig.phoneNumberId) errors.push('phoneNumberId is required')
    if (!customConfig.appSecret) errors.push('appSecret is required')

    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    const payload = rawPayload as unknown as WhatsAppWebhookPayload
    const messages: IncomingMessage[] = []

    if (!payload.entry) return messages

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value

        if (value.statuses) {
          for (const status of value.statuses) {
            const eventType = this.mapStatusToEventType(status.status)
            if (this.eventHandler) {
              await this.eventHandler({
                id: crypto.randomUUID(),
                channelType: 'whatsapp',
                type: eventType,
                payload: {
                  statusId: status.id,
                  recipientId: status.recipientId,
                  status: status.status,
                  timestamp: status.timestamp,
                  error: status.error,
                  conversation: status.conversation,
                },
                timestamp: new Date().toISOString(),
                tenantId: context.tenantId ?? 'unknown',
                requestId: context.requestId,
              })
            }
          }
        }

        if (value.messages) {
          for (const waMessage of value.messages) {
            const contact = value.contacts?.[0]
            const incoming = this.convertToIncomingMessage(waMessage, contact, entry, context)
            messages.push(incoming)

            if (this.eventHandler) {
              await this.eventHandler({
                id: crypto.randomUUID(),
                channelType: 'whatsapp',
                type: 'message_received',
                payload: { messageId: incoming.id, raw: waMessage },
                timestamp: new Date().toISOString(),
                tenantId: context.tenantId ?? 'unknown',
                requestId: context.requestId,
              })
            }
          }
        }
      }
    }

    return messages
  }

  verifyWebhook(mode: string, token: string, challenge: string): { verified: boolean; challenge?: string } {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return { verified: true, challenge }
    }
    return { verified: false }
  }

  private convertToIncomingMessage(
    waMessage: NonNullable<NonNullable<WhatsAppWebhookEntry['changes'][0]['value']['messages']>[0]>,
    contact: { profile: { name: string }; wa_id: string } | undefined,
    _entry: WhatsAppWebhookEntry,
    context: RequestContext,
  ): IncomingMessage {
    const messageType = this.mapWhatsAppMessageType(waMessage.type)

    const attachments: ChannelMessageAttachment[] = []
    const buttons: ChannelMessageButton[] = []
    const quickReplies: ChannelQuickReply[] = []
    let location: ChannelLocation | undefined
    let channelContact: ChannelContact | undefined

    if (waMessage.image) {
      attachments.push({
        id: crypto.randomUUID(),
        type: 'image',
        url: '',
        fileName: `image_${waMessage.id}`,
        fileSizeBytes: 0,
        mimeType: waMessage.image.mime_type,
      })
    }

    if (waMessage.document) {
      attachments.push({
        id: crypto.randomUUID(),
        type: 'document',
        url: '',
        fileName: waMessage.document.filename ?? `document_${waMessage.id}`,
        fileSizeBytes: 0,
        mimeType: waMessage.document.mime_type,
      })
    }

    if (waMessage.audio) {
      attachments.push({
        id: crypto.randomUUID(),
        type: 'audio',
        url: '',
        fileName: `audio_${waMessage.id}`,
        fileSizeBytes: 0,
        mimeType: waMessage.audio.mime_type,
      })
    }

    if (waMessage.video) {
      attachments.push({
        id: crypto.randomUUID(),
        type: 'video',
        url: '',
        fileName: `video_${waMessage.id}`,
        fileSizeBytes: 0,
        mimeType: waMessage.video.mime_type,
      })
    }

    if (waMessage.location) {
      location = {
        latitude: waMessage.location.latitude,
        longitude: waMessage.location.longitude,
        name: waMessage.location.name,
        address: waMessage.location.address,
      }
    }

    if (waMessage.contacts) {
      const c = waMessage.contacts[0]
      if (c) {
        channelContact = {
          name: c.name.formatted_name,
          phone: c.phones?.[0]?.phone,
          email: c.emails?.[0]?.email,
          organization: c.org?.company,
        }
      }
    }

    if (waMessage.interactive) {
      if (waMessage.interactive.button_reply) {
        buttons.push({
          id: waMessage.interactive.button_reply.id,
          title: waMessage.interactive.button_reply.title,
          type: 'postback',
          value: waMessage.interactive.button_reply.id,
        })
      }
      if (waMessage.interactive.list_reply) {
        quickReplies.push({
          id: waMessage.interactive.list_reply.id,
          title: waMessage.interactive.list_reply.title,
        })
      }
    }

    if (waMessage.button) {
      buttons.push({
        id: waMessage.button.payload,
        title: waMessage.button.text,
        type: 'postback',
        value: waMessage.button.payload,
      })
    }

    return createIncomingMessage({
      type: messageType,
      content: {
        type: messageType,
        text: waMessage.text?.body,
      },
      attachments,
      buttons,
      quickReplies,
      location,
      contact: channelContact,
      metadata: {
        messageId: waMessage.id,
        channelType: 'whatsapp',
        channelMessageId: waMessage.id,
        conversationId: waMessage.from,
        timestamp: new Date(Number(waMessage.timestamp) * 1000).toISOString(),
        source: 'user',
      },
      user: {
        id: waMessage.from,
        name: contact?.profile.name,
      },
      conversation: {
        id: waMessage.from,
        channelType: 'whatsapp',
        channelConversationId: waMessage.from,
      },
      tenant: {
        id: context.tenantId ?? 'unknown',
      },
      raw: waMessage as unknown as Record<string, unknown>,
    })
  }

  private mapWhatsAppMessageType(waType: string): 'text' | 'image' | 'document' | 'audio' | 'video' | 'button' | 'location' | 'contact' | 'quick_reply' {
    switch (waType) {
      case 'text': return 'text'
      case 'image': return 'image'
      case 'document': return 'document'
      case 'audio': return 'audio'
      case 'video': return 'video'
      case 'sticker': return 'image'
      case 'location': return 'location'
      case 'contacts': return 'contact'
      case 'button': return 'button'
      case 'interactive': return 'quick_reply'
      case 'order': return 'text'
      case 'system': return 'text'
      default: return 'text'
    }
  }

  private mapStatusToEventType(status: string): 'message_sent' | 'message_delivered' | 'message_read' | 'channel_error' {
    switch (status) {
      case 'sent': return 'message_sent'
      case 'delivered': return 'message_delivered'
      case 'read': return 'message_read'
      case 'failed':
      case 'rejected':
        return 'channel_error'
      default: return 'message_sent'
    }
  }

  private checkRateLimit(): void {
    const now = Date.now()
    if (now - this.lastRequestReset > 60000) {
      this.requestCount = 0
      this.lastRequestReset = now
    }

    const limit = this.config.rateLimitPerMinute ?? 250
    if (this.requestCount >= limit) {
      const resetIn = 60000 - (now - this.lastRequestReset)
      throw new ChannelRateLimitError(
        `WhatsApp rate limit exceeded: ${limit} requests per minute`,
        resetIn,
        'whatsapp',
      )
    }

    this.requestCount++
  }

  private handleApiError(status: number, body: string): never {
    if (status === 429) {
      throw new ChannelRateLimitError('WhatsApp API rate limit exceeded', 60000, 'whatsapp')
    }
    if (status === 401) {
      throw new ChannelAuthError('WhatsApp API authentication failed', 'whatsapp')
    }
    if (status >= 500) {
      throw new ChannelMessageError(`WhatsApp API server error (${status}): ${body}`, 'whatsapp')
    }
    throw new ChannelMessageError(`WhatsApp API error (${status}): ${body}`, 'whatsapp')
  }

  private buildTextPayload(message: OutgoingMessage): Record<string, unknown> {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.user.id,
      type: 'text',
      text: {
        body: message.content.text ?? '',
        preview_url: true,
      },
    }
  }

  private buildMediaPayload(message: OutgoingMessage): Record<string, unknown> {
    const attachment = message.attachments[0]
    const mediaType = message.type === 'image' ? 'image'
      : message.type === 'document' ? 'document'
      : message.type === 'audio' ? 'audio'
      : 'video'

    const mediaObject: Record<string, unknown> = {}
    if (attachment?.url) mediaObject.link = attachment.url
    if (message.content.text) mediaObject.caption = message.content.text
    if (mediaType === 'document' && attachment?.fileName) mediaObject.filename = attachment.fileName

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.user.id,
      type: mediaType,
      [mediaType]: mediaObject,
    }
  }

  private buildInteractivePayload(message: OutgoingMessage): Record<string, unknown> {
    const customization = message.customization as { interactive?: WhatsAppInteractiveMessage } | undefined

    if (customization?.interactive) {
      return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.user.id,
        type: 'interactive',
        interactive: customization.interactive,
      }
    }

    if (message.buttons.length > 0) {
      return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.user.id,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: message.content.text ?? '' },
          action: {
            buttons: message.buttons.map(b => ({
              type: 'reply' as const,
              reply: { id: b.id, title: b.title.slice(0, 20) },
            })),
          },
        },
      }
    }

    if (message.listOptions.length > 0) {
      return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.user.id,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: message.content.text ?? '' },
          action: {
            button: 'View options',
            sections: [{
              title: 'Options',
              rows: message.listOptions.map(o => ({
                id: o.id,
                title: o.title.slice(0, 24),
                description: o.description?.slice(0, 72),
              })),
            }],
          },
        },
      }
    }

    return this.buildTextPayload(message)
  }

  private buildLocationPayload(message: OutgoingMessage): Record<string, unknown> {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.user.id,
      type: 'location',
      location: {
        longitude: message.location?.longitude ?? 0,
        latitude: message.location?.latitude ?? 0,
        name: message.location?.name,
        address: message.location?.address,
      },
    }
  }

  private buildContactPayload(message: OutgoingMessage): Record<string, unknown> {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.user.id,
      type: 'contacts',
      contacts: [{
        name: { formatted_name: message.contact?.name ?? '', first_name: message.contact?.name },
        phones: message.contact?.phone ? [{ phone: message.contact.phone }] : undefined,
        emails: message.contact?.email ? [{ email: message.contact.email }] : undefined,
        org: message.contact?.organization ? { company: message.contact.organization } : undefined,
      }],
    }
  }

  private buildTemplatePayload(message: OutgoingMessage): Record<string, unknown> {
    const customization = message.customization as { template?: WhatsAppTemplate } | undefined

    if (customization?.template) {
      return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.user.id,
        type: 'template',
        template: customization.template,
      }
    }

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.user.id,
      type: 'text',
      text: { body: message.content.text ?? '' },
    }
  }
}
