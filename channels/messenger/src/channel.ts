import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler, ChannelMessageAttachment, ChannelMessageButton, ChannelQuickReply, ChannelLocation } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelAuthError, ChannelConnectionError, ChannelMessageError, ChannelRateLimitError, ChannelNotImplementedError, CapabilityRegistry } from '@conversation-platform/channel-core'
import { createIncomingMessage } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { MessengerChannelConfig, MessengerWebhookPayload, MessengerMessage, MessengerPersistentMenuItem } from './types'

export class MessengerChannel implements ChannelInterface {
  readonly type = 'messenger' as const
  readonly displayName = 'Facebook Messenger'
  readonly version = '1.0.0'

  private config!: MessengerChannelConfig
  private connected = false
  private eventHandler?: ChannelEventHandler
  private healthStatus: ChannelHealthStatus = {
    healthy: false,
    status: 'disconnected',
    latencyMs: 0,
    lastCheckedAt: new Date().toISOString(),
  }
  private requestCount = 0
  private lastRequestReset = Date.now()
  private pageAccessToken: string | null = null

  async initialize(config: ChannelConfig): Promise<void> {
    const customConfig = config.customConfig ?? {}
    this.config = {
      enabled: config.enabled,
      pageId: customConfig.pageId as string ?? '',
      appSecret: customConfig.appSecret as string ?? '',
      accessToken: customConfig.accessToken as string ?? '',
      webhookVerifyToken: customConfig.webhookVerifyToken as string ?? '',
      persistentMenu: customConfig.persistentMenu as MessengerPersistentMenuItem[] | undefined,
      webhookUrl: config.webhookUrl,
      rateLimitPerMinute: config.rateLimitPerMinute,
      retryMaxAttempts: config.retryMaxAttempts,
      retryBackoffBaseMs: config.retryBackoffBaseMs,
    }
  }

  async connect(auth: ChannelAuthConfig): Promise<void> {
    if (!this.config.pageId) {
      throw new ChannelConfigError('pageId is required for Messenger channel', 'messenger')
    }
    if (!this.config.appSecret) {
      throw new ChannelConfigError('appSecret is required for Messenger channel', 'messenger')
    }

    if (auth.type === 'bearer_token' && auth.credentials?.token) {
      this.pageAccessToken = auth.credentials.token
    } else if (this.config.accessToken) {
      this.pageAccessToken = this.config.accessToken
    } else {
      throw new ChannelAuthError('Valid bearer_token or access token in config is required', 'messenger')
    }

    if (!this.pageAccessToken) {
      throw new ChannelAuthError('Page access token is required for Messenger channel', 'messenger')
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
    this.pageAccessToken = null
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
    if (!this.connected || !this.pageAccessToken) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'messenger')
    }

    this.checkRateLimit()

    if (this.eventHandler) {
      await this.eventHandler({
        id: crypto.randomUUID(),
        channelType: 'messenger',
        type: 'message_sent',
        payload: { messageId: message.id },
        timestamp: new Date().toISOString(),
        tenantId: message.tenant.id,
      })
    }

