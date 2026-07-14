import type { PrismaClient } from '@prisma/client'
import type { DeliveryAnalytics } from '../types'

export class DeliveryAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(
    campaignId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DeliveryAnalytics> {
    const jobWhere: Record<string, unknown> = {}
    if (campaignId) jobWhere.campaignId = campaignId
    if (startDate || endDate) {
      jobWhere.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }

    const [
      messagesSubmitted,
      messagesAccepted,
      messagesSent,
      messagesDelivered,
      messagesRead,
      failedMessages,
      retryCount,
      queueWaitJobs,
      processingJobs,
    ] = await Promise.all([
      this.prisma.outreachJob.count({ where: { ...jobWhere, status: { not: 'cancelled' } } }),
      this.prisma.outreachJob.count({
        where: { ...jobWhere, status: { in: ['queued', 'processing', 'sent', 'delivered', 'completed'] } },
      }),
      this.prisma.outreachJob.count({ where: { ...jobWhere, status: 'sent' } }),
      this.prisma.outreachJob.count({ where: { ...jobWhere, status: 'delivered' } }),
      this.prisma.deliveryEvent.count({
        where: {
          type: 'job.read',
          ...(campaignId
            ? { job: { campaignId } }
            : {}),
        },
      }),
      this.prisma.outreachJob.count({ where: { ...jobWhere, status: 'failed' } }),
      this.prisma.jobFailure.count({
        where: {
          ...(campaignId ? { job: { campaignId } } : {}),
        },
      }),
      this.prisma.outreachJob.findMany({
        where: {
          ...jobWhere,
          status: { in: ['processing', 'sent', 'delivered', 'completed'] },
        },
        select: { createdAt: true, processedAt: true },
        take: 5000,
      }),
      this.prisma.outreachJob.findMany({
        where: {
          ...jobWhere,
          processedAt: { not: null },
        },
        select: { createdAt: true, processedAt: true },
        take: 5000,
      }),
    ])

    let totalQueueWaitMs = 0
    let queueWaitCount = 0
    for (const j of queueWaitJobs) {
      if (j.processedAt) {
        totalQueueWaitMs += j.processedAt.getTime() - j.createdAt.getTime()
        queueWaitCount++
      }
    }
    const queueWaitTimeMs =
      queueWaitCount > 0 ? Math.round(totalQueueWaitMs / queueWaitCount) : 0

    let totalProcessingMs = 0
    let processingCount = 0
    for (const j of processingJobs) {
      if (j.processedAt) {
        totalProcessingMs += j.processedAt.getTime() - j.createdAt.getTime()
        processingCount++
      }
    }
    const processingTimeMs =
      processingCount > 0 ? Math.round(totalProcessingMs / processingCount) : 0

    return {
      messagesSubmitted,
      messagesAccepted,
      messagesSent,
      messagesDelivered,
      messagesRead,
      failedMessages,
      retryCount,
      queueWaitTimeMs,
      processingTimeMs,
      funnel: {
        submitted: messagesSubmitted,
        accepted: messagesAccepted,
        sent: messagesSent,
        delivered: messagesDelivered,
        read: messagesRead,
      },
    }
  }
}
