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

export class AIAggregator extends BaseAggregator {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger)
  }

  async aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void> {
    const periodMs = PERIOD_MS[period]
    const bucketEnd = new Date(bucket.getTime() + periodMs)

    this.logger.info('Running AI aggregation', {
      period,
      bucket: bucket.toISOString(),
      bucketEnd: bucketEnd.toISOString(),
    })

    const aiResponses = await this.prisma.message.count({
      where: {
        role: 'assistant',
        createdAt: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'ai_responses',
      aiResponses,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const aiEscalations = await this.prisma.analyticsEvent.count({
      where: {
        type: 'ai.escalation',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'ai_escalations',
      aiEscalations,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const aiHumanTakeovers = await this.prisma.analyticsEvent.count({
      where: {
        type: 'agent.handoff',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'ai_human_takeovers',
      aiHumanTakeovers,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const latencyMessages = await this.prisma.message.findMany({
      where: {
        role: 'assistant',
        latency: { not: null },
        createdAt: { gte: bucket, lt: bucketEnd },
      },
      select: { latency: true },
    })

    let totalLatency = 0
    let latencyCount = 0
    for (const msg of latencyMessages) {
      if (msg.latency != null) {
        totalLatency += msg.latency
        latencyCount++
      }
    }

    const avgLatency = latencyCount > 0 ? totalLatency / latencyCount : 0

    await this.upsertMetric(
      'ai_avg_latency_ms',
      avgLatency,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const aiFeedbackEvents = await this.prisma.analyticsEvent.count({
      where: {
        type: 'ai.feedback',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'ai_feedback_count',
      aiFeedbackEvents,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    this.logger.info('AI aggregation complete', {
      period,
      bucket: bucket.toISOString(),
      aiResponses,
      aiEscalations,
      aiHumanTakeovers,
      avgLatency,
      aiFeedbackEvents,
    })
  }
}
