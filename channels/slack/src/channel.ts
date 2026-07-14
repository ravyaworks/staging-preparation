import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelAuthError, ChannelConnectionError, ChannelMessageError, CapabilityRegistry } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { SlackChannelConfig, SlackEventPayload, SlackEvent, SlackSlashCommandPayload } from './types'

function verifySlackSignature(signingSecret: string, body: string, signature: string, timestamp: string): boolean {
  const base = `v0:${timestamp}:${body}`
  const hmac = require('crypto').createHmac('sha256', signingSecret).update(base).digest('hex')
  return `v0=${hmac}` === signature
}

export class SlackChannel implements ChannelInterface {
  readonly type = 'slack' as const
  readonly displayName = 'Slack'
  readonly version = '1.0.0'

  private config: SlackChannelConfig = { enabled: false, botToken: '', signingSecret: '' }
  private connected = false
  private eventHandler?: ChannelEventHandler
  private healthStatus: ChannelHealthStatus = {
    healthy: false,
    status: 'disconnected',
    latencyMs: 0,
    lastCheckedAt: new Date().toISOString(),
  }

  async initialize(config: ChannelConfig): Promise<void> {
    const customConfig = config.customConfig as Record<string, unknown> | undefined
    this.config = {
      enabled: config.enabled,
      botToken: customConfig?.botToken as string ?? '',
      signingSecret: customConfig?.signingSecret as string ?? config.webhookSecret ?? '',
      appId: customConfig?.appId as string,
      clientId: customConfig?.clientId as string,
      clientSecret: customConfig?.clientSecret as string,
      slashCommands: customConfig?.slashCommands as SlackChannelConfig['slashCommands'] ?? [],
    }

    const errors = this.validateConfig(config)
    if (errors.length > 0) throw new ChannelConfigError(errors.join('; '), 'slack')
  }

