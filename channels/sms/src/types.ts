export type SmsProvider = 'twilio' | 'vonage' | 'custom'

export type SmsDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered' | 'unknown'

export interface SmsMessage {
  id: string
  to: string
  from: string
  body: string
  segments?: number
  status: SmsDeliveryStatus
  errorCode?: string
  errorMessage?: string
  timestamp: string
  providerMessageId?: string
}

export interface SmsChannelConfig extends Record<string, unknown> {
  enabled: boolean
  provider: SmsProvider
  accountSid?: string
  authToken?: string
  fromNumber: string
  messagingServiceSid?: string
  webhookUrl?: string
  webhookSecret?: string
  maxMessageLength?: number
  retryMaxAttempts?: number
  retryBackoffBaseMs?: number
}

export interface SmsWebhookPayload {
  MessageSid?: string
  SmsSid?: string
  SmsStatus?: string
  MessageStatus?: string
  To?: string
  From?: string
  Body?: string
  NumMedia?: string
  MediaUrl0?: string
  MediaContentType0?: string
  AccountSid?: string
  MessagingServiceSid?: string
  ErrorCode?: string
  ErrorMessage?: string
}

export interface SmsDeliveryReceipt {
  messageId: string
  providerMessageId: string
  status: SmsDeliveryStatus
  to: string
  from: string
  errorCode?: string
  errorMessage?: string
  timestamp: string
}
