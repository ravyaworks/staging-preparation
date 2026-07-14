import type { PrismaClient } from '@prisma/client'
import type { QueueAnalytics } from '../types'

export class QueueAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(): Promise<QueueAnalytics> {
    const [
      pendingJobs,
      queuedJobs,
      activeWorkers,
      totalWorkers,
      workerMetrics,
      deadLetterJobs,
      recentThroughput,
      averageProcessingJobs,
      retryFailures,
      totalJobs,
    ] = await Promise.all([
      this.prisma.outreachJob.count({ where: { status: 'pending' } }),
      this.prisma.outreachJob.count({ where: { status: 'queued' } }),
      this.prisma.workerMetric.count({ where: { status: 'active' } }),
      this.prisma.workerMetric.count(),
      this.prisma.workerMetric.findMany({
        select: {
          workerId: true,
          jobsProcessed: true,
          successCount: true,
          failureCount: true,
          averageProcessingMs: true,
          status: true,
        },
      }),
      this.prisma.outreachJob.count({ where: { status: 'dead_letter' } }),
      this.prisma.outreachJob.count({
        where: {
          status: { in: ['completed', 'sent'] },
          processedAt: { gte: new Date(Date.now() - 60000) },
        },
      }),
      this.prisma.outreachJob.findMany({
        where: {
          processedAt: { not: null },
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
        select: { createdAt: true, processedAt: true },
        take: 5000,
      }),
      this.prisma.jobFailure.count(),
      this.prisma.outreachJob.count(),
    ])

    const queueSize = pendingJobs + queuedJobs

    let totalProcessingMs = 0
    let processingCount = 0
    for (const j of averageProcessingJobs) {
      if (j.processedAt) {
        totalProcessingMs += j.processedAt.getTime() - j.createdAt.getTime()
        processingCount++
      }
    }
    const averageProcessingTimeMs =
      processingCount > 0 ? Math.round(totalProcessingMs / processingCount) : 0

    const retryRate = totalJobs > 0
      ? Math.round((retryFailures / totalJobs) * 100 * 100) / 100
      : 0

    const workerThroughput = workerMetrics.reduce((sum, w) => sum + w.jobsProcessed, 0)

    let queueHealth: 'healthy' | 'degraded' | 'critical' = 'healthy'
    if (queueSize > 10000 || deadLetterJobs > 500) {
      queueHealth = 'critical'
    } else if (queueSize > 5000 || deadLetterJobs > 100) {
      queueHealth = 'degraded'
    }

    return {
      queueSize,
      activeWorkers,
      workerThroughput,
      averageProcessingTimeMs,
      retryRate,
      deadLetterQueueSize: deadLetterJobs,
      queueHealth,
    }
  }
}
