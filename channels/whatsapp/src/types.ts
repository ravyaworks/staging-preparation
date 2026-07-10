export interface WhatsAppChannelConfig {
  enabled: boolean
  phoneNumberId: string
  businessAccountId: string
  apiVersion: string
  webhookVerifyToken: string
  appSecret: string
  webhookUrl?: string
  rateLimitPerMinute?: number
  retryMaxAttempts?: number
  retryBackoffBaseMs?: number
}

export type WhatsAppMessageStatusType =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'pending'
  | 'rejected'

export interface WhatsAppMessageStatus {
  id: string
  recipientId: string
  status: WhatsAppMessageStatusType
  timestamp: string
  error?: {
    code: number
    title: string
    message: string
  }
  conversation?: {
    id: string
    origin: string
    expirationTimestamp?: string
  }
  pricing?: {
    billable: boolean
    pricingModel: string
    category: string
  }
}

export interface WhatsAppWebhookEntry {
  id: string
  changes: Array<{
    field: string
    value: {
      messaging_product: string
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
        type: string
        text?: { body: string }
        image?: { id: string; mime_type: string; sha256: string; caption?: string }
        document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string }
        audio?: { id: string; mime_type: string; sha256: string; voice?: boolean }
        video?: { id: string; mime_type: string; sha256: string; caption?: string }
        sticker?: { id: string; mime_type: string; sha256: string; animated?: boolean }
        location?: { latitude: number; longitude: number; name?: string; address?: string }
        contacts?: Array<{
          name: { formatted_name: string; first_name?: string; last_name?: string }
          phones?: Array<{ phone: string; type?: string }>
          emails?: Array<{ email: string; type?: string }>
          org?: { company?: string; department?: string; title?: string }
        }>
        interactive?: {
          type: string
          button_reply?: { id: string; title: string }
          list_reply?: { id: string; title: string; description?: string }
        }
        button?: { payload: string; text: string }
        context?: {
          from: string
          id: string
          referred_product?: { catalog_id: string; product_retailer_id: string }
        }
        referral?: {
          source_url: string
          source_id: string
          source_type: string
          headline?: string
          body?: string
          media_type?: string
          image_url?: string
          video_url?: string
          thumbnail_url?: string
        }
        identity?: {
          acknowledged: string
          created_timestamp: string
          hash: string
        }
        system?: {
          body: string
          identity: string
          wa_id: string
          type: string
          customer?: string
        }
        errors?: Array<{
          code: number
          title: string
          message: string
          error_data?: { details: string }
        }>
      }>
      statuses?: WhatsAppMessageStatus[]
    }
  }>
}

export interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppWebhookEntry[]
}

export interface WhatsAppTemplate {
  name: string
  language: {
    code: string
    policy?: 'deterministic' | 'fallback'
  }
  components?: Array<{
    type: 'header' | 'body' | 'footer' | 'button'
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video'
      text?: string
      currency?: { fallback_value: string; code: string; amount_1000: number }
      date_time?: { fallback_value: string }
      image?: { id?: string; link?: string }
      document?: { id?: string; link?: string; filename?: string }
      video?: { id?: string; link?: string }
    }>
    sub_type?: 'quick_reply' | 'url' | 'catalog' | 'mpm'
    index?: number
  }>
}

export interface WhatsAppInteractiveAction {
  type: 'button' | 'list' | 'catalog' | 'product' | 'product_list' | 'cta_url' | 'cta_call' | 'cta_copy' | 'flow' | 'order_details' | 'review_and_pay' | 'payment' | 'voice_call' | 'shipping_update' | 'tracking' | 'location_request' | 'address' | 'coupon_code' | 'limited_time_offer' | 'whatsapp_pay' | 'dispute' | 'dispute_status' | 'order_status' | 'recharge' | 'view_cart'
  buttons?: Array<{
    type: 'reply' | 'url' | 'phone_number' | 'flow' | 'copy_code' | 'cta_url' | 'cta_call' | 'cta_copy' | 'quick_reply' | 'catalog' | 'mpm' | 'payment' | 'order_details' | 'review_and_pay' | 'voice_call' | 'shipping_update' | 'tracking' | 'location' | 'address' | 'coupon_code' | 'limited_time_offer' | 'whatsapp_pay' | 'dispute' | 'dispute_status' | 'order_status' | 'recharge' | 'view_cart'
    reply?: { id: string; title: string }
    url?: { display_text: string; url: string }
    phone_number?: { display_text: string; phone_number: string }
    flow?: { id: string; name?: string; parameters?: Record<string, unknown>; mode?: 'draft' | 'published' }
    copy_code?: { code: string; timeout?: number }
  }>
  sections?: Array<{
    title?: string
    rows: Array<{
      id: string
      title: string
      description?: string
    }>
  }>
  catalog_id?: string
  product_retailer_id?: string
  name?: string
  parameters?: Record<string, unknown>
}

export interface WhatsAppInteractiveMessage {
  type: 'button' | 'list' | 'catalog' | 'product' | 'product_list' | 'cta_url' | 'cta_call' | 'cta_copy' | 'flow' | 'location_request' | 'order_details' | 'payment' | 'review_and_pay' | 'voice_call' | 'shipping_update' | 'tracking' | 'address' | 'coupon_code' | 'limited_time_offer' | 'whatsapp_pay' | 'dispute' | 'dispute_status' | 'order_status' | 'recharge' | 'view_cart'
  header?: {
    type: 'text' | 'image' | 'document' | 'video'
    text?: string
    image?: { id?: string; link?: string }
    document?: { id?: string; link?: string; filename?: string }
    video?: { id?: string; link?: string }
  }
  body: { text: string }
  footer?: { text: string }
  action: WhatsAppInteractiveAction
}

export interface WhatsAppLocationMessage {
  longitude: number
  latitude: number
  name?: string
  address?: string
}

export interface WhatsAppContactMessage {
  addresses?: Array<{
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    country_code?: string
    type?: 'HOME' | 'WORK'
  }>
  birthday?: string
  emails?: Array<{
    email?: string
    type?: 'HOME' | 'WORK'
  }>
  name: {
    formatted_name: string
    first_name?: string
    last_name?: string
    middle_name?: string
    suffix?: string
    prefix?: string
  }
  org?: {
    company?: string
    department?: string
    title?: string
  }
  phones?: Array<{
    phone?: string
    wa_id?: string
    type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK'
  }>
  urls?: Array<{
    url?: string
    type?: 'HOME' | 'WORK'
  }>
}
