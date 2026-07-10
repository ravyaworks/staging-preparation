import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelAuthError, ChannelNotImplementedError, CapabilityRegistry, createIncomingMessage } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { TelegramChannelConfig, TelegramUpdate, TelegramMessage, TelegramCallbackQuery, TelegramUser, TelegramChat } from './types'

export class TelegramChannel implements ChannelInterface {
  readonly type = 'telegram' as const
  readonly displayName = 'Telegram'
  readonly version = '1.0.0'

  private config!: TelegramChannelConfig
  private connected = false
  private eventHandler?: ChannelEventHandler
  private healthStatus: ChannelHealthStatus = {
    healthy: false,
    status: 'disconnected',
    latencyMs: 0,
    lastCheckedAt: new Date().toISOString(),
  }
  private webhookSet = false

  async initialize(config: ChannelConfig): Promise<void> {
    const customConfig = config.customConfig ?? {}
    const botToken = customConfig.botToken as string | undefined
    if (!botToken) {
      throw new ChannelConfigError('botToken is required for Telegram channel', 'telegram')
    }
    this.config = {
      enabled: config.enabled,
      botToken,
      webhookUrl: customConfig.webhookUrl as string | undefined,
      allowedUpdates: customConfig.allowedUpdates as string[] | undefined,
      commands: customConfig.commands as Array<{ command: string; description: string }> | undefined,
    }
  }

  async connect(_auth: ChannelAuthConfig): Promise<void> {
    if (!this.config.botToken) throw new ChannelAuthError('botToken is required to connect', 'telegram')

    this.connected = true
    this.webhookSet = false
    this.healthStatus = {
      healthy: true,
      status: 'connected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }

    this.eventHandler?.({
      id: crypto.randomUUID(),
      channelType: 'telegram',
      type: 'channel_connected',
      payload: {},
      timestamp: new Date().toISOString(),
      tenantId: '',
    })
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.webhookSet = false
    this.healthStatus = {
      healthy: false,
      status: 'disconnected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }

    this.eventHandler?.({
      id: crypto.randomUUID(),
      channelType: 'telegram',
      type: 'channel_disconnected',
      payload: {},
      timestamp: new Date().toISOString(),
      tenantId: '',
    })
  }

  async healthCheck(): Promise<ChannelHealthStatus> {
    return { ...this.healthStatus, lastCheckedAt: new Date().toISOString() }
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'telegram')

    const chatId = message.conversation.channelConversationId ?? message.conversation.id
    const payload: Record<string, unknown> = {
      chat_id: chatId,
    }

    if (message.content.text) {
      payload.text = message.content.text
    }

    if (message.attachments.length > 0) {
      const attachment = message.attachments[0]
      if (attachment) {
        payload.caption = message.content.text
        switch (attachment.type) {
          case 'image':
            payload.photo = attachment.url
            break
          case 'document':
            payload.document = attachment.url
            break
          case 'audio':
            payload.audio = attachment.url
            break
          case 'video':
            payload.video = attachment.url
            break
        }
      }
    }

    if (message.buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: message.buttons.map(b => [{
          text: b.title,
          callback_data: b.id,
        }]),
      }
    }

    if (message.location) {
      payload.latitude = message.location.latitude
      payload.longitude = message.location.longitude
    }

    return message.id
  }

