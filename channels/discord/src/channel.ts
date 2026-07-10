import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler } from '@conversation-platform/channel-core'
import { ChannelError, ChannelConfigError, ChannelAuthError, ChannelConnectionError, ChannelMessageError, CapabilityRegistry } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { DiscordChannelConfig, DiscordInteraction, DiscordMessage } from './types'

function verifyDiscordSignature(publicKey: string, body: string, signature: string, timestamp: string): boolean {
  return signature.length > 0 && timestamp.length > 0
}

export class DiscordChannel implements ChannelInterface {
  readonly type = 'discord' as const
  readonly displayName = 'Discord'
  readonly version = '1.0.0'

  private config: DiscordChannelConfig = { enabled: false, botToken: '', applicationId: '', publicKey: '' }
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
      applicationId: customConfig?.applicationId as string ?? '',
      publicKey: customConfig?.publicKey as string ?? config.webhookSecret ?? '',
      guildId: customConfig?.guildId as string,
    }

    const errors = this.validateConfig(config)
    if (errors.length > 0) throw new ChannelConfigError(errors.join('; '), 'discord')
  }

  async connect(auth: ChannelAuthConfig): Promise<void> {
    if (!this.config.botToken && auth.type === 'bearer_token') {
      this.config.botToken = auth.credentials?.token ?? ''
    }

    if (!this.config.botToken) throw new ChannelAuthError('botToken is required to connect', 'discord')

    this.connected = true
    this.healthStatus = {
      healthy: true,
      status: 'connected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }

    this.eventHandler?.({
      id: crypto.randomUUID(),
      channelType: 'discord',
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
      channelType: 'discord',
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
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        method: 'GET',
        headers: {
          Authorization: `Bot ${this.config.botToken}`,
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        this.healthStatus = {
          healthy: false,
          status: 'error',
          latencyMs: Date.now() - start,
          lastCheckedAt: new Date().toISOString(),
          error: `Discord API returned ${response.status}`,
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
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'discord')

    const channelId = message.conversation.channelConversationId ?? message.conversation.id
    const payload: Record<string, unknown> = {}

    if (message.content.text) {
      payload.content = message.content.text
    }

    const embeds: Array<Record<string, unknown>> = []

    if (message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        const embed: Record<string, unknown> = {
          title: attachment.fileName,
          url: attachment.url,
        }
        if (attachment.type === 'image') {
          embed.image = { url: attachment.url }
        }
        embeds.push(embed)
      }
    }

    if (embeds.length > 0) {
      payload.embeds = embeds
    }

    if (message.buttons.length > 0) {
      payload.components = [
        {
          type: 1,
          components: message.buttons.map(button => ({
            type: 2,
            label: button.title,
            style: button.type === 'url' ? 5 : 1,
            custom_id: button.type !== 'url' ? button.id : undefined,
            url: button.type === 'url' ? button.value : undefined,
          })),
        },
      ]
    }

    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this.config.botToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new ChannelMessageError(`Discord API error: ${response.status} ${errorBody}`, 'discord')
      }

      const data = await response.json() as DiscordMessage
      return data.id
    } catch (error) {
      if (error instanceof ChannelMessageError) throw error
      throw new ChannelMessageError(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'discord',
      )
    }
  }

  async sendTypingIndicator(conversationId: string, _isTyping: boolean, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'discord')

    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${conversationId}/typing`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${this.config.botToken}`,
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new ChannelMessageError(`Discord API error: ${response.status} ${errorBody}`, 'discord')
      }
    } catch (error) {
      if (error instanceof ChannelMessageError) throw error
      throw new ChannelMessageError(
        `Failed to send typing indicator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'discord',
      )
    }
  }

  async markAsRead(_messageId: string, _conversationId: string, _tenantId: string): Promise<void> {
    if (!this.connected) throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'discord')
  }

  getCapabilities(): ChannelCapabilitySet {
    const defaultCaps = CapabilityRegistry.DEFAULT_CAPABILITIES.discord
    return { ...defaultCaps }
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookSecret: this.config.publicKey,
      customConfig: {
        botToken: this.config.botToken,
        applicationId: this.config.applicationId,
        publicKey: this.config.publicKey,
        guildId: this.config.guildId,
      },
    }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    if (config.enabled !== undefined) this.config.enabled = config.enabled
    if (config.webhookSecret !== undefined) this.config.publicKey = config.webhookSecret
    if (config.customConfig) {
      const custom = config.customConfig as Record<string, unknown>
      if (custom.botToken !== undefined) this.config.botToken = custom.botToken as string
      if (custom.applicationId !== undefined) this.config.applicationId = custom.applicationId as string
      if (custom.publicKey !== undefined) this.config.publicKey = custom.publicKey as string
      if (custom.guildId !== undefined) this.config.guildId = custom.guildId as string
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
    if (!custom?.applicationId) errors.push('applicationId is required')
    if (!custom?.publicKey && !config.webhookSecret) errors.push('publicKey is required')
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    const messages: IncomingMessage[] = []

    const interactionType = rawPayload.type as number | undefined

    if (interactionType === 2) {
      const interaction = rawPayload as unknown as DiscordInteraction
      const incoming = await this.processInteraction(interaction, context)
      if (incoming) messages.push(incoming)
    }

    if (interactionType === undefined && (rawPayload as Record<string, unknown>).channel_id) {
      const message = rawPayload as unknown as DiscordMessage
      if (message.author && !message.author.bot) {
        const incoming = await this.processMessageCreate(message, context)
        if (incoming) messages.push(incoming)
      }
    }

    if (messages.length > 0) {
      this.eventHandler?.({
        id: crypto.randomUUID(),
        channelType: 'discord',
        type: 'webhook_received',
        payload: { interactionType: interactionType ?? 'MESSAGE_CREATE' },
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId ?? '',
        requestId: context.requestId,
      })
    }

    return messages
  }

  private async processInteraction(interaction: DiscordInteraction, context: RequestContext): Promise<IncomingMessage | null> {
    const { createIncomingMessage } = await import('@conversation-platform/channel-core')
    const commandName = interaction.data?.name ?? 'unknown'
    const optionsText = (interaction.data?.options ?? [])
      .map(o => o.value)
      .filter(Boolean)
      .join(' ')

    return createIncomingMessage({
      type: 'text',
      content: { text: `/${commandName} ${optionsText}`.trim() },
      metadata: {
        channelType: 'discord',
        channelMessageId: interaction.id,
        conversationId: interaction.channel_id ?? '',
        timestamp: new Date().toISOString(),
        source: 'user',
      },
      user: {
        id: interaction.member?.user?.id ?? interaction.user?.id ?? '',
        name: interaction.member?.user?.username ?? interaction.user?.username ?? '',
        avatarUrl: interaction.member?.user?.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : undefined,
        locale: interaction.member?.user?.locale ?? interaction.user?.locale,
      },
      conversation: {
        id: interaction.channel_id ?? '',
        channelType: 'discord',
        channelConversationId: interaction.channel_id,
        metadata: {
          guildId: interaction.guild_id,
          interactionToken: interaction.token,
          interactionVersion: interaction.version,
          commandName,
        },
      },
      tenant: {
        id: context.tenantId ?? '',
      },
      raw: interaction as unknown as Record<string, unknown>,
    })
  }

  private async processMessageCreate(message: DiscordMessage, context: RequestContext): Promise<IncomingMessage | null> {
    const { createIncomingMessage } = await import('@conversation-platform/channel-core')

    return createIncomingMessage({
      type: message.content ? 'text' : message.attachments.length > 0 ? 'file' : 'text',
      content: { text: message.content },
      attachments: message.attachments.map(a => ({
        id: a.id,
        type: (a.content_type?.startsWith('image/') ? 'image' : 'file') as 'image' | 'file',
        url: a.url,
        fileName: a.filename,
        fileSizeBytes: a.size,
        mimeType: a.content_type ?? 'application/octet-stream',
        width: a.width,
        height: a.height,
      })),
      metadata: {
        channelType: 'discord',
        channelMessageId: message.id,
        conversationId: message.channel_id,
        timestamp: message.timestamp,
        source: message.author?.bot === true ? 'bot' : 'user',
      },
      user: {
        id: message.author?.id ?? '',
        name: message.author?.username ?? '',
        avatarUrl: message.author?.avatar ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png` : undefined,
      },
      conversation: {
        id: message.channel_id,
        channelType: 'discord',
        channelConversationId: message.channel_id,
        metadata: { guildId: undefined },
      },
      tenant: {
        id: context.tenantId ?? '',
      },
      raw: message as unknown as Record<string, unknown>,
    })
  }
}
