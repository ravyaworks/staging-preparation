import type { Logger } from '@conversation-platform/logger'
import type { WebhookConfig, WebhookDeliveryAttempt, WebhookEvent } from './types'
import { WebhookDeliveryError } from './types'
import { WebhookRegistry } from './registry'
import { createSignatureHeader } from './security'

export class WebhookDispatcher {
  private registry: WebhookRegistry
  private logger?: Logger
  private deliveryLog: WebhookDeliveryAttempt[] = []
  private maxLogSize: number

  constructor(registry: WebhookRegistry, logger?: Logger, maxLogSize = 10000) {
    this.registry = registry
    this.logger = logger
    this.maxLogSize = maxLogSize
  }

  async dispatch(event: WebhookEvent): Promise<WebhookDeliveryAttempt[]> {
    const targets = this.registry.getByEvent(event.type, event.tenantId)
    if (targets.length === 0) return []

    const results: WebhookDeliveryAttempt[] = []

    for (const target of targets) {
      const attempt = await this.sendWithRetry(target.config, event)
      results.push(attempt)
      this.logDelivery(attempt)
    }

    return results
  }

  private async sendWithRetry(config: WebhookConfig, event: WebhookEvent): Promise<WebhookDeliveryAttempt> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= config.retryMaxAttempts; attempt++) {
      const result = await this.sendOnce(config, event, attempt)
      this.logger?.info?.('Webhook delivery attempt', {
        webhookId: config.id,
        attempt,
        status: result.status,
        statusCode: result.statusCode,
      })

      if (result.status === 'delivered') {
        this.registry.recordDelivery(config.id, true)
        return result
      }

      lastError = result.error ? new Error(result.error) : undefined
      this.registry.recordDelivery(config.id, false)

      if (attempt < config.retryMaxAttempts) {
        await this.sleep(config.retryBackoffBaseMs * Math.pow(2, attempt - 1))
      }
    }

    return {
      id: crypto.randomUUID(),
      webhookId: config.id,
      tenantId: config.tenantId,
      event: event.type,
      payload: event.payload,
      status: 'failed',
      attemptNumber: config.retryMaxAttempts,
      durationMs: 0,
      error: lastError?.message ?? 'Max retries exceeded',
      timestamp: new Date().toISOString(),
    }
  }

  private async sendOnce(config: WebhookConfig, event: WebhookEvent, attemptNumber: number): Promise<WebhookDeliveryAttempt> {
    const startTime = Date.now()
    const payload = JSON.stringify(event.payload)
    const signature = createSignatureHeader(payload, config.secret)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event.type,
      'X-Webhook-ID': event.id,
      'X-Webhook-Attempt': String(attemptNumber),
      ...config.headers,
    }

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: AbortSignal.timeout(config.timeoutMs),
      })

      const durationMs = Date.now() - startTime
      const responseBody = await response.text()

      if (response.ok) {
        return {
          id: crypto.randomUUID(),
          webhookId: config.id,
          tenantId: config.tenantId,
          event: event.type,
          payload: event.payload,
          status: 'delivered',
          attemptNumber,
          statusCode: response.status,
          responseBody: responseBody.slice(0, 1000),
          durationMs,
          timestamp: new Date().toISOString(),
        }
      }

      throw new WebhookDeliveryError(
        `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
        config.id,
        response.status,
      )
    } catch (error) {
      const durationMs = Date.now() - startTime
      const errMsg = error instanceof Error ? error.message : 'Unknown error'

      return {
        id: crypto.randomUUID(),
        webhookId: config.id,
        tenantId: config.tenantId,
        event: event.type,
        payload: event.payload,
        status: attemptNumber < config.retryMaxAttempts ? 'retrying' : 'failed',
        attemptNumber,
        durationMs,
        error: errMsg,
        timestamp: new Date().toISOString(),
      }
    }
  }

  getDeliveryLog(webhookId?: string, limit = 50): WebhookDeliveryAttempt[] {
    let log = this.deliveryLog
    if (webhookId) {
      log = log.filter(a => a.webhookId === webhookId)
    }
    return log.slice(-limit)
  }

  private logDelivery(attempt: WebhookDeliveryAttempt): void {
    this.deliveryLog.push(attempt)
    if (this.deliveryLog.length > this.maxLogSize) {
      this.deliveryLog = this.deliveryLog.slice(-this.maxLogSize)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
