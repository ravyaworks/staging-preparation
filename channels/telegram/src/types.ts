export interface TelegramChannelConfig {
  enabled: boolean
  botToken: string
  webhookUrl?: string
  allowedUpdates?: string[]
  commands?: TelegramBotCommand[]
}

export interface TelegramBotCommand {
  command: string
  description: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  entities?: TelegramMessageEntity[]
  photo?: TelegramPhotoSize[]
  document?: TelegramDocument
  audio?: TelegramAudio
  video?: TelegramVideo
  voice?: TelegramVoice
  location?: TelegramLocation
  contact?: TelegramContact
  reply_markup?: TelegramInlineKeyboardMarkup
}

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramMessageEntity {
  type: string
  offset: number
  length: number
  url?: string
  user?: TelegramUser
  language?: string
}

export interface TelegramPhotoSize {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export interface TelegramDocument {
  file_id: string
  file_unique_id: string
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramAudio {
  file_id: string
  file_unique_id: string
  duration: number
  title?: string
  performer?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramVideo {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  duration: number
  mime_type?: string
  file_size?: number
}

export interface TelegramVoice {
  file_id: string
  file_unique_id: string
  duration: number
  mime_type?: string
  file_size?: number
}

export interface TelegramLocation {
  latitude: number
  longitude: number
}

export interface TelegramContact {
  phone_number: string
  first_name: string
  last_name?: string
  user_id?: number
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  inline_message_id?: string
  chat_instance: string
  data?: string
  game_short_name?: string
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][]
}

export interface TelegramInlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
  web_app?: { url: string }
}