  async connect(auth: ChannelAuthConfig): Promise<void> {
    if (!this.config.botToken && auth.type === 'bearer_token') {
      this.config.botToken = auth.credentials?.token ?? ''
    }

    if (!this.config.botToken) throw new ChannelAuthError('botToken is required to connect', 'slack')
    if (!this.config.signingSecret) throw new ChannelAuthError('signingSecret is required to connect', 'slack')

    this.connected = true
    this.healthStatus = {
      healthy: true,
      status: 'connected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }

    this.eventHandler?.({
      id: crypto.randomUUID(),
      channelType: 'slack',
      type: 'channel_connected',
      payload: {},
      timestamp: new Date().toISOString(),
      tenantId: '',
    })
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.healthStatus = {
      healthy: false,
      status: 'disconnected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }

    this.eventHandler?.({
      id: crypto.randomUUID(),
      channelType: 'slack',
      type: 'channel_disconnected',
      payload: {},
      timestamp: new Date().toISOString(),
      tenantId: '',
    })
  }

  async healthCheck(): Promise<ChannelHealthStatus> {
    if (!this.connected) {
      return {
        healthy: false,
        status: 'disconnected',
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
      }
    }

    const start = Date.now()
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${this.config.botToken}`,
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        this.healthStatus = {
          healthy: false,
          status: 'error',
          latencyMs: Date.now() - start,
          lastCheckedAt: new Date().toISOString(),
          error: `Slack API returned ${response.status}`,
        }
        return this.healthStatus
      }

      const data = await response.json() as { ok: boolean; error?: string }
      if (!data.ok) {
        this.healthStatus = {
          healthy: false,
          status: 'error',
          latencyMs: Date.now() - start,
          lastCheckedAt: new Date().toISOString(),
          error: data.error ?? 'Slack API returned ok: false',
        }
        return this.healthStatus
      }

      this.healthStatus = {
        healthy: true,
        status: 'connected',
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
        version: this.version,
      }
      return this.healthStatus
    } catch (error) {
      this.healthStatus = {
        healthy: false,
        status: 'error',
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      return this.healthStatus
    }
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'slack')

    const channelId = message.conversation.channelConversationId ?? message.conversation.id
    const payload: Record<string, unknown> = {
      channel: channelId,
    }

    if (message.content.text) {
      payload.text = message.content.text
    }

    if (message.metadata.threadId) {
      payload.thread_ts = message.metadata.threadId
    }

    if (message.buttons.length > 0 || message.attachments.length > 0) {
      const blocks: Array<Record<string, unknown>> = []

      if (message.content.text) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: message.content.text },
        })
      }

      if (message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: `<${attachment.url}|${attachment.fileName}>` },
          })
        }
      }

      if (message.buttons.length > 0) {
        blocks.push({
          type: 'actions',
          elements: message.buttons.map(button => ({
            type: 'button',
            text: { type: 'plain_text', text: button.title, emoji: true },
            value: button.id,
            ...(button.type === 'url' ? { url: button.value } : {}),
            action_id: `button_${button.id}`,
          })),
        })
      }

      if (blocks.length > 0) {
        payload.blocks = blocks
        delete payload.text
      }
    }

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.botToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new ChannelMessageError(`Slack API error: ${response.status} ${errorBody}`, 'slack')
      }

      const data = await response.json() as { ok: boolean; ts?: string; error?: string }
      if (!data.ok) throw new ChannelMessageError(`Slack API error: ${data.error ?? 'unknown'}`, 'slack')

      return data.ts ?? message.id
    } catch (error) {
      if (error instanceof ChannelMessageError) throw error
      throw new ChannelMessageError(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'slack',
      )
    }
  }

  async sendTypingIndicator(conversationId: string, _isTyping: boolean, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'slack')
  }

  async markAsRead(_messageId: string, _conversationId: string, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'slack')
  }

  getCapabilities(): ChannelCapabilitySet {
    const defaultCaps = CapabilityRegistry.DEFAULT_CAPABILITIES.slack
    return { ...defaultCaps }
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookSecret: this.config.signingSecret,
      customConfig: {
        botToken: this.config.botToken,
        signingSecret: this.config.signingSecret,
        appId: this.config.appId,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        slashCommands: this.config.slashCommands,
      },
    }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    if (config.enabled !== undefined) this.config.enabled = config.enabled
    if (config.webhookSecret !== undefined) this.config.signingSecret = config.webhookSecret
    if (config.customConfig) {
      const custom = config.customConfig as Record<string, unknown>
      if (custom.botToken !== undefined) this.config.botToken = custom.botToken as string
      if (custom.signingSecret !== undefined) this.config.signingSecret = custom.signingSecret as string
      if (custom.appId !== undefined) this.config.appId = custom.appId as string
      if (custom.clientId !== undefined) this.config.clientId = custom.clientId as string
      if (custom.clientSecret !== undefined) this.config.clientSecret = custom.clientSecret as string
      if (custom.slashCommands !== undefined) this.config.slashCommands = custom.slashCommands as SlackChannelConfig['slashCommands']
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')
    const custom = config.customConfig as Record<string, unknown> | undefined
    if (!custom?.botToken) errors.push('botToken is required')
    if (!custom?.signingSecret && !config.webhookSecret) errors.push('signingSecret is required')
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    const messages: IncomingMessage[] = []

    const eventType = rawPayload.type as string | undefined
    const challenge = rawPayload.challenge as string | undefined

    if (eventType === 'url_verification' && challenge) {
      return messages
    }

    if (eventType === 'event_callback') {
      const eventPayload = rawPayload as unknown as SlackEventPayload
      if (eventPayload.event) {
        const incoming = await this.processEvent(eventPayload.event, context)
        if (incoming) messages.push(incoming)
      }
    }

    if (eventType === 'slash_command' || (rawPayload.command as string | undefined)) {
      const slashPayload = rawPayload as unknown as SlackSlashCommandPayload
      const incoming = await this.processSlashCommand(slashPayload, context)
      if (incoming) messages.push(incoming)
    }

    if (messages.length > 0) {
      this.eventHandler?.({
        id: crypto.randomUUID(),
        channelType: 'slack',
        type: 'webhook_received',
        payload: { eventType },
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId ?? '',
        requestId: context.requestId,
      })
    }

    return messages
  }

  private async processEvent(event: SlackEvent, context: RequestContext): Promise<IncomingMessage | null> {
    const { createIncomingMessage } = await import('@conversation-platform/channel-core')
    const conversationId = event.channel ?? event.user ?? ''

    return createIncomingMessage({
      type: 'text',
      content: { text: event.text },
      attachments: (event.files ?? []).map(f => ({
        id: f.id,
        type: (f.filetype === 'jpg' || f.filetype === 'png' || f.filetype === 'gif' ? 'image' : 'file') as 'image' | 'file',
        url: f.url_private,
        fileName: f.name,
        fileSizeBytes: f.size,
        mimeType: f.mimetype,
      })),
      metadata: {
        channelType: 'slack',
        channelMessageId: event.ts,
        conversationId,
        threadId: event.thread_ts,
        timestamp: new Date(parseFloat(event.ts) * 1000).toISOString(),
        source: event.bot_id ? 'bot' : 'user',
      },
      user: {
        id: event.user ?? event.bot_id ?? '',
        name: event.user,
      },
      conversation: {
        id: conversationId,
        channelType: 'slack',
        channelConversationId: event.channel,
        metadata: { threadTs: event.thread_ts, eventType: event.type },
      },
      tenant: {
        id: context.tenantId ?? '',
      },
      raw: event as unknown as Record<string, unknown>,
    })
  }

  private async processSlashCommand(payload: SlackSlashCommandPayload, context: RequestContext): Promise<IncomingMessage | null> {
    const { createIncomingMessage } = await import('@conversation-platform/channel-core')

    return createIncomingMessage({
      type: 'text',
      content: { text: `${payload.command} ${payload.text}`.trim() },
      metadata: {
        channelType: 'slack',
        channelMessageId: payload.trigger_id,
        conversationId: payload.channel_id,
        timestamp: new Date().toISOString(),
        source: 'user',
      },
      user: {
        id: payload.user_id,
        name: payload.user_name,
      },
      conversation: {
        id: payload.channel_id,
        channelType: 'slack',
        channelConversationId: payload.channel_id,
        metadata: {
          command: payload.command,
          responseUrl: payload.response_url,
          teamId: payload.team_id,
          channelName: payload.channel_name,
        },
      },
      tenant: {
        id: context.tenantId ?? '',
      },
      raw: payload as unknown as Record<string, unknown>,
    })
  }
}
