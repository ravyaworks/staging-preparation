import type { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelHealthStatus, ChannelCapabilitySet, OutgoingMessage, IncomingMessage, ChannelEventHandler } from '@conversation-platform/channel-core'
import { ChannelError, ChannelNotImplementedError, ChannelConfigError, ChannelAuthError } from '@conversation-platform/channel-core'
import { CapabilityRegistry } from '@conversation-platform/channel-core'
import type { RequestContext } from '@conversation-platform/types'
import type { TeamsChannelConfig, TeamsActivity, TeamsTokenResponse } from './types'

export class TeamsChannel implements ChannelInterface {
  readonly type = 'teams' as const
  readonly displayName = 'Microsoft Teams'
  readonly version = '1.0.0'

  private config: TeamsChannelConfig = { enabled: false }
  private connected = false
  private authenticated = false
  private accessToken?: string
  private tokenExpiresAt?: number
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
      botId: config.customConfig?.botId as string | undefined,
      botPassword: config.customConfig?.botPassword as string | undefined,
      tenantId: config.customConfig?.tenantId as string | undefined,
      appId: config.customConfig?.appId as string | undefined,
      appPassword: config.customConfig?.appPassword as string | undefined,
      authMode: config.customConfig?.authMode as TeamsChannelConfig['authMode'] ?? 'oauth2',
      webhookUrl: config.webhookUrl,
      webhookSecret: config.webhookSecret,
      enableAdaptiveCards: config.customConfig?.enableAdaptiveCards as boolean ?? true,
    }
  }

  async connect(auth: ChannelAuthConfig): Promise<void> {
    if (auth.type !== 'oauth2' && auth.type !== 'custom') {
      throw new ChannelAuthError('Teams requires oauth2 or custom authentication', 'teams')
    }

    if (this.config.authMode === 'oauth2') {
      await this.authenticateOAuth2()
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
    this.authenticated = false
    this.accessToken = undefined
    this.tokenExpiresAt = undefined
    this.healthStatus = {
      healthy: false,
      status: 'disconnected',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }
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

    if (this.config.authMode === 'oauth2' && this.isTokenExpired()) {
      try {
        await this.authenticateOAuth2()
      } catch {
        return {
          healthy: false,
          status: 'error',
          latencyMs: 0,
          lastCheckedAt: new Date().toISOString(),
          error: 'Token refresh failed',
        }
      }
    }

    return {
      ...this.healthStatus,
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
    }
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'teams')
    }

    if (this.config.authMode === 'oauth2' && this.isTokenExpired()) {
      await this.authenticateOAuth2()
    }

    return message.id
  }

  async sendTypingIndicator(_conversationId: string, _isTyping: boolean, _tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'teams')
    }
  }

  async markAsRead(_messageId: string, _conversationId: string, _tenantId: string): Promise<void> {
    if (!this.connected) {
      throw new ChannelError('Channel not connected', 'CHANNEL_NOT_CONNECTED', 'teams')
    }
  }

  getCapabilities(): ChannelCapabilitySet {
    return CapabilityRegistry.DEFAULT_CAPABILITIES.teams
  }

  getConfig(): ChannelConfig {
    return {
      enabled: this.config.enabled,
      webhookUrl: this.config.webhookUrl,
      webhookSecret: this.config.webhookSecret,
      customConfig: {
        botId: this.config.botId,
        tenantId: this.config.tenantId,
        appId: this.config.appId,
        authMode: this.config.authMode,
        enableAdaptiveCards: this.config.enableAdaptiveCards,
      },
    }
  }

  async updateConfig(config: Partial<ChannelConfig>): Promise<void> {
    if (config.enabled !== undefined) this.config.enabled = config.enabled
    if (config.webhookUrl !== undefined) this.config.webhookUrl = config.webhookUrl
    if (config.webhookSecret !== undefined) this.config.webhookSecret = config.webhookSecret
    if (config.customConfig) {
      const cc = config.customConfig
      if (cc.botId !== undefined) this.config.botId = cc.botId as string
      if (cc.botPassword !== undefined) this.config.botPassword = cc.botPassword as string
      if (cc.tenantId !== undefined) this.config.tenantId = cc.tenantId as string
      if (cc.appId !== undefined) this.config.appId = cc.appId as string
      if (cc.appPassword !== undefined) this.config.appPassword = cc.appPassword as string
      if (cc.authMode !== undefined) this.config.authMode = cc.authMode as TeamsChannelConfig['authMode']
      if (cc.enableAdaptiveCards !== undefined) this.config.enableAdaptiveCards = cc.enableAdaptiveCards as boolean
    }
  }

  onEvent(handler: ChannelEventHandler): void {
    this.eventHandler = handler
  }

  validateConfig(config: ChannelConfig): string[] {
    const errors: string[] = []
    if (config.enabled === undefined) errors.push('enabled is required')
    const botId = config.customConfig?.botId as string | undefined
    const appId = config.customConfig?.appId as string | undefined
    const appPassword = config.customConfig?.appPassword as string | undefined
    if (!botId && !appId) errors.push('botId or appId is required')
    if (appId && !appPassword) errors.push('appPassword is required when appId is provided')
    return errors
  }

  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> {
    if (this.eventHandler) {
      await this.eventHandler({
        id: crypto.randomUUID(),
        channelType: 'teams',
        type: 'webhook_received',
        payload: rawPayload,
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId ?? 'unknown',
        requestId: context.requestId,
      })
    }

    throw new ChannelNotImplementedError('processIncoming', 'teams')
  }

  private async authenticateOAuth2(): Promise<void> {
    const { tenantId, appId, appPassword } = this.config
    if (!tenantId || !appId || !appPassword) {
      throw new ChannelAuthError('tenantId, appId, and appPassword required for OAuth2', 'teams')
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    const body = new URLSearchParams({
      client_id: appId,
      client_secret: appPassword,
      scope: 'https://api.botframework.com/.default',
      grant_type: 'client_credentials',
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!response.ok) {
        throw new ChannelAuthError(`OAuth2 token request failed: ${response.status}`, 'teams')
      }

      const data = (await response.json()) as TeamsTokenResponse
      this.accessToken = data.accessToken
      this.tokenExpiresAt = Date.now() + data.expiresIn * 1000
      this.authenticated = true
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown OAuth2 error'
      throw new ChannelAuthError(`Teams OAuth2 authentication failed: ${msg}`, 'teams')
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true
    return Date.now() >= this.tokenExpiresAt - 60000
  }

  getAccessToken(): string | undefined {
    return this.accessToken
  }

  isAuthenticated(): boolean {
    return this.authenticated
  }
}
