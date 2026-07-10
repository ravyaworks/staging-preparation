import type { ChannelConfig } from '@conversation-platform/channel-core'

export interface ApiChannelConfig extends ChannelConfig {
  apiKey?: string
  allowedIps?: string[]
}
