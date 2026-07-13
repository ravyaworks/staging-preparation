import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { NotificationSeverity } from './types'

export interface NotificationData {
  id: string
  type: string
  severity: string
  title: string
  message: string
  metadata: Record<string, unknown>
  acknowledged: boolean
  acknowledgedAt: Date | null
  acknowledgedBy: string | null
  createdAt: Date
}

export class NotificationGenerator {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async notify(
    type: string,
    severity: NotificationSeverity,
    title: string,
    message: string,
    metadata: Record<string, unknown> = {},
  ): Promise<NotificationData> {
    const notification = await this.prisma.deliveryNotification.create({
      data: {
        type,
        severity,
        title,
        message,
        metadata: metadata as any,
      },
    })

    this.logger.info({ type, severity, title, notificationId: notification.id }, 'Notification created')
    return this.toData(notification)
  }

  async notifyHighFailureRate(jobId: string, failureCount: number, errorMessage: string): Promise<NotificationData> {
    return this.notify(
      'high_failure_rate',
      'warning',
      `High failure rate for job ${jobId.slice(0, 8)}`,
      `Job has failed ${failureCount} times. Latest error: ${errorMessage}`,
      { jobId, failureCount },
    )
  }

  async notifyDeadLetter(jobId: string, reason: string): Promise<NotificationData> {
    return this.notify(
      'dead_letter',
      'error',
      `Job moved to dead letter queue`,
      `Job ${jobId.slice(0, 8)} has exhausted retries. Reason: ${reason}`,
      { jobId, reason },
    )
  }

  async notifyQueueOverflow(jobCount: number): Promise<NotificationData> {
    return this.notify(
      'queue_overflow',
      'warning',
      `Queue near capacity`,
      `Queue has ${jobCount} pending jobs, approaching limit.`,
      { jobCount },
    )
  }

  async notifyWorkerOffline(workerId: string, lastHeartbeat: Date): Promise<NotificationData> {
    return this.notify(
      'worker_offline',
      'error',
      `Worker offline: ${workerId}`,
      `Worker ${workerId} has not sent heartbeat since ${lastHeartbeat.toISOString()}.`,
      { workerId, lastHeartbeat: lastHeartbeat.toISOString() },
    )
  }

  async acknowledge(notificationId: string, userId: string): Promise<NotificationData | null> {
    const notification = await this.prisma.deliveryNotification.findUnique({
      where: { id: notificationId },
    })
    if (!notification) return null

    const updated = await this.prisma.deliveryNotification.update({
      where: { id: notificationId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    })
    return this.toData(updated)
  }

  async getNotifications(
    options: {
      unreadOnly?: boolean
      severity?: string
      type?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<{ notifications: NotificationData[]; total: number }> {
    const where: Record<string, any> = {}
    if (options.unreadOnly) where['acknowledged'] = false
    if (options.severity) where['severity'] = options.severity
    if (options.type) where['type'] = options.type

    const limit = options.limit ?? 50
    const offset = options.offset ?? 0

    const [notifications, total] = await Promise.all([
      this.prisma.deliveryNotification.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.deliveryNotification.count({ where: where as any }),
    ])

    return { notifications: notifications.map(n => this.toData(n)), total }
  }

  private toData(n: any): NotificationData {
    return {
      id: n.id,
      type: n.type,
      severity: n.severity,
      title: n.title,
      message: n.message,
      metadata: (n.metadata ?? {}) as Record<string, unknown>,
      acknowledged: n.acknowledged,
      acknowledgedAt: n.acknowledgedAt,
      acknowledgedBy: n.acknowledgedBy,
      createdAt: n.createdAt,
    }
  }
}
