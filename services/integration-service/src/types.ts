import type { ChannelType, ChannelStatus } from '@conversation-platform/channel-core'

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'suspended'

export interface IntegrationConfig {
  id: string
  tenantId: string
  channelType: ChannelType
  name: string
  enabled: boolean
  connectedAt?: string
  lastActivityAt?: string
  status: IntegrationStatus
  error?: string
  settings: Record<string, unknown>
}

export interface IntegrationConnection {
  id: string
  integrationId: string
  tenantId: string
  channelType: ChannelType
  status: ChannelStatus
  connectedAt?: string
  disconnectedAt?: string
  error?: string
  metadata: Record<string, unknown>
}

export interface IntegrationApiKey {
  id: string
  tenantId: string
  name: string
  keyPrefix: string
  keyHash: string
  scopes: string[]
  expiresAt?: string
  lastUsedAt?: string
  createdAt: string
  enabled: boolean
}

export interface IntegrationLog {
  id: string
  integrationId: string
  tenantId: string
  type: 'info' | 'warning' | 'error'
  message: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface IntegrationUsage {
  integrationId: string
  tenantId: string
  periodStart: string
  periodEnd: string
  messagesSent: number
  messagesReceived: number
  errors: number
  totalLatencyMs: number
  averageLatencyMs: number
}

export interface IntegrationStats {
  totalIntegrations: number
  activeIntegrations: number
  totalMessagesToday: number
  totalErrorsToday: number
  averageLatencyMs: number
  topChannels: Array<{ channelType: ChannelType; messageCount: number }>
}

export class IntegrationError extends Error {
  public override name = 'IntegrationError'
  public code: string
  constructor(message: string, code = 'INTEGRATION_ERROR') {
    super(message)
    this.code = code
  }
}

export class IntegrationAuthError extends IntegrationError {
  public override name = 'IntegrationAuthError'
  constructor(message: string) {
    super(message, 'INTEGRATION_AUTH_ERROR')
  }
}

export class IntegrationConnectionError extends IntegrationError {
  public override name = 'IntegrationConnectionError'
  constructor(message: string) {
    super(message, 'INTEGRATION_CONNECTION_ERROR')
  }
}

export class IntegrationRateLimitError extends IntegrationError {
  public override name = 'IntegrationRateLimitError'
  constructor(message: string) {
    super(message, 'INTEGRATION_RATE_LIMIT_ERROR')
  }
}
