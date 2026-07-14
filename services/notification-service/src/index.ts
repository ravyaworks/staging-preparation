import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import type { QueueService } from '@conversation-platform/queue'

export interface Notification {
  id: string
  type: string
  channel: string
  recipient: string
  subject?: string
  body: string
  metadata?: Record<string, unknown>
}

export interface NotificationService {
  send(notification: Omit<Notification, 'id'>): Promise<string>
  getStatus(notificationId: string): Promise<string | null>
}

export function createNotificationService(config: AppConfig, logger: Logger, queue: QueueService): NotificationService {
  const sent = new Map<string, string>()

  return {
    async send(notification): Promise<string> {
      const id = crypto.randomUUID()
      sent.set(id, 'pending')
      await queue.dispatch('notification:send', { id, ...notification })
      logger.info({ notificationId: id, channel: notification.channel }, 'Notification queued')
      return id
    },

    async getStatus(notificationId: string): Promise<string | null> {
      return sent.get(notificationId) ?? null
    },
  }
}
