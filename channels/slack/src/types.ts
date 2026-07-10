export interface SlackChannelConfig {
  enabled: boolean
  botToken: string
  signingSecret: string
  appId?: string
  clientId?: string
  clientSecret?: string
  slashCommands?: SlackSlashCommand[]
}

export interface SlackSlashCommand {
  command: string
  description: string
  usageHint?: string
}

export interface SlackEventPayload {
  token?: string
  team_id: string
  api_app_id: string
  event?: SlackEvent
  type: string
  event_id?: string
  event_time?: number
  authed_users?: string[]
  challenge?: string
}

export interface SlackEvent {
  type: string
  channel?: string
  user?: string
  text?: string
  ts: string
  thread_ts?: string
  subtype?: string
  bot_id?: string
  files?: SlackFile[]
}

export interface SlackFile {
  id: string
  name: string
  filetype: string
  mimetype: string
  size: number
  url_private: string
  url_private_download?: string
  permalink?: string
}

export interface SlackSlashCommandPayload {
  token: string
  team_id: string
  team_domain: string
  channel_id: string
  channel_name: string
  user_id: string
  user_name: string
  command: string
  text: string
  api_app_id: string
  response_url: string
  trigger_id: string
}

export interface SlackMessagePayload {
  channel: string
  text?: string
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
  thread_ts?: string
  reply_broadcast?: boolean
}

export interface SlackBlock {
  type: string
  block_id?: string
  text?: SlackTextObject
  elements?: SlackBlockElement[]
}

export interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn'
  text: string
  emoji?: boolean
}

export interface SlackBlockElement {
  type: string
  text?: SlackTextObject
  value?: string
  action_id?: string
  url?: string
}

export interface SlackAttachment {
  color?: string
  title?: string
  title_link?: string
  text?: string
  fields?: Array<{ title: string; value: string; short?: boolean }>
  image_url?: string
  thumb_url?: string
  footer?: string
  ts?: number
}

export interface SlackViewPayload {
  id: string
  team_id: string
  type: string
  title: { type: string; text: string }
  submit?: { type: string; text: string }
  blocks: SlackBlock[]
  state: { values: Record<string, Record<string, { type: string; value?: string }>> }
  hash: string
  private_metadata: string
  callback_id: string
  external_id?: string
}
