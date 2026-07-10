export interface InstagramChannelConfig {
  enabled: boolean
  instagramBusinessAccountId: string
  accessToken: string
  appSecret: string
  webhookVerifyToken: string
  webhookUrl?: string
  rateLimitPerMinute?: number
  retryMaxAttempts?: number
  retryBackoffBaseMs?: number
}

export interface InstagramWebhookEntry {
  id: string
  time: number
  messaging?: Array<{
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message?: InstagramMessage
    postback?: InstagramPostback
    read?: InstagramReadReceipt
    delivery?: InstagramDeliveryReceipt
    reaction?: InstagramReaction
    story_mention?: InstagramStoryMentionData
  }>
  changes?: Array<{
    field: string
    value: Record<string, unknown>
  }>
}

export interface InstagramWebhookPayload {
  object: 'instagram' | 'page'
  entry: InstagramWebhookEntry[]
}

export interface InstagramMessage {
  mid: string
  text?: string
  attachments?: Array<{
    type: string
    payload: {
      url?: string
      id?: string
      sticker_id?: number
      media_type?: string
      width?: number
      height?: number
      name?: string
      mime_type?: string
    }
  }>
  quick_reply?: {
    payload: string
  }
  reply_to?: {
    mid: string
  }
  is_echo?: boolean
  metadata?: string
}

export interface InstagramPostback {
  mid: string
  title: string
  payload: string
  referral?: Record<string, unknown>
}

export interface InstagramReadReceipt {
  mid: string
  watermark: number
}

export interface InstagramDeliveryReceipt {
  mids: string[]
  watermark: number
}

export interface InstagramReaction {
  mid: string
  reaction: string
  emoji?: string
  action: 'react' | 'unreact'
}

export interface InstagramStoryMentionData {
  mid: string
  url: string
  id: string
}

export interface InstagramStoryMention {
  mentionId: string
  storyId: string
  mediaId: string
  url: string
  message?: string
  timestamp: string
  senderId: string
  recipientId: string
}

export interface InstagramComment {
  id: string
  text: string
  timestamp: string
  username: string
  mediaId: string
  parentId?: string
}

export interface InstagramHashtag {
  id: string
  name: string
}
