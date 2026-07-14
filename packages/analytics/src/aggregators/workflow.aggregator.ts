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

export class WorkflowAggregator extends BaseAggregator {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger)
  }

  async aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void> {
    const periodMs = PERIOD_MS[period]
    const bucketEnd = new Date(bucket.getTime() + periodMs)

    this.logger.info('Running workflow aggregation', {
      period,
      bucket: bucket.toISOString(),
      bucketEnd: bucketEnd.toISOString(),
    })

    const workflowExecutions = await this.prisma.analyticsEvent.count({
      where: {
        type: 'workflow.executed',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'workflow_executions',
      workflowExecutions,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const workflowCompleted = await this.prisma.analyticsEvent.count({
      where: {
        type: 'workflow.completed',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'workflow_completed',
      workflowCompleted,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const workflowFailed = await this.prisma.analyticsEvent.count({
      where: {
        type: 'workflow.failed',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'workflow_failed',
      workflowFailed,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const totalFinished = workflowCompleted + workflowFailed
    const workflowSuccessRate =
      totalFinished > 0 ? (workflowCompleted / totalFinished) * 100 : 0

    await this.upsertMetric(
      'workflow_success_rate',
      workflowSuccessRate,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    this.logger.info('Workflow aggregation complete', {
      period,
      bucket: bucket.toISOString(),
      workflowExecutions,
      workflowCompleted,
      workflowFailed,
      workflowSuccessRate,
    })
  }
}
