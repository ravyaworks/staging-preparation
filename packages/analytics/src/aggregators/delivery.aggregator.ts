import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { AnalyticsPeriod } from '../types'
import { BaseAggregator } from './base.aggregator'

const PERIOD_MS: Record<AnalyticsPeriod, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
}

export class DeliveryAggregator extends BaseAggregator {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger)
  }

  async aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void> {
    const periodMs = PERIOD_MS[period]
    const bucketEnd = new Date(bucket.getTime() + periodMs)

    this.logger.info('Running delivery aggregation', {
      period,
      bucket: bucket.toISOString(),
      bucketEnd: bucketEnd.toISOString(),
    })

    const messagesSubmitted = await this.prisma.deliveryEvent.count({
      where: {
        type: 'job.created',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'messages_submitted',
      messagesSubmitted,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const messagesSent = await this.prisma.deliveryEvent.count({
      where: {
        type: 'job.sent',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'messages_sent',
      messagesSent,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const messagesDelivered = await this.prisma.deliveryEvent.count({
      where: {
        type: { in: ['job.completed', 'job.delivered'] },
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'messages_delivered',
      messagesDelivered,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const messagesRead = await this.prisma.deliveryEvent.count({
      where: {
        type: 'job.read',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'messages_read',
      messagesRead,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const messagesFailed = await this.prisma.deliveryEvent.count({
      where: {
        type: 'job.failed',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'messages_failed',
      messagesFailed,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const retryEvents = await this.prisma.deliveryEvent.count({
      where: {
        type: 'job.retrying',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'retry_count',
      retryEvents,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const deliveryRate =
      messagesSubmitted > 0 ? (messagesDelivered / messagesSubmitted) * 100 : 0
    await this.upsertMetric(
      'delivery_rate',
      deliveryRate,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const readRate =
      messagesDelivered > 0 ? (messagesRead / messagesDelivered) * 100 : 0
    await this.upsertMetric(
      'read_rate',
      readRate,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const failureRate =
      messagesSubmitted > 0 ? (messagesFailed / messagesSubmitted) * 100 : 0
    await this.upsertMetric(
      'failure_rate',
      failureRate,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    this.logger.info('Delivery aggregation complete', {
      period,
      bucket: bucket.toISOString(),
      messagesSubmitted,
      messagesSent,
      messagesDelivered,
      messagesRead,
      messagesFailed,
      retryEvents,
    })
  }
}
