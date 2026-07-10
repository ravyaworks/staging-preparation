import type { WebhookConfig, WebhookRegistration } from './types'
import type { WebhookRepository } from '@conversation-platform/database'

export class WebhookRegistry {
  private webhooks = new Map<string, WebhookRegistration>()
  private repo?: WebhookRepository

  constructor(repo?: WebhookRepository) {
    this.repo = repo
  }

  register(config: WebhookConfig): WebhookRegistration {
    const registration: WebhookRegistration = {
      config,
      status: 'active',
      consecutiveFailures: 0,
    }
    this.webhooks.set(config.id, registration)

    if (this.repo) {
      this.repo.create({
        name: config.name,
        url: config.url,
        secret: config.secret,
        events: config.events,
        isActive: config.enabled,
        tenant: { connect: { id: config.tenantId } },
      }).catch(() => {})
    }

    return registration
  }

  unregister(webhookId: string): boolean {
    const result = this.webhooks.delete(webhookId)

    if (result && this.repo) {
      this.repo.remove(webhookId).catch(() => {})
    }

    return result
  }

  get(webhookId: string): WebhookRegistration | undefined {
    return this.webhooks.get(webhookId)
  }

  getByTenant(tenantId: string): WebhookRegistration[] {
    return Array.from(this.webhooks.values())
      .filter(w => w.config.tenantId === tenantId)
  }

  getByEvent(event: string, tenantId: string): WebhookRegistration[] {
    return Array.from(this.webhooks.values())
      .filter(w =>
        w.config.tenantId === tenantId &&
        w.config.enabled &&
        w.config.events.includes(event),
      )
  }

  list(tenantId?: string): WebhookRegistration[] {
    if (tenantId) return this.getByTenant(tenantId)
    return Array.from(this.webhooks.values())
  }

  updateStatus(webhookId: string, status: WebhookRegistration['status']): void {
    const reg = this.webhooks.get(webhookId)
    if (reg) {
      reg.status = status

      if (this.repo) {
        this.repo.update(webhookId, {
          isActive: status === 'active',
        }).catch(() => {})
      }
    }
  }

  recordDelivery(webhookId: string, success: boolean): void {
    const reg = this.webhooks.get(webhookId)
    if (!reg) return

    const now = new Date().toISOString()
    reg.lastDeliveryAt = now

    if (success) {
      reg.lastSuccessAt = now
      reg.consecutiveFailures = 0
      reg.status = 'active'
    } else {
      reg.lastFailureAt = now
      reg.consecutiveFailures += 1
      if (reg.consecutiveFailures >= 10) {
        reg.status = 'failing'
      }
    }

    if (this.repo) {
      this.repo.update(webhookId, {
        lastTriggeredAt: new Date(),
      }).catch(() => {})
    }
  }

  clear(): void {
    this.webhooks.clear()
  }

  count(): number {
    return this.webhooks.size
  }
}
