import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelNotImplementedError } from '@conversation-platform/channel-core'
import { CapabilityRegistry } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { SmsChannelConfig, SmsProvider, SmsWebhookPayload, SmsDeliveryReceipt, SmsMessage } from './types'

const SMS_MAX_MESSAGE_LENGTH = 1600

export class SmsChannel implements ChannelInterface {
  readonly type = 'sms' as const
  readonly displayName = 'SMS'
  readonly version = '1.0.0'

  private config: SmsChannelConfig = { enabled: false, provider: 'twilio', fromNumber: '' }
  private connected = false
  private smsProvider?: SmsProvider
  private eventHandler?: ChannelEventHandler
  private healthStatus: ChannelHealthStatus = {
    healthy: false,
    status: 'disconnected',
    latencyMs: 0,
    lastCheckedAt: new Date().toISOString(),
  }

  async initialize(config: ChannelConfig): Promise<void> {
    const custom = config.customConfig ?? {}
    this.config = {
      enabled: config.enabled,
      provider: custom.provider as SmsProvider ?? 'twilio',
      accountSid: custom.accountSid as string | undefined,
      authToken: custom.authToken as string | undefined,
      fromNumber: custom.fromNumber as string ?? '',
      messagingServiceSid: custom.messagingServiceSid as string | undefined,
      webhookUrl: config.webhookUrl,
      webhookSecret: config.webhookSecret,
      maxMessageLength: custom.maxMessageLength as number ?? SMS_MAX_MESSAGE_LENGTH,
      retryMaxAttempts: custom.retryMaxAttempts as number ?? 3,
      retryBackoffBaseMs: custom.retryBackoffBaseMs as number ?? 1000,
    }
    this.smsProvider = this.config.provider
  }

  async connect(_auth: ChannelAuthConfig): Promise<void> {
    if (!this.config.fromNumber) {
      throw new ChannelConfigError('fromNumber is required', 'sms')
    }

    if (this.config.provider === 'twilio' && !this.config.accountSid) {
      throw new ChannelConfigError('Twilio requires accountSid', 'sms')
    }

    if (this.config.provider === 'vonage' && !this.config.authToken) {
      throw new ChannelConfigError('Vonage requires authToken (api_key)', 'sms')
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
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'sms')
    }

    const text = message.content.text
    if (!text) {
      throw new ChannelError('SMS message requires text content', 'CHANNEL_MESSAGE_ERROR', 'sms')
    }

    if (text.length > SMS_MAX_MESSAGE_LENGTH) {
      throw new ChannelError(
        `SMS message exceeds maximum length of ${SMS_MAX_MESSAGE_LENGTH} characters`,
        'CHANNEL_MESSAGE_ERROR',
        'sms',
      )
    }

