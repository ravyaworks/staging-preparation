import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler, ChannelMessageAttachment, ChannelQuickReply } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelAuthError, ChannelConnectionError, ChannelMessageError, ChannelRateLimitError, ChannelNotImplementedError, CapabilityRegistry } from '@conversation-platform/channel-core'
import { createIncomingMessage } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { InstagramChannelConfig, InstagramWebhookPayload, InstagramMessage, InstagramStoryMention } from './types'

export class InstagramChannel implements ChannelInterface {
  readonly type = 'instagram' as const
  readonly displayName = 'Instagram Messenger'
  readonly version = '1.0.0'

  private config!: InstagramChannelConfig
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

  async initialize(config: ChannelConfig): Promise<void> {
    const customConfig = config.customConfig ?? {}
    this.config = {
      enabled: config.enabled,
      instagramBusinessAccountId: customConfig.instagramBusinessAccountId as string ?? '',
      accessToken: customConfig.accessToken as string ?? '',
      appSecret: customConfig.appSecret as string ?? '',
      webhookVerifyToken: customConfig.webhookVerifyToken as string ?? '',
      webhookUrl: config.webhookUrl,
      rateLimitPerMinute: config.rateLimitPerMinute,
      retryMaxAttempts: config.retryMaxAttempts,
      retryBackoffBaseMs: config.retryBackoffBaseMs,
    }
  }

  async connect(auth: ChannelAuthConfig): Promise<void> {
    if (!this.config.instagramBusinessAccountId) {
      throw new ChannelConfigError('instagramBusinessAccountId is required for Instagram channel', 'instagram')
    }
    if (!this.config.appSecret) {
      throw new ChannelConfigError('appSecret is required for Instagram channel', 'instagram')
    }

    if (auth.type === 'bearer_token' && auth.credentials?.token) {
      this.config.accessToken = auth.credentials.token
    } else if (this.config.accessToken) {
      // Use access token from config
    } else {
      throw new ChannelAuthError('Valid bearer_token or access token in config is required', 'instagram')
    }

    if (!this.config.accessToken) {
      throw new ChannelAuthError('Access token is required for Instagram channel', 'instagram')
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
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'instagram')
    }

    this.checkRateLimit()

    if (this.eventHandler) {
      await this.eventHandler({
        id: crypto.randomUUID(),
        channelType: 'instagram',
        type: 'message_sent',
        payload: { messageId: message.id },
        timestamp: new Date().toISOString(),
        tenantId: message.tenant.id,
      })
    }

