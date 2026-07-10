export interface MessengerChannelConfig {
  enabled: boolean
  pageId: string
  appSecret: string
  accessToken: string
  webhookVerifyToken: string
  persistentMenu?: MessengerPersistentMenuItem[]
  webhookUrl?: string
  rateLimitPerMinute?: number
  retryMaxAttempts?: number
  retryBackoffBaseMs?: number
}

export interface MessengerPersistentMenuItem {
  locale?: string
  composer_input_disabled?: boolean
  call_to_actions: Array<{
    title: string
    type: 'postback' | 'web_url' | 'nested'
    payload?: string
    url?: string
    webview_height_ratio?: 'compact' | 'tall' | 'full'
    messenger_extensions?: boolean
    fallback_url?: string
    webview_share_button?: 'hide' | 'show'
    call_to_actions?: MessengerPersistentMenuItem['call_to_actions']
  }>
}

export interface MessengerWebhookEntry {
  id: string
  time: number
  messaging?: Array<{
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message?: MessengerMessage
    postback?: MessengerPostback
    read?: MessengerReadReceipt
    delivery?: MessengerDeliveryReceipt
    reaction?: MessengerReaction
    account_linking?: MessengerAccountLinking
    optin?: MessengerOptIn
    referral?: MessengerReferral
    game_play?: MessengerGamePlay
    policy_enforcement?: MessengerPolicyEnforcement
    app_roles?: MessengerAppRoles
    standby?: Array<Record<string, unknown>>
    pass_thread_control?: MessengerPassThreadControl
    take_thread_control?: MessengerTakeThreadControl
    request_thread_control?: MessengerRequestThreadControl
  }>
  changes?: Array<{
    field: string
    value: Record<string, unknown>
  }>
}

export interface MessengerWebhookPayload {
  object: 'page'
  entry: MessengerWebhookEntry[]
}

export interface MessengerMessage {
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
    attachment?: Record<string, unknown>
  }
  is_echo?: boolean
  metadata?: string
  app_id?: number
}

export interface MessengerPostback {
  mid: string
  title: string
  payload: string
  referral?: Record<string, unknown>
}

export interface MessengerReadReceipt {
  mid: string
  watermark: number
}

export interface MessengerDeliveryReceipt {
  mids: string[]
  watermark: number
}

export interface MessengerReaction {
  mid: string
  reaction: string
  emoji?: string
  action: 'react' | 'unreact'
}

export interface MessengerAccountLinking {
  status: 'linked' | 'unlinked'
  authorization_code?: string
}

export interface MessengerOptIn {
  ref: string
  user_ref?: string
}

export interface MessengerReferral {
  ref: string
  source: string
  type: string
  referer_uri?: string
  ad_id?: string
}

export interface MessengerGamePlay {
  game_id: string
  player_id: string
  context_type: string
  payload: string
}

export interface MessengerPolicyEnforcement {
  action: string
  reason: string
}

export interface MessengerAppRoles {
  [appId: string]: string[]
}

export interface MessengerPassThreadControl {
  new_owner_app_id: string
  metadata: string
}

export interface MessengerTakeThreadControl {
  previous_owner_app_id: string
  metadata: string
}

export interface MessengerRequestThreadControl {
  requested_owner_app_id: string
  metadata: string
}

export interface MessengerQuickReply {
  content_type: 'text' | 'location' | 'user_phone_number' | 'user_email'
  title?: string
  payload?: string
  image_url?: string
}

export interface MessengerAttachmentPayload {
  type: 'image' | 'audio' | 'video' | 'file'
  payload: {
    url?: string
    id?: string
    is_reusable?: boolean
  }
}

export interface MessengerButtonTemplatePayload {
  template_type: 'button'
  text: string
  buttons: Array<{
    type: 'web_url' | 'postback' | 'phone_number' | 'element_share' | 'payment' | 'game_play' | 'account_link' | 'account_unlink'
    title?: string
    url?: string
    payload?: string
    webview_height_ratio?: 'compact' | 'tall' | 'full'
    messenger_extensions?: boolean
    fallback_url?: string
    webview_share_button?: 'hide' | 'show'
  }>
  sharable?: boolean
}

export interface MessengerGenericTemplatePayload {
  template_type: 'generic'
  elements: Array<{
    title: string
    subtitle?: string
    image_url?: string
    default_action?: {
      type: 'web_url'
      url: string
      webview_height_ratio?: 'compact' | 'tall' | 'full'
      messenger_extensions?: boolean
      fallback_url?: string
      webview_share_button?: 'hide' | 'show'
    }
    buttons?: MessengerButtonTemplatePayload['buttons']
  }>
  sharable?: boolean
  image_aspect_ratio?: 'horizontal' | 'square'
}

export interface MessengerListTemplatePayload {
  template_type: 'list'
  top_element_style?: 'large' | 'compact'
  elements: Array<{
    title: string
    subtitle?: string
    image_url?: string
    default_action?: MessengerGenericTemplatePayload['elements'][0]['default_action']
    buttons?: MessengerButtonTemplatePayload['buttons']
  }>
  buttons?: MessengerButtonTemplatePayload['buttons']
  sharable?: boolean
}

export interface MessengerMediaTemplatePayload {
  template_type: 'media'
  elements: Array<{
    media_type: 'image' | 'video'
    attachment_id?: string
    url?: string
    buttons?: MessengerButtonTemplatePayload['buttons']
  }>
  sharable?: boolean
}

export interface MessengerTemplatePayload {
  template_type: string
  [key: string]: unknown
}
