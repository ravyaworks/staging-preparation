import type { WebhookConfig, WebhookDeliveryAttempt, WebhookStats } from './types'

export class WebhookMonitor {
  private attempts: WebhookDeliveryAttempt[] = []
  private maxSize: number

  constructor(maxSize = 50000) {
    this.maxSize = maxSize
  }

  record(attempt: WebhookDeliveryAttempt): void {
    this.attempts.push(attempt)
    if (this.attempts.length > this.maxSize) {
      this.attempts = this.attempts.slice(-this.maxSize)
    }
  }

  getStats(webhooks: WebhookConfig[]): WebhookStats {
    const totalWebhooks = webhooks.length
    const activeWebhooks = webhooks.filter(w => w.enabled).length
    const recentAttempts = this.attempts.slice(-1000)

    const total = recentAttempts.length
    if (total === 0) {
      return {
        totalWebhooks,
        activeWebhooks,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        retryRate: 0,
        averageLatencyMs: 0,
        uptimePercent: 100,
      }
    }

    const successful = recentAttempts.filter(a => a.status === 'delivered').length
    const failed = recentAttempts.filter(a => a.status === 'failed').length
    const retries = recentAttempts.filter(a => a.attemptNumber > 1).length
    const totalLatency = recentAttempts.reduce((sum, a) => sum + a.durationMs, 0)

    return {
      totalWebhooks,
      activeWebhooks,
      totalDeliveries: total,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      retryRate: total > 0 ? (retries / total) * 100 : 0,
      averageLatencyMs: total > 0 ? totalLatency / total : 0,
      uptimePercent: total > 0 ? (successful / total) * 100 : 100,
    }
  }

  getRecentFailures(limit = 20): WebhookDeliveryAttempt[] {
    return this.attempts
      .filter(a => a.status === 'failed')
      .slice(-limit)
      .reverse()
  }

  clear(): void {
    this.attempts = []
  }
}
