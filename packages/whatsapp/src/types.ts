export type WhatsAppApiVersion = 'v22.0' | 'v21.0' | 'v20.0' | 'v19.0' | 'v18.0' | 'v17.0'

export interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
  businessAccountId: string
  apiVersion: WhatsAppApiVersion
  baseUrl?: string
  webhookVerifyToken: string
  appSecret?: string
  requestTimeoutMs: number
  maxRetries: number
  retryDelayMs: number
}

export type MessageType =
  | 'text'
  | 'template'
  | 'image'
  | 'document'
  | 'video'
  | 'audio'
  | 'interactive'
  | 'location'
  | 'contacts'
  | 'sticker'
  | 'reaction'

export type WebhookEventType =
  | 'messages'
  | 'message_template_status_update'
  | 'account_alerts'
  | 'message_template_quality_update'
  | 'phone_number_name_update'

export type MessageStatus =
  | 'accepted'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'deleted'
  | 'warning'

export type TemplateStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'PENDING_DELETION'
  | 'DELETED'
  | 'IN_APPEAL'
  | 'FLAGGED'
  | 'DISABLED'

export type TemplateCategory = 'AUTHENTICATION' | 'MARKETING' | 'UTILITY'

export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp'
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export interface WhatsAppErrorResponse {
  error: {
    message: string
    type: string
    code: number
    error_data?: {
      details: string
    }
    fbtrace_id: string
  }
}

export interface WhatsAppWebhookEntry {
  id: string
  changes: Array<{
    field: string
    value: {
      messaging_product: 'whatsapp'
      metadata: {
        display_phone_number: string
        phone_number_id: string
      }
      contacts?: Array<{
        profile: { name: string }
        wa_id: string
      }>
      messages?: Array<{
        from: string
        id: string
        timestamp: string
        type: MessageType
        text?: { body: string }
        image?: { id: string; mime_type: string; sha256: string }
        document?: { id: string; mime_type: string; sha256: string; filename?: string }
        video?: { id: string; mime_type: string; sha256: string }
        audio?: { id: string; mime_type: string; sha256: string; voice?: boolean }
        interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } }
        location?: { latitude: number; longitude: number; name?: string; address?: string }
        context?: { message_id: string; from: string }
        referral?: { source_url: string; source_type: string; headline?: string; body?: string; media_type?: string; image_url?: string; video_url?: string }
      }>
      statuses?: Array<{
        id: string
        status: MessageStatus
        timestamp: string
        recipient_id: string
        type?: string
        conversation?: { id: string; origin: { type: string } }
        pricing?: { billable: boolean; pricing_model: string; category: string }
        errors?: Array<{ code: number; title: string; message: string; error_data?: { details: string } }>
      }>
      errors?: Array<{ code: number; title: string; message: string }>
    }
  }>
}

export type WebhookChange = WhatsAppWebhookEntry['changes'][number]

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account'
  entry: WhatsAppWebhookEntry[]
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE' | 'OTP'
  text: string
  url?: string
  phone_number?: string
  otp_type?: 'COPY_CODE' | 'ONE_TAP'
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO'
  text?: string
  example?: { header_text?: string[]; body_text?: string[][] }
  buttons?: TemplateButton[]
}

export interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  category: TemplateCategory
  status: TemplateStatus
  components: TemplateComponent[]
  created_at: string
  updated_at: string
}

export interface MediaUploadResponse {
  id: string
  url?: string
}

export interface WhatsAppSenderResult {
  success: boolean
  messageId?: string
  error?: string
  metadata?: Record<string, unknown>
  waId?: string
  status?: MessageStatus
}

export class WhatsAppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly fbTraceId?: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'WhatsAppError'
  }
}