  async sendTypingIndicator(conversationId: string, _isTyping: boolean, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'telegram')
  }

  async markAsRead(_messageId: string, _conversationId: string, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'telegram')
  }

  getCapabilities(): ChannelCapabilitySet {
    return CapabilityRegistry.DEFAULT_CAPABILITIES.telegram
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      customConfig: {
        botToken: this.config.botToken ? '***' : '',
        webhookUrl: this.config.webhookUrl,
        allowedUpdates: this.config.allowedUpdates,
        commands: this.config.commands,
      },
    }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    if (config.enabled !== undefined) this.config.enabled = config.enabled
    if (config.customConfig) {
      const cc = config.customConfig
      if (cc.botToken) this.config.botToken = cc.botToken as string
      if (cc.webhookUrl) this.config.webhookUrl = cc.webhookUrl as string
      if (cc.allowedUpdates) this.config.allowedUpdates = cc.allowedUpdates as string[]
      if (cc.commands) this.config.commands = cc.commands as Array<{ command: string; description: string }>
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')
    const customConfig = config.customConfig ?? {}
    if (!customConfig.botToken) errors.push('botToken is required')
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    const update = rawPayload as unknown as TelegramUpdate
    const messages: IncomingMessage[] = []

    if (update.message) {
      messages.push(this.convertMessage(update.message, context))
    }

    if (update.callback_query) {
      messages.push(this.convertCallbackQuery(update.callback_query, context))
    }

    for (const msg of messages) {
      this.eventHandler?.({
        id: crypto.randomUUID(),
        channelType: 'telegram',
        type: 'message_received',
        payload: { messageId: msg.id },
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId ?? 'unknown',
        requestId: context.requestId,
      })
    }

    return messages
  }

  private convertMessage(tgMessage: TelegramMessage, context: RequestContext): IncomingMessage {
    const from = tgMessage.from ?? { id: 0, is_bot: false, first_name: 'Unknown' }
    const chat = tgMessage.chat ?? { id: 0, type: 'private' }

    let messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' = 'text'
    let text: string | undefined = tgMessage.text

    if (tgMessage.photo) messageType = 'image'
    else if (tgMessage.document) messageType = 'document'
    else if (tgMessage.audio) messageType = 'audio'
    else if (tgMessage.video) messageType = 'video'
    else if (tgMessage.location) messageType = 'location'
    else if (tgMessage.contact) messageType = 'contact'

    return createIncomingMessage({
      type: messageType,
      content: {
        type: messageType,
        text,
      },
      location: tgMessage.location ? {
        latitude: tgMessage.location.latitude,
        longitude: tgMessage.location.longitude,
      } : undefined,
      contact: tgMessage.contact ? {
        name: `${tgMessage.contact.first_name} ${tgMessage.contact.last_name ?? ''}`.trim(),
        phone: tgMessage.contact.phone_number,
      } : undefined,
      metadata: {
        messageId: String(tgMessage.message_id),
        channelType: 'telegram',
        channelMessageId: String(tgMessage.message_id),
        conversationId: String(chat.id),
        timestamp: new Date((tgMessage.date ?? 0) * 1000).toISOString(),
        source: 'user',
      },
      user: {
        id: String(from.id),
        name: from.first_name + (from.last_name ? ` ${from.last_name}` : ''),
        metadata: { is_bot: from.is_bot, language_code: from.language_code },
      },
      conversation: {
        id: String(chat.id),
        channelType: 'telegram',
        channelConversationId: String(chat.id),
        metadata: { chat_type: chat.type, chat_title: chat.title },
      },
      tenant: { id: context.tenantId ?? 'unknown' },
    })
  }

  private convertCallbackQuery(cq: TelegramCallbackQuery, context: RequestContext): IncomingMessage {
    const from = cq.from ?? { id: 0, is_bot: false, first_name: 'Unknown' }
    const msg = cq.message ?? { message_id: 0, date: 0, chat: { id: 0, type: 'private' as const } }

    return createIncomingMessage({
      type: 'button',
      content: {
        type: 'button',
        text: cq.data ?? '',
      },
      buttons: [{
        id: cq.data ?? '',
        title: cq.data ?? '',
        type: 'postback',
        value: cq.data,
      }],
      metadata: {
        messageId: String(msg.message_id),
        channelType: 'telegram',
        channelMessageId: String(msg.message_id),
        conversationId: String(msg.chat.id),
        timestamp: new Date((msg.date ?? 0) * 1000).toISOString(),
        source: 'user',
      },
      user: {
        id: String(from.id),
        name: from.first_name + (from.last_name ? ` ${from.last_name}` : ''),
        metadata: { is_bot: from.is_bot, language_code: from.language_code },
      },
      conversation: {
        id: String(msg.chat.id),
        channelType: 'telegram',
        channelConversationId: String(msg.chat.id),
        metadata: { chat_type: msg.chat.type },
      },
      tenant: { id: context.tenantId ?? 'unknown' },
    })
  }
}
