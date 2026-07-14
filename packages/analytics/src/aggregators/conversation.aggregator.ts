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

export class ConversationAggregator extends BaseAggregator {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger)
  }

  async aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void> {
    const periodMs = PERIOD_MS[period]
    const bucketEnd = new Date(bucket.getTime() + periodMs)

    this.logger.info('Running conversation aggregation', {
      period,
      bucket: bucket.toISOString(),
      bucketEnd: bucketEnd.toISOString(),
    })

    const totalConversations = await this.prisma.conversation.count({
      where: { createdAt: { lte: bucketEnd } },
    })
    await this.upsertMetric(
      'total_conversations',
      totalConversations,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const activeConversations = await this.prisma.conversation.count({
      where: {
        status: 'active',
        createdAt: { lte: bucketEnd },
      },
    })
    await this.upsertMetric(
      'active_conversations',
      activeConversations,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const closedConversations = await this.prisma.conversation.count({
      where: {
        status: 'closed',
        createdAt: { lte: bucketEnd },
      },
    })
    await this.upsertMetric(
      'closed_conversations',
      closedConversations,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const conversationsCreated = await this.prisma.conversation.count({
      where: {
        createdAt: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'conversations_created',
      conversationsCreated,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const closedConversationsWithDuration = await this.prisma.conversation.findMany({
      where: {
        status: 'closed',
        updatedAt: { gte: bucket, lt: bucketEnd },
        createdAt: { lte: bucketEnd },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    let totalDurationMs = 0
    for (const conv of closedConversationsWithDuration) {
      totalDurationMs += conv.updatedAt.getTime() - conv.createdAt.getTime()
    }

    const avgDurationMs =
      closedConversationsWithDuration.length > 0
        ? totalDurationMs / closedConversationsWithDuration.length
        : 0

    await this.upsertMetric(
      'average_conversation_duration_ms',
      avgDurationMs,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const reopenedConversations = await this.prisma.analyticsEvent.count({
      where: {
        type: 'conversation.reopened',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'reopened_conversations',
      reopenedConversations,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const escalatedConversations = await this.prisma.analyticsEvent.count({
      where: {
        type: 'conversation.escalated',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'escalated_conversations',
      escalatedConversations,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    this.logger.info('Conversation aggregation complete', {
      period,
      bucket: bucket.toISOString(),
      totalConversations,
      activeConversations,
      closedConversations,
      avgDurationMs,
      reopenedConversations,
      escalatedConversations,
    })
  }
}