    return message.id
  }

  async sendTypingIndicator(_conversationId: string, _isTyping: boolean, _tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'sms')
    }
  }

  async markAsRead(_messageId: string, _conversationId: string, _tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'sms')
    }
  }

  getCapabilities(): ChannelCapabilitySet {
    return CapabilityRegistry.DEFAULT_CAPABILITIES.sms
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookUrl: this.config.webhookUrl,
      webhookSecret: this.config.webhookSecret,
      customConfig: {
        provider: this.config.provider,
        fromNumber: this.config.fromNumber,
        messagingServiceSid: this.config.messagingServiceSid,
        maxMessageLength: this.config.maxMessageLength,
        retryMaxAttempts: this.config.retryMaxAttempts,
        retryBackoffBaseMs: this.config.retryBackoffBaseMs,
      },
    }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    if (config.enabled !== undefined) this.config.enabled = config.enabled
    if (config.webhookUrl !== undefined) this.config.webhookUrl = config.webhookUrl
    if (config.webhookSecret !== undefined) this.config.webhookSecret = config.webhookSecret
    if (config.customConfig) {
      const cc = config.customConfig
      if (cc.provider !== undefined) {
        this.config.provider = cc.provider as SmsProvider
        this.smsProvider = this.config.provider
      }
      if (cc.accountSid !== undefined) this.config.accountSid = cc.accountSid as string
      if (cc.authToken !== undefined) this.config.authToken = cc.authToken as string
      if (cc.fromNumber !== undefined) this.config.fromNumber = cc.fromNumber as string
      if (cc.messagingServiceSid !== undefined) this.config.messagingServiceSid = cc.messagingServiceSid as string
      if (cc.maxMessageLength !== undefined) this.config.maxMessageLength = cc.maxMessageLength as number
      if (cc.retryMaxAttempts !== undefined) this.config.retryMaxAttempts = cc.retryMaxAttempts as number
      if (cc.retryBackoffBaseMs !== undefined) this.config.retryBackoffBaseMs = cc.retryBackoffBaseMs as number
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')
    const provider = config.customConfig?.provider as string | undefined
    if (provider && !['twilio', 'vonage', 'custom'].includes(provider)) {
      errors.push('provider must be twilio, vonage, or custom')
    }
    const fromNumber = config.customConfig?.fromNumber as string | undefined
    if (!fromNumber) errors.push('fromNumber is required')
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    if (this.eventHandler) {
      await this.eventHandler({
        id: crypto.randomUUID(),
        channelType: 'sms',
        type: 'webhook_received',
        payload: rawPayload,
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId ?? 'unknown',
        requestId: context.requestId,
      })
    }

    const payload = rawPayload as unknown as SmsWebhookPayload
    const messageSid = payload.MessageSid ?? payload.SmsSid

    if (!messageSid) {
      throw new ChannelError('Invalid SMS webhook payload: missing message SID', 'CHANNEL_MESSAGE_ERROR', 'sms')
    }

    if (payload.SmsStatus || payload.MessageStatus) {
      return this.processDeliveryReceipt(payload, context)
    }

    const fromNumber = payload.From
    const body = payload.Body

    if (!fromNumber) {
      throw new ChannelError('Invalid SMS webhook payload: missing sender number', 'CHANNEL_MESSAGE_ERROR', 'sms')
    }

    const messages: IncomingMessage[] = [
      {
        id: messageSid,
        type: 'text',
        content: {
          type: 'text',
          text: body ?? '',
        },
        attachments: [],
        buttons: [],
        listOptions: [],
        quickReplies: [],
        metadata: {
          messageId: messageSid,
          conversationId: fromNumber,
          channelType: 'sms',
          channelMessageId: messageSid,
          timestamp: new Date().toISOString(),
          source: 'user',
        },
        user: {
          id: fromNumber,
          phone: fromNumber,
        },
        conversation: {
          id: fromNumber,
          channelType: 'sms',
          channelConversationId: fromNumber,
        },
        tenant: {
          id: context.tenantId ?? 'unknown',
        },
        raw: rawPayload,
      },
    ]

    return messages
  }

  async sendSms(to: string, body: string): Promise<SmsMessage> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'sms')
    }

    if (body.length > (this.config.maxMessageLength ?? SMS_MAX_MESSAGE_LENGTH)) {
      throw new ChannelError(
        `SMS body exceeds maximum length of ${this.config.maxMessageLength ?? SMS_MAX_MESSAGE_LENGTH}`,
        'CHANNEL_MESSAGE_ERROR',
        'sms',
      )
    }

    return {
      id: crypto.randomUUID(),
      to,
      from: this.config.fromNumber,
      body,
      status: 'queued',
      timestamp: new Date().toISOString(),
    }
  }

  getSmsProvider(): SmsProvider | undefined {
    return this.smsProvider
  }

  private processDeliveryReceipt(payload: SmsWebhookPayload, context: RequestContext): IncomingMessage[] {
    const messageSid = payload.MessageSid ?? payload.SmsSid ?? ''
    const status = this.mapSmsStatus(payload.SmsStatus ?? payload.MessageStatus)

    const messageId = crypto.randomUUID()

    const messages: IncomingMessage[] = [
      {
        id: messageId,
        type: 'text',
        content: {
          type: 'text',
          text: '',
        },
        attachments: [],
        buttons: [],
        listOptions: [],
        quickReplies: [],
        metadata: {
          messageId,
          conversationId: payload.From ?? payload.To ?? '',
          channelType: 'sms',
          channelMessageId: messageSid,
          timestamp: new Date().toISOString(),
          source: 'system',
        },
        user: {
          id: payload.From ?? payload.To ?? '',
          phone: payload.From ?? payload.To,
        },
        conversation: {
          id: payload.From ?? payload.To ?? '',
          channelType: 'sms',
          channelConversationId: payload.From ?? payload.To,
        },
        tenant: {
          id: context.tenantId ?? 'unknown',
        },
        raw: {
          type: 'delivery_receipt',
          messageSid,
          status,
          errorCode: payload.ErrorCode,
          errorMessage: payload.ErrorMessage,
          ...payload,
        },
      },
    ]

    return messages
  }

  private mapSmsStatus(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'queued': return 'queued'
      case 'sent': return 'sent'
      case 'delivered': return 'delivered'
      case 'failed': return 'failed'
      case 'undelivered': return 'undelivered'
      default: return 'unknown'
    }
  }
}