    return message.id
  }

  async sendTypingIndicator(conversationId: string, _isTyping: boolean, tenantId: string): Promise<void> {
    if (!this.connected || !this.pageAccessToken) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'messenger')
    }

    this.checkRateLimit()

    try {
      const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${this.pageAccessToken}`
      const payload = {
        recipient: { id: conversationId },
        sender_action: _isTyping ? 'typing_on' : 'typing_off',
      }

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (this.eventHandler) {
        await this.eventHandler({
          id: crypto.randomUUID(),
          channelType: 'messenger',
          type: _isTyping ? 'typing_start' : 'typing_stop',
          payload: { conversationId, tenantId },
          timestamp: new Date().toISOString(),
          tenantId,
        })
      }
    } catch {
      // Typing indicators are best-effort
    }
  }

  async markAsRead(messageId: string, conversationId: string, tenantId: string): Promise<void> {
    if (!this.connected || !this.pageAccessToken) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'messenger')
    }

    this.checkRateLimit()

    try {
      const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${this.pageAccessToken}`
      const payload = {
        recipient: { id: conversationId },
        sender_action: 'mark_seen',
      }

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (this.eventHandler) {
        await this.eventHandler({
          id: crypto.randomUUID(),
          channelType: 'messenger',
          type: 'message_read',
          payload: { messageId, conversationId, tenantId },
          timestamp: new Date().toISOString(),
          tenantId,
        })
      }
    } catch {
      // Read receipts are best-effort
    }
  }

  getCapabilities(): ChannelCapabilitySet {
    return CapabilityRegistry.DEFAULT_CAPABILITIES.messenger
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookUrl: this.config.webhookUrl,
      rateLimitPerMinute: this.config.rateLimitPerMinute,
      retryMaxAttempts: this.config.retryMaxAttempts,
      retryBackoffBaseMs: this.config.retryBackoffBaseMs,
      customConfig: {
        pageId: this.config.pageId,
        webhookVerifyToken: this.config.webhookVerifyToken,
        appSecret: this.config.appSecret ? '***' : '',
        accessToken: this.config.accessToken ? '***' : '',
        persistentMenu: this.config.persistentMenu,
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
      if (cc.pageId) this.config.pageId = cc.pageId as string
      if (cc.accessToken) this.config.accessToken = cc.accessToken as string
      if (cc.appSecret) this.config.appSecret = cc.appSecret as string
      if (cc.webhookVerifyToken) this.config.webhookVerifyToken = cc.webhookVerifyToken as string
      if (cc.persistentMenu) this.config.persistentMenu = cc.persistentMenu as MessengerPersistentMenuItem[]
      if (cc.accessToken) this.pageAccessToken = cc.accessToken as string
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')

    const customConfig = config.customConfig ?? {}
    if (!customConfig.pageId) errors.push('pageId is required')
    if (!customConfig.appSecret) errors.push('appSecret is required')

    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    const payload = rawPayload as unknown as MessengerWebhookPayload
    const messages: IncomingMessage[] = []

    if (!payload.entry) return messages

    for (const entry of payload.entry) {
      if (entry.messaging) {
        for (const event of entry.messaging) {
          if (event.message) {
            if (!event.message.is_echo) {
              const incoming = this.convertToIncomingMessage(event.message, event.sender.id, event.recipient.id, context)
              messages.push(incoming)

              if (this.eventHandler) {
                await this.eventHandler({
                  id: crypto.randomUUID(),
                  channelType: 'messenger',
                  type: 'message_received',
                  payload: { messageId: incoming.id },
                  timestamp: new Date().toISOString(),
                  tenantId: context.tenantId ?? 'unknown',
                  requestId: context.requestId,
                })
              }
            }
          }

          if (event.postback) {
            const incoming = this.convertPostbackToIncoming(event.postback, event.sender.id, context)
            messages.push(incoming)
          }

          if (event.read) {
            if (this.eventHandler) {
              await this.eventHandler({
                id: crypto.randomUUID(),
                channelType: 'messenger',
                type: 'message_read',
                payload: { watermark: event.read.watermark, mid: event.read.mid },
                timestamp: new Date().toISOString(),
                tenantId: context.tenantId ?? 'unknown',
                requestId: context.requestId,
              })
            }
          }

          if (event.delivery) {
            if (this.eventHandler) {
              await this.eventHandler({
                id: crypto.randomUUID(),
                channelType: 'messenger',
                type: 'message_delivered',
                payload: { mids: event.delivery.mids, watermark: event.delivery.watermark },
                timestamp: new Date().toISOString(),
                tenantId: context.tenantId ?? 'unknown',
                requestId: context.requestId,
              })
            }
          }

          if (event.reaction) {
            if (this.eventHandler) {
              await this.eventHandler({
                id: crypto.randomUUID(),
                channelType: 'messenger',
                type: 'message_received',
                payload: {
                  reaction: event.reaction.reaction,
                  emoji: event.reaction.emoji,
                  action: event.reaction.action,
                },
                timestamp: new Date().toISOString(),
                tenantId: context.tenantId ?? 'unknown',
                requestId: context.requestId,
              })
            }
          }

          if (event.referral) {
            if (this.eventHandler) {
              await this.eventHandler({
                id: crypto.randomUUID(),
                channelType: 'messenger',
                type: 'message_received',
                payload: { referral: event.referral },
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

  async setPersistentMenu(menu: MessengerPersistentMenuItem[]): Promise<void> {
    if (!this.connected || !this.pageAccessToken) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'messenger')
    }

    const url = `https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${this.pageAccessToken}`
    const payload = {
      persistent_menu: menu,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new ChannelMessageError(`Failed to set persistent menu: ${errorBody}`, 'messenger')
    }

    this.config.persistentMenu = menu
  }

  async getProfile(userId: string): Promise<Record<string, unknown> | null> {
    if (!this.pageAccessToken) return null

    const url = `https://graph.facebook.com/v21.0/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.pageAccessToken}`

    try {
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) })
      if (!response.ok) return null
      return await response.json() as Record<string, unknown>
    } catch {
      return null
    }
  }

  private convertToIncomingMessage(
    msg: MessengerMessage,
    senderId: string,
    _recipientId: string,
    context: RequestContext,
  ): IncomingMessage {
    const attachments: ChannelMessageAttachment[] = []
    const quickReplies: ChannelQuickReply[] = []
    let location: ChannelLocation | undefined

    if (msg.attachments) {
      for (const attachment of msg.attachments) {
        if (attachment.type === 'location' && attachment.payload) {
          // Location parsing from coordinates would go here
        } else if (['image', 'audio', 'video', 'file'].includes(attachment.type)) {
          attachments.push({
            id: crypto.randomUUID(),
            type: attachment.type as 'image' | 'audio' | 'video' | 'file',
            url: attachment.payload?.url ?? '',
            fileName: `${attachment.type}_${msg.mid}`,
            fileSizeBytes: 0,
            mimeType: attachment.payload?.mime_type ?? '',
          })
        }
      }
    }

    if (msg.quick_reply) {
      quickReplies.push({
        id: msg.quick_reply.payload,
        title: msg.quick_reply.payload,
      })
    }

    return createIncomingMessage({
      type: msg.text ? 'text' : (attachments.length > 0 ? 'image' : 'text'),
      content: {
        type: msg.text ? 'text' : 'image',
        text: msg.text,
      },
      attachments,
      quickReplies,
      location,
      metadata: {
        messageId: msg.mid,
        channelType: 'messenger',
        channelMessageId: msg.mid,
        conversationId: senderId,
        timestamp: new Date().toISOString(),
        source: 'user',
      },
      user: {
        id: senderId,
      },
      conversation: {
        id: senderId,
        channelType: 'messenger',
        channelConversationId: senderId,
      },
      tenant: {
        id: context.tenantId ?? 'unknown',
      },
      raw: msg as unknown as Record<string, unknown>,
    })
  }

  private convertPostbackToIncoming(
    postback: { mid: string; title: string; payload: string; referral?: Record<string, unknown> },
    senderId: string,
    context: RequestContext,
  ): IncomingMessage {
    return createIncomingMessage({
      type: 'button',
      content: {
        type: 'button',
        text: postback.title,
      },
      buttons: [{
        id: postback.payload,
        title: postback.title,
        type: 'postback',
        value: postback.payload,
      }],
      metadata: {
        messageId: postback.mid,
        channelType: 'messenger',
        channelMessageId: postback.mid,
        conversationId: senderId,
        timestamp: new Date().toISOString(),
        source: 'user',
      },
      user: {
        id: senderId,
      },
      conversation: {
        id: senderId,
        channelType: 'messenger',
        channelConversationId: senderId,
      },
      tenant: {
        id: context.tenantId ?? 'unknown',
      },
      raw: postback as unknown as Record<string, unknown>,
    })
  }

  private buildMessagePayload(message: OutgoingMessage): Record<string, unknown> {
    const base: Record<string, unknown> = {
      recipient: { id: message.user.id },
    }

    if (message.type === 'text' || message.content.text) {
      const messageData: Record<string, unknown> = {
        text: message.content.text ?? '',
      }

      if (message.quickReplies.length > 0) {
        messageData.quick_replies = message.quickReplies.map(qr => ({
          content_type: 'text',
          title: qr.title,
          payload: qr.id,
          image_url: qr.imageUrl,
        }))
      }

      base.message = messageData
      return base
    }

    if (message.buttons.length > 0) {
      base.message = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: message.content.text ?? '',
            buttons: message.buttons.slice(0, 3).map(b => ({
              type: b.type === 'url' ? 'web_url' : 'postback',
              title: b.title,
              ...(b.type === 'url' ? { url: b.value } : { payload: b.id }),
            })),
          },
        },
      }
      return base
    }

    if (message.attachments.length > 0) {
      const attachment = message.attachments[0]!
      base.message = {
        attachment: {
          type: attachment.type,
          payload: {
            url: attachment.url,
            is_reusable: true,
          },
        },
      }
      return base
    }

    base.message = { text: message.content.text ?? '' }
    return base
  }

  private checkRateLimit(): void {
    const now = Date.now()
    if (now - this.lastRequestReset > 60000) {
      this.requestCount = 0
      this.lastRequestReset = now
    }

    const limit = this.config.rateLimitPerMinute ?? 200
    if (this.requestCount >= limit) {
      const resetIn = 60000 - (now - this.lastRequestReset)
      throw new ChannelRateLimitError(
        `Messenger rate limit exceeded: ${limit} requests per minute`,
        resetIn,
        'messenger',
      )
    }

    this.requestCount++
  }

  private handleApiError(status: number, body: string): never {
    if (status === 429) {
      throw new ChannelRateLimitError('Messenger API rate limit exceeded', 60000, 'messenger')
    }
    if (status === 401) {
      throw new ChannelAuthError('Messenger API authentication failed', 'messenger')
    }
    if (status >= 500) {
      throw new ChannelMessageError(`Messenger API server error (${status}): ${body}`, 'messenger')
    }
    throw new ChannelMessageError(`Messenger API error (${status}): ${body}`, 'messenger')
  }
}
