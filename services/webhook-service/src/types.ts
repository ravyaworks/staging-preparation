export interface WebhookConfig {
  id: string
  tenantId: string
  name: string
  url: string
  secret: string
  events: string[]
  enabled: boolean
  retryMaxAttempts: number
  retryBackoffBaseMs: number
  timeoutMs: number
  headers?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface WebhookRegistration {
  config: WebhookConfig
  status: 'active' | 'inactive' | 'failing'
  lastDeliveryAt?: string
  lastSuccessAt?: string
  lastFailureAt?: string
  consecutiveFailures: number
}

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying'

export interface WebhookDeliveryAttempt {
  id: string
  webhookId: string
  tenantId: string
  event: string
  payload: Record<string, unknown>
  status: WebhookDeliveryStatus
  attemptNumber: number
  statusCode?: number
  responseBody?: string
  durationMs: number
  error?: string
  timestamp: string
}

export interface WebhookEvent {
  id: string
  type: string
  tenantId: string
  channelType?: string
  payload: Record<string, unknown>
  timestamp: string
}

export interface WebhookSecurityConfig {
  algorithm: 'sha256' | 'sha512'
  headerName: string
  timestampToleranceSeconds: number
}

export interface WebhookStats {
  totalWebhooks: number
  activeWebhooks: number
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  retryRate: number
  averageLatencyMs: number
  uptimePercent: number
}

export class WebhookError extends Error {
  public override name = 'WebhookError'
  public code: string
  constructor(message: string, code = 'WEBHOOK_ERROR') {
    super(message)
    this.code = code
  }
}

export class WebhookValidationError extends WebhookError {
  public override name = 'WebhookValidationError'
  constructor(message: string) {
    super(message, 'WEBHOOK_VALIDATION_ERROR')
  }
}

export class WebhookDeliveryError extends WebhookError {
  public override name = 'WebhookDeliveryError'
  public webhookId: string
  public statusCode?: number
  constructor(message: string, webhookId: string, statusCode?: number) {
    super(message, 'WEBHOOK_DELIVERY_ERROR')
    this.webhookId = webhookId
    this.statusCode = statusCode
  }
}

export class WebhookSignatureError extends WebhookError {
  public override name = 'WebhookSignatureError'
  constructor(message: string) {
    super(message, 'WEBHOOK_SIGNATURE_ERROR')
  }
}
