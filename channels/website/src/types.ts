export interface WebsiteSession {
  id: string
  visitorId: string
  conversationId: string
  tenantId: string
  startedAt: string
  lastActivityAt: string
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
  isActive: boolean
}

export interface WebsiteWidgetConfig {
  themeColor?: string
  position?: 'left' | 'right'
  title?: string
  subtitle?: string
  showAvatar?: boolean
  allowAttachments?: boolean
  allowVoiceMessages?: boolean
  greetingMessage?: string
  offlineMessage?: string
  enableTypingIndicator?: boolean
  enableReconnect?: boolean
  maxAttachmentSize?: number
}

export interface WebsiteChannelConfig extends Record<string, unknown> {
  enabled: boolean
  allowedOrigins?: string[]
  sessionTimeoutMinutes?: number
  maxMessageLength?: number
  widgetConfig?: WebsiteWidgetConfig
}
