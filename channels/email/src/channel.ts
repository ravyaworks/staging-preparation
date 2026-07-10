import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelNotImplementedError } from '@conversation-platform/channel-core'
import { CapabilityRegistry } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { EmailChannelConfig, EmailProvider, EmailMessage, IncomingEmailPayload } from './types'

export class EmailChannel implements ChannelInterface {
  readonly type = 'email' as const
  readonly displayName = 'Email'
  readonly version = '1.0.0'

  private config: EmailChannelConfig = { enabled: false, provider: 'smtp', fromAddress: '' }
  private connected = false
  private emailProvider?: EmailProvider
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
      provider: custom.provider as EmailProvider ?? 'smtp',
      apiKey: custom.apiKey as string | undefined,
      fromAddress: custom.fromAddress as string ?? '',
      fromName: custom.fromName as string | undefined,
      smtpHost: custom.smtpHost as string | undefined,
      smtpPort: custom.smtpPort as number | undefined,
      smtpUser: custom.smtpUser as string | undefined,
      smtpPass: custom.smtpPass as string | undefined,
      imapHost: custom.imapHost as string | undefined,
      imapPort: custom.imapPort as number | undefined,
      imapUser: custom.imapUser as string | undefined,
      imapPass: custom.imapPass as string | undefined,
      webhookUrl: config.webhookUrl,
      webhookSecret: config.webhookSecret,
      maxAttachmentSize: custom.maxAttachmentSize as number | undefined,
      allowedAttachmentTypes: custom.allowedAttachmentTypes as string[] | undefined,
    }
    this.emailProvider = this.config.provider
  }

  async connect(_auth: ChannelAuthConfig): Promise<void> {
    if (this.config.provider === 'sendgrid' || this.config.provider === 'ses') {
      if (!this.config.apiKey) {
        throw new ChannelConfigError(`${this.config.provider} requires apiKey`, 'email')
      }
    }

    if (this.config.provider === 'smtp') {
      if (!this.config.smtpHost) {
        throw new ChannelConfigError('SMTP requires smtpHost', 'email')
      }
    }

    if (!this.config.fromAddress) {
      throw new ChannelConfigError('fromAddress is required', 'email')
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
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'email')
    }

    const text = message.content.text
    if (!text) {
      throw new ChannelError('Email message requires text content', 'CHANNEL_MESSAGE_ERROR', 'email')
    }

    return message.id
  }

  async sendTypingIndicator(_conversationId: string, _isTyping: boolean, _tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'email')
    }
  }

  async markAsRead(_messageId: string, _conversationId: string, _tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'email')
    }
  }

  getCapabilities(): ChannelCapabilitySet {
    return CapabilityRegistry.DEFAULT_CAPABILITIES.email
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookUrl: this.config.webhookUrl,
      webhookSecret: this.config.webhookSecret,
      customConfig: {
        provider: this.config.provider,
        fromAddress: this.config.fromAddress,
        fromName: this.config.fromName,
        smtpHost: this.config.smtpHost,
        smtpPort: this.config.smtpPort,
        imapHost: this.config.imapHost,
        imapPort: this.config.imapPort,
        maxAttachmentSize: this.config.maxAttachmentSize,
        allowedAttachmentTypes: this.config.allowedAttachmentTypes,
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
        this.config.provider = cc.provider as EmailProvider
        this.emailProvider = this.config.provider
      }
      if (cc.apiKey !== undefined) this.config.apiKey = cc.apiKey as string
      if (cc.fromAddress !== undefined) this.config.fromAddress = cc.fromAddress as string
      if (cc.fromName !== undefined) this.config.fromName = cc.fromName as string
      if (cc.smtpHost !== undefined) this.config.smtpHost = cc.smtpHost as string
      if (cc.smtpPort !== undefined) this.config.smtpPort = cc.smtpPort as number
      if (cc.smtpUser !== undefined) this.config.smtpUser = cc.smtpUser as string
      if (cc.smtpPass !== undefined) this.config.smtpPass = cc.smtpPass as string
      if (cc.imapHost !== undefined) this.config.imapHost = cc.imapHost as string
      if (cc.imapPort !== undefined) this.config.imapPort = cc.imapPort as number
      if (cc.imapUser !== undefined) this.config.imapUser = cc.imapUser as string
      if (cc.imapPass !== undefined) this.config.imapPass = cc.imapPass as string
      if (cc.maxAttachmentSize !== undefined) this.config.maxAttachmentSize = cc.maxAttachmentSize as number
      if (cc.allowedAttachmentTypes !== undefined) this.config.allowedAttachmentTypes = cc.allowedAttachmentTypes as string[]
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')
    const provider = config.customConfig?.provider as string | undefined
    if (provider && !['sendgrid', 'ses', 'smtp'].includes(provider)) {
      errors.push('provider must be sendgrid, ses, or smtp')
    }
    const fromAddress = config.customConfig?.fromAddress as string | undefined
    if (!fromAddress) errors.push('fromAddress is required')
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    if (this.eventHandler) {
      await this.eventHandler({
        id: crypto.randomUUID(),
        channelType: 'email',
        type: 'webhook_received',
        payload: rawPayload,
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId ?? 'unknown',
        requestId: context.requestId,
      })
    }

    const payload = rawPayload as unknown as IncomingEmailPayload

    if (!payload.id || !payload.from || !payload.subject) {
      throw new ChannelError('Invalid incoming email payload', 'CHANNEL_MESSAGE_ERROR', 'email')
    }

    const messages: IncomingMessage[] = [
      {
        id: payload.id,
        type: 'text',
        content: {
          type: 'text',
          text: payload.body,
        },
        attachments: (payload.attachments ?? []).map((a, i) => ({
          id: `${payload.id}_att_${i}`,
          type: a.contentType.startsWith('image/') ? 'image' : 'document',
          url: `attachment://${a.filename}`,
          fileName: a.filename,
          fileSizeBytes: a.size ?? 0,
          mimeType: a.contentType,
        })),
        buttons: [],
        listOptions: [],
        quickReplies: [],
        metadata: {
          messageId: payload.id,
          conversationId: payload.id,
          channelType: 'email',
          channelMessageId: payload.id,
          threadId: payload.threadId,
          timestamp: payload.timestamp ?? new Date().toISOString(),
          source: 'user',
        },
        user: {
          id: payload.from.address,
          name: payload.from.name,
          email: payload.from.address,
        },
        conversation: {
          id: payload.threadId ?? payload.id,
          channelType: 'email',
          channelConversationId: payload.threadId ?? payload.id,
        },
        tenant: {
          id: context.tenantId ?? 'unknown',
        },
        raw: rawPayload,
      },
    ]

    return messages
  }

  getProvider(): EmailProvider | undefined {
    return this.emailProvider
  }
}
