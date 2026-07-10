import type { RequestContext } from '@conversation-platform/types'

export type ChannelType =
  | 'website'
  | 'whatsapp'
  | 'instagram'
  | 'messenger'
  | 'telegram'
  | 'slack'
  | 'discord'
  | 'teams'
  | 'email'
  | 'sms'
  | 'api'
  | 'custom'

export type ChannelStatus = 'connected' | 'disconnected' | 'error' | 'connecting' | 'pending_config'

export interface ChannelConfig {
  enabled: boolean
  webhookUrl?: string
  webhookSecret?: string
  rateLimitPerMinute?: number
  retryMaxAttempts?: number
  retryBackoffBaseMs?: number
  customConfig?: Record<string, unknown>
}

export type ChannelCapability =
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'file'
  | 'button'
  | 'list'
  | 'quick_reply'
  | 'location'
  | 'contact'
  | 'typing_indicator'
  | 'delivery_receipt'
  | 'read_receipt'
  | 'reaction'
  | 'thread'
  | 'template'
  | 'interactive'
  | 'persistent_menu'
  | 'slash_command'
  | 'embed'
  | 'adaptive_card'

export interface ChannelCapabilitySet {
  incoming: ChannelCapability[]
  outgoing: ChannelCapability[]
  maxAttachmentSizeBytes?: number
  maxMessageLength?: number
  supportedAttachmentTypes?: string[]
  supportsReplies: boolean
  supportsThreads: boolean
  supportsRichText: boolean
}

export interface ChannelAuthConfig {
  type: 'api_key' | 'oauth2' | 'bearer_token' | 'basic_auth' | 'custom'
  credentials?: Record<string, string>
  tokenUrl?: string
  refreshTokenUrl?: string
  scopes?: string[]
}

export interface ChannelHealthStatus {
  healthy: boolean
  status: ChannelStatus
  latencyMs: number
  lastCheckedAt: string
  error?: string
  version?: string
}

export interface ChannelEvent {
  id: string
  channelType: ChannelType
  type: 'message_received' | 'message_sent' | 'message_delivered' | 'message_read'
    | 'typing_start' | 'typing_stop'
    | 'channel_connected' | 'channel_disconnected' | 'channel_error'
    | 'webhook_received' | 'webhook_failed'
  payload: Record<string, unknown>
  timestamp: string
  tenantId: string
  requestId?: string
}

export type ChannelEventHandler = (event: ChannelEvent) => void | Promise<void>

export type ChannelMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'file' | 'button' | 'list' | 'quick_reply' | 'location' | 'contact' | 'custom'

export interface ChannelMessageContent {
  type: ChannelMessageType
  text?: string
  imageUrl?: string
  documentUrl?: string
  audioUrl?: string
  videoUrl?: string
  fileUrl?: string
  fileName?: string
  fileSizeBytes?: number
  mimeType?: string
}

export interface ChannelMessageAttachment {
  id: string
  type: 'image' | 'document' | 'audio' | 'video' | 'file'
  url: string
  fileName: string
  fileSizeBytes: number
  mimeType: string
  width?: number
  height?: number
  durationSeconds?: number
}

export interface ChannelMessageButton {
  id: string
  title: string
  type: 'url' | 'postback' | 'phone_number' | 'quick_reply'
  value?: string
}

export interface ChannelMessageListOption {
  id: string
  title: string
  description?: string
}

export interface ChannelQuickReply {
  id: string
  title: string
  payload?: string
  imageUrl?: string
}

export interface ChannelLocation {
  latitude: number
  longitude: number
  name?: string
  address?: string
}

export interface ChannelContact {
  name: string
  phone?: string
  email?: string
  avatarUrl?: string
  organization?: string
}

export interface ChannelMessageMetadata {
  messageId: string
  conversationId: string
  channelType: ChannelType
  channelMessageId?: string
  parentMessageId?: string
  threadId?: string
  timestamp: string
  source: 'user' | 'agent' | 'system' | 'bot'
  priority?: 'normal' | 'high' | 'urgent'
  locale?: string
  tags?: string[]
  customFields?: Record<string, unknown>
}

export interface ChannelUserContext {
  id: string
  name?: string
  avatarUrl?: string
  email?: string
  phone?: string
  locale?: string
  timezone?: string
  metadata?: Record<string, unknown>
}

export interface ChannelConversationContext {
  id: string
  channelType: ChannelType
  channelConversationId?: string
  metadata?: Record<string, unknown>
}

