import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { AnalyticsPeriod } from '../types'
import { BaseAggregator } from './base.aggregator'

export class QueueAggregator extends BaseAggregator {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger)
  }

  async aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void> {
    this.logger.info('Running queue aggregation', {
      period,
      bucket: bucket.toISOString(),
    })

    const activeWorkers = await this.prisma.workerMetric.count({
      where: { status: 'busy' },
    })
    await this.upsertMetric(
      'active_workers',
      activeWorkers,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const totalJobsProcessed = await this.prisma.workerMetric.aggregate({
      _sum: { jobsProcessed: true },
    })
    const jobsProcessed = totalJobsProcessed._sum.jobsProcessed ?? 0
    await this.upsertMetric(
      'worker_throughput',
      jobsProcessed,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const workerMetrics = await this.prisma.workerMetric.findMany({
      select: { averageProcessingMs: true },
    })
    let totalProcessingMs = 0
    let workerCount = 0
    for (const wm of workerMetrics) {
      totalProcessingMs += wm.averageProcessingMs
      workerCount++
    }
    const avgProcessingTime = workerCount > 0 ? totalProcessingMs / workerCount : 0
    await this.upsertMetric(
      'average_processing_time',
      avgProcessingTime,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const queuedJobs = await this.prisma.outreachJob.aggregate({
      _count: { id: true },
      where: { status: { in: ['pending', 'queued'] } },
    })
    const queueSize = queuedJobs._count.id
    await this.upsertMetric(
      'queue_size',
      queueSize,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    const statusGroups = await this.prisma.outreachJob.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    for (const group of statusGroups) {
      await this.upsertMetric(
        'queue_depth',
        group._count.id,
        group.status,
        undefined,
        undefined,
        period,
        bucket,
      )
    }

    const failedJobs = await this.prisma.jobFailure.count({
      where: {
        createdAt: { gte: bucket, lt: new Date(bucket.getTime() + 60_000) },
      },
    })
    await this.upsertMetric(
      'worker_failures',
      failedJobs,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    this.logger.info('Queue aggregation complete', {
      period,
      bucket: bucket.toISOString(),
      activeWorkers,
      jobsProcessed,
      avgProcessingTime,
      queueSize,
    })
  }
}
