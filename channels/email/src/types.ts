export type EmailProvider = 'sendgrid' | 'ses' | 'smtp'

export interface EmailAddress {
  name?: string
  address: string
}

export interface EmailAttachment {
  filename: string
  content: string
  contentType: string
  contentId?: string
  size?: number
}

export interface EmailMessage {
  id: string
  subject: string
  body: string
  bodyType: 'text/plain' | 'text/html'
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  replyTo?: EmailAddress
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
  threadId?: string
  inReplyTo?: string
  references?: string[]
  timestamp: string
}

export interface EmailChannelConfig extends Record<string, unknown> {
  enabled: boolean
  provider: EmailProvider
  apiKey?: string
  fromAddress: string
  fromName?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  imapHost?: string
  imapPort?: number
  imapUser?: string
  imapPass?: string
  webhookUrl?: string
  webhookSecret?: string
  maxAttachmentSize?: number
  allowedAttachmentTypes?: string[]
}

export interface IncomingEmailPayload {
  id: string
  subject: string
  body: string
  bodyType?: string
  from: { name?: string; address: string }
  to: Array<{ name?: string; address: string }>
  cc?: Array<{ name?: string; address: string }>
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
    size?: number
  }>
  headers?: Record<string, string>
  threadId?: string
  inReplyTo?: string
  references?: string[]
  timestamp?: string
}