    return message.id
  }

  async sendTypingIndicator(conversationId: string, _isTyping: boolean, tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'instagram')
    }

    this.checkRateLimit()

    try {
      const url = `https://graph.facebook.com/v21.0/${this.config.instagramBusinessAccountId}/messages`
      const payload = {
        recipient: { id: conversationId },
        sender_action: _isTyping ? 'typing_on' : 'typing_off',
      }

      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (this.eventHandler) {
        await this.eventHandler({
          id: crypto.randomUUID(),
          channelType: 'instagram',
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
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'instagram')
    }

    this.checkRateLimit()

    try {
      const url = `https://graph.facebook.com/v21.0/${this.config.instagramBusinessAccountId}/messages`
      const payload = {
        recipient: { id: conversationId },
        sender_action: 'mark_seen',
      }

      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (this.eventHandler) {
        await this.eventHandler({
          id: crypto.randomUUID(),
          channelType: 'instagram',
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
    return CapabilityRegistry.DEFAULT_CAPABILITIES.instagram
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookUrl: this.config.webhookUrl,
      rateLimitPerMinute: this.config.rateLimitPerMinute,
      retryMaxAttempts: this.config.retryMaxAttempts,
      retryBackoffBaseMs: this.config.retryBackoffBaseMs,
      customConfig: {
        instagramBusinessAccountId: this.config.instagramBusinessAccountId,
        webhookVerifyToken: this.config.webhookVerifyToken,
        appSecret: this.config.appSecret ? '***' : '',
        accessToken: this.config.accessToken ? '***' : '',
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
      if (cc.instagramBusinessAccountId) this.config.instagramBusinessAccountId = cc.instagramBusinessAccountId as string
      if (cc.accessToken) this.config.accessToken = cc.accessToken as string
      if (cc.appSecret) this.config.appSecret = cc.appSecret as string
      if (cc.webhookVerifyToken) this.config.webhookVerifyToken = cc.webhookVerifyToken as string
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')

    const customConfig = config.customConfig ?? {}
    if (!customConfig.instagramBusinessAccountId) errors.push('instagramBusinessAccountId is required')
    if (!customConfig.appSecret) errors.push('appSecret is required')

    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    const payload = rawPayload as unknown as InstagramWebhookPayload
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
                  channelType: 'instagram',
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
                channelType: 'instagram',
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
                channelType: 'instagram',
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
                channelType: 'instagram',
                type: 'message_received',
                payload: {
                  reaction: event.reaction.reaction,
                  emoji: event.reaction.emoji,
                  action: event.reaction.action,
                  mid: event.reaction.mid,
                },
                timestamp: new Date().toISOString(),
                tenantId: context.tenantId ?? 'unknown',
                requestId: context.requestId,
              })
            }
          }

          if (event.story_mention) {
            if (this.eventHandler) {
              await this.eventHandler({
                id: crypto.randomUUID(),
                channelType: 'instagram',
                type: 'message_received',
                payload: {
                  storyMention: {
                    mentionId: event.story_mention.mid,
                    storyId: event.story_mention.id,
                    url: event.story_mention.url,
                  },
                },
                timestamp: new Date().toISOString(),
                tenantId: context.tenantId ?? 'unknown',
                requestId: context.requestId,
              })
            }

            const incoming = this.createIncomingFromStoryMention(event.story_mention, event.sender.id, context)
            messages.push(incoming)
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
    msg: InstagramMessage,
    senderId: string,
    _recipientId: string,
    context: RequestContext,
  ): IncomingMessage {
    const attachments: ChannelMessageAttachment[] = []
    const quickReplies: ChannelQuickReply[] = []

    if (msg.attachments) {
      for (const attachment of msg.attachments) {
        if (attachment.type === 'image' || attachment.payload?.media_type === 'image') {
          attachments.push({
            id: crypto.randomUUID(),
            type: 'image',
            url: attachment.payload?.url ?? '',
            fileName: `image_${msg.mid}`,
            fileSizeBytes: 0,
            mimeType: attachment.payload?.mime_type ?? 'image/jpeg',
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
      metadata: {
        messageId: msg.mid,
        channelType: 'instagram',
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
        channelType: 'instagram',
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
        channelType: 'instagram',
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
        channelType: 'instagram',
        channelConversationId: senderId,
      },
      tenant: {
        id: context.tenantId ?? 'unknown',
      },
      raw: postback as unknown as Record<string, unknown>,
    })
  }

  private createIncomingFromStoryMention(
    mention: { mid: string; url: string; id: string },
    senderId: string,
    context: RequestContext,
  ): IncomingMessage {
    return createIncomingMessage({
      type: 'text',
      content: {
        type: 'text',
        text: `Story mention: ${mention.url}`,
      },
      metadata: {
        messageId: mention.mid,
        channelType: 'instagram',
        channelMessageId: mention.mid,
        conversationId: senderId,
        timestamp: new Date().toISOString(),
        source: 'user',
      },
      user: {
        id: senderId,
      },
      conversation: {
        id: senderId,
        channelType: 'instagram',
        channelConversationId: senderId,
      },
      tenant: {
        id: context.tenantId ?? 'unknown',
      },
      raw: mention as unknown as Record<string, unknown>,
    })
  }

  private buildMessagePayload(message: OutgoingMessage): Record<string, unknown> {
    if (message.type === 'text' || message.content.text) {
      const payload: Record<string, unknown> = {
        recipient: { id: message.user.id },
        message: { text: message.content.text ?? '' },
      }

      if (message.quickReplies.length > 0) {
        (payload.message as Record<string, unknown>).quick_replies = message.quickReplies.map(qr => ({
          content_type: 'text',
          title: qr.title,
          payload: qr.id,
        }))
      }

      return payload
    }

    if (message.attachments.length > 0) {
      const attachment = message.attachments[0]!
      const attachmentType = attachment.type === 'image' ? 'image' : 'file'

      return {
        recipient: { id: message.user.id },
        message: {
          attachment: {
            type: attachmentType,
            payload: {
              url: attachment.url,
              is_reusable: true,
            },
          },
        },
      }
    }

    return {
      recipient: { id: message.user.id },
      message: { text: message.content.text ?? '' },
    }
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
        `Instagram rate limit exceeded: ${limit} requests per minute`,
        resetIn,
        'instagram',
      )
    }

    this.requestCount++
  }

  private handleApiError(status: number, body: string): never {
    if (status === 429) {
      throw new ChannelRateLimitError('Instagram API rate limit exceeded', 60000, 'instagram')
    }
    if (status === 401) {
      throw new ChannelAuthError('Instagram API authentication failed', 'instagram')
    }
    if (status >= 500) {
      throw new ChannelMessageError(`Instagram API server error (${status}): ${body}`, 'instagram')
    }
    throw new ChannelMessageError(`Instagram API error (${status}): ${body}`, 'instagram')
  }
}
