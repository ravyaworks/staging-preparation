import type { ChannelConfig } from '@conversation-platform/channel-core'

export type CustomAuthType = 'api_key' | 'basic_auth' | 'bearer_token' | 'custom'

export interface CustomChannelConfig extends ChannelConfig {
  channelName: string
  authType?: CustomAuthType
  credentials?: Record<string, string>
}

export type CustomParserFunction = (
  rawPayload: Record<string, unknown>,
) => Record<string, unknown> | Record<string, unknown>[]