export interface ChannelTenantContext {
  id: string
  name?: string
  domain?: string
  settings?: Record<string, unknown>
}

export interface IncomingMessage {
  id: string
  type: ChannelMessageType
  content: ChannelMessageContent
  attachments: ChannelMessageAttachment[]
  buttons: ChannelMessageButton[]
  listOptions: ChannelMessageListOption[]
  quickReplies: ChannelQuickReply[]
  location?: ChannelLocation
  contact?: ChannelContact
  metadata: ChannelMessageMetadata
  user: ChannelUserContext
  conversation: ChannelConversationContext
  tenant: ChannelTenantContext
  raw?: Record<string, unknown>
}

export interface OutgoingMessage {
  id: string
  type: ChannelMessageType
  content: ChannelMessageContent
  attachments: ChannelMessageAttachment[]
  buttons: ChannelMessageButton[]
  listOptions: ChannelMessageListOption[]
  quickReplies: ChannelQuickReply[]
  location?: ChannelLocation
  contact?: ChannelContact
  metadata: ChannelMessageMetadata
  user: ChannelUserContext
  conversation: ChannelConversationContext
  tenant: ChannelTenantContext
  customization?: Record<string, unknown>
}

export interface ChannelInterface {
  readonly type: ChannelType
  readonly displayName: string
  readonly version: string
  initialize(config: ChannelConfig): Promise<void>
  connect(auth: ChannelAuthConfig): Promise<void>
  disconnect(): Promise<void>
  healthCheck(): Promise<ChannelHealthStatus>
  sendMessage(message: OutgoingMessage): Promise<string>
  sendTypingIndicator(conversationId: string, isTyping: boolean, tenantId: string): Promise<void>
  markAsRead(messageId: string, conversationId: string, tenantId: string): Promise<void>
  getCapabilities(): ChannelCapabilitySet
  getConfig(): ChannelConfig
  updateConfig(config: Partial<ChannelConfig>): Promise<void>
  onEvent(handler: ChannelEventHandler): void
  validateConfig(config: ChannelConfig): string[]
  processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]>
}

export interface ChannelRegistration {
  channel: ChannelInterface
  tenantId: string
  config: ChannelConfig
  auth: ChannelAuthConfig
  status: ChannelStatus
  connectedAt?: string
  lastError?: string
}

export interface ChannelListOptions {
  status?: ChannelStatus
  type?: ChannelType
  tenantId?: string
}

export class ChannelError extends Error {
  public override name = 'ChannelError'
  public code: string
  public channelType?: ChannelType
  constructor(message: string, code = 'CHANNEL_ERROR', channelType?: ChannelType) {
    super(message)
    this.code = code
    this.channelType = channelType
  }
}

export class ChannelConfigError extends ChannelError {
  public override name = 'ChannelConfigError'
  constructor(message: string, channelType?: ChannelType) {
    super(message, 'CHANNEL_CONFIG_ERROR', channelType)
  }
}

export class ChannelAuthError extends ChannelError {
  public override name = 'ChannelAuthError'
  constructor(message: string, channelType?: ChannelType) {
    super(message, 'CHANNEL_AUTH_ERROR', channelType)
  }
}

export class ChannelConnectionError extends ChannelError {
  public override name = 'ChannelConnectionError'
  constructor(message: string, channelType?: ChannelType) {
    super(message, 'CHANNEL_CONNECTION_ERROR', channelType)
  }
}

export class ChannelMessageError extends ChannelError {
  public override name = 'ChannelMessageError'
  constructor(message: string, channelType?: ChannelType) {
    super(message, 'CHANNEL_MESSAGE_ERROR', channelType)
  }
}

export class ChannelRateLimitError extends ChannelError {
  public override name = 'ChannelRateLimitError'
  public retryAfterMs: number
  constructor(message: string, retryAfterMs: number, channelType?: ChannelType) {
    super(message, 'CHANNEL_RATE_LIMIT_ERROR', channelType)
    this.retryAfterMs = retryAfterMs
  }
}

export class ChannelNotImplementedError extends ChannelError {
  public override name = 'ChannelNotImplementedError'
  constructor(method: string, channelType?: ChannelType) {
    super(`Method ${method} not implemented for channel ${channelType ?? 'unknown'}`, 'CHANNEL_NOT_IMPLEMENTED', channelType)
  }
}
