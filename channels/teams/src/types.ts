export type TeamsAuthMode = 'oauth2' | 'app_only'

export interface TeamsChannelConfig extends Record<string, unknown> {
  enabled: boolean
  botId?: string
  botPassword?: string
  tenantId?: string
  appId?: string
  appPassword?: string
  authMode?: TeamsAuthMode
  webhookUrl?: string
  webhookSecret?: string
  enableAdaptiveCards?: boolean
}

export interface TeamsActivity {
  type: 'message' | 'conversationUpdate' | 'invoke' | 'event' | 'typing'
  id: string
  timestamp: string
  serviceUrl: string
  channelId: string
  from: {
    id: string
    name?: string
    aadObjectId?: string
  }
  conversation: {
    id: string
    conversationType?: 'personal' | 'group' | 'channel'
    tenantId?: string
  }
  recipient?: {
    id: string
    name?: string
  }
  text?: string
  attachments?: Array<{
    contentType: string
    content?: Record<string, unknown>
    name?: string
    thumbnailUrl?: string
  }>
  entities?: Array<Record<string, unknown>>
  replyToId?: string
  value?: Record<string, unknown>
  locale?: string
  localTimestamp?: string
}

export interface TeamsTokenResponse {
  tokenType: string
  expiresIn: number
  accessToken: string
  resource?: string
}

export interface TeamsAdaptiveCard {
  type: 'AdaptiveCard'
  version: string
  body: Array<Record<string, unknown>>
  actions?: Array<Record<string, unknown>>
  $schema?: string
}
