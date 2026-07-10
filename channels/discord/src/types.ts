export interface DiscordChannelConfig {
  enabled: boolean
  botToken: string
  applicationId: string
  publicKey: string
  guildId?: string
}

export interface DiscordInteraction {
  id: string
  application_id: string
  type: DiscordInteractionType
  data?: DiscordInteractionData
  guild_id?: string
  channel_id?: string
  member?: DiscordGuildMember
  user?: DiscordUser
  token: string
  version: number
  message?: DiscordMessage
}

export type DiscordInteractionType = 1 | 2 | 3 | 4 | 5

export interface DiscordInteractionData {
  id: string
  name: string
  type?: number
  resolved?: Record<string, unknown>
  options?: DiscordInteractionOption[]
  guild_id?: string
  target_id?: string
}

export interface DiscordInteractionOption {
  name: string
  type: number
  value?: string | number | boolean
  options?: DiscordInteractionOption[]
}

export interface DiscordGuildMember {
  user?: DiscordUser
  nick?: string
  roles: string[]
  joined_at: string
  premium_since?: string
  deaf: boolean
  mute: boolean
}

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  global_name?: string
  avatar?: string
  bot?: boolean
  locale?: string
}

export interface DiscordMessage {
  id: string
  channel_id: string
  author?: DiscordUser
  content?: string
  timestamp: string
  edited_timestamp?: string
  tts: boolean
  mention_everyone: boolean
  mentions: DiscordUser[]
  attachments: DiscordAttachment[]
  embeds: DiscordEmbed[]
  components?: DiscordComponent[]
}

export interface DiscordAttachment {
  id: string
  filename: string
  size: number
  url: string
  proxy_url: string
  content_type?: string
  width?: number
  height?: number
}

export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  timestamp?: string
  color?: number
  footer?: { text: string; icon_url?: string }
  image?: { url: string }
  thumbnail?: { url: string }
  author?: { name: string; url?: string; icon_url?: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}

export interface DiscordComponent {
  type: number
  components?: DiscordComponent[]
  custom_id?: string
  label?: string
  style?: number
  url?: string
  options?: Array<{ label: string; value: string; description?: string }>
}

export interface DiscordMessagePayload {
  content?: string
  embeds?: DiscordEmbed[]
  components?: DiscordComponent[]
  tts?: boolean
  flags?: number
}
