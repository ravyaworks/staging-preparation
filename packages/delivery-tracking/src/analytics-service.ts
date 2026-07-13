import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { DeliveryAnalytics } from './types'

export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async getDeliveryAnalytics(
    periodStart?: Date,
    periodEnd?: Date,
    campaignId?: string,
  ): Promise<DeliveryAnalytics> {
    const end = periodEnd ?? new Date()
    const start = periodStart ?? new Date(end.getTime() - 24 * 60 * 60 * 1000)

    const [allJobs, completed, failed, retried, workers, campaigns, durationRecords] = await Promise.all([
      this.prisma.outreachJob.findMany({
        where: {
          ...(campaignId ? { campaignId } : {}),
          createdAt: { gte: start, lte: end },
        },
        select: { id: true, status: true, attempts: true, createdAt: true, processedAt: true, campaignId: true },
      }),

      this.prisma.outreachJob.findMany({
        where: {
          ...(campaignId ? { campaignId } : {}),
          status: { in: ['completed', 'sent'] },
          createdAt: { gte: start, lte: end },
        },
        select: { campaignId: true, campaign: { select: { name: true } } },
      }),

      this.prisma.outreachJob.count({
        where: {
          ...(campaignId ? { campaignId } : {}),
          status: 'failed',
          createdAt: { gte: start, lte: end },
        },
      }),

      this.prisma.outreachJob.count({
        where: {
          ...(campaignId ? { campaignId } : {}),
          attempts: { gt: 0 },
          createdAt: { gte: start, lte: end },
        },
      }),

      this.prisma.workerMetric.findMany({
        select: { workerId: true, status: true },
      }),

      this.prisma.campaign.findMany({
        where: {
          ...(campaignId ? { id: campaignId } : {}),
          createdAt: { gte: start, lte: end },
        },
        select: { id: true, name: true, _count: { select: { jobs: true } } },
      }),

      this.prisma.outreachJob.findMany({
        where: {
          ...(campaignId ? { campaignId } : {}),
          processedAt: { not: null },
          createdAt: { gte: start, lte: end },
        },
        select: { createdAt: true, processedAt: true },
      }),
    ])

    const totalJobs = allJobs.length
    const completedJobs = completed.length
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
    const failureRate = totalJobs > 0 ? (failed / totalJobs) * 100 : 0
    const retryRate = totalJobs > 0 ? (retried / totalJobs) * 100 : 0

    let totalDurationMs = 0
    let durationCount = 0
    for (const rec of durationRecords) {
      if (rec.processedAt) {
        totalDurationMs += rec.processedAt.getTime() - rec.createdAt.getTime()
        durationCount++
      }
    }
    const averageJobTimeMs = durationCount > 0 ? Math.round(totalDurationMs / durationCount) : 0

    const activeWorkers = workers.filter(w => w.status === 'active').length
    const idleWorkers = workers.filter(w => w.status === 'idle').length
    const workerUtilization = workers.length > 0 ? (activeWorkers / workers.length) * 100 : 0

    const campaignCompletionRates = campaigns.map(c => {
      const cJobs = allJobs.filter(j => j.campaignId === c.id)
      const cCompleted = completed.filter(j => j.campaignId === c.id)
      return {
        campaignId: c.id,
        campaignName: c.name,
        completionPercent: cJobs.length > 0 ? (cCompleted.length / cJobs.length) * 100 : 0,
        totalJobs: cJobs.length,
        completedJobs: cCompleted.length,
      }
    })

    return {
      periodStart: start,
      periodEnd: end,
      totalJobs,
      completedJobs,
      failedJobs: failed,
      retriedJobs: retried,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      retryRate: Math.round(retryRate * 100) / 100,
      averageJobTimeMs,
      averageQueueWaitTimeMs: 0,
      averageProcessingTimeMs: 0,
      workerUtilization: Math.round(workerUtilization * 100) / 100,
      activeWorkers,
      idleWorkers,
      campaignCompletionRates,
    }
  }

  async getQueueHealth(): Promise<{
    currentLoad: number
    queuedCount: number
    processingCount: number
    averageWaitTimeMs: number
    throughputPerMinute: number
    deadLetterCount: number
    oldestJobAgeMs: number
    isHealthy: boolean
  }> {
    const [queuedCount, processingCount, deadLetterCount, oldestJob, recentCompleted] = await Promise.all([
      this.prisma.outreachJob.count({ where: { status: 'queued' } }),
      this.prisma.outreachJob.count({ where: { status: 'processing' } }),
      this.prisma.outreachJob.count({ where: { status: 'dead_letter' } }),
      this.prisma.outreachJob.findFirst({
        where: { status: 'queued' },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.outreachJob.findMany({
        where: {
          status: { in: ['completed', 'sent'] },
          processedAt: { gte: new Date(Date.now() - 60000) },
        },
        select: { id: true },
      }),
    ])

    const oldestJobAgeMs = oldestJob ? Date.now() - oldestJob.createdAt.getTime() : 0
    const currentLoad = queuedCount + processingCount
    const throughputPerMinute = recentCompleted.length
    const averageWaitTimeMs = await this.calculateAverageWaitTime()

    return {
      currentLoad,
      queuedCount,
      processingCount,
      averageWaitTimeMs,
      throughputPerMinute,
      deadLetterCount,
      oldestJobAgeMs,
      isHealthy: queuedCount < 1000 && oldestJobAgeMs < 600000,
    }
  }

  private async calculateAverageWaitTime(): Promise<number> {
    const queued = new Date(Date.now() - 3600000)
    const events = await this.prisma.deliveryEvent.findMany({
      where: {
        type: 'job.processing',
        timestamp: { gte: queued },
      },
      select: { jobId: true, timestamp: true },
      take: 100,
    })

    if (events.length === 0) return 0

    const jobIds = events.map(e => e.jobId)
    const queuedEvents = await this.prisma.deliveryEvent.findMany({
      where: {
        jobId: { in: jobIds },
        type: 'job.queued',
      },
      select: { jobId: true, timestamp: true },
    })

    const queueMap = new Map(queuedEvents.map(e => [e.jobId, e.timestamp]))
    let totalWait = 0
    let count = 0
    for (const e of events) {
      const q = queueMap.get(e.jobId)
      if (q) {
        totalWait += e.timestamp.getTime() - q.getTime()
        count++
      }
    }
    return count > 0 ? Math.round(totalWait / count) : 0
  }
}
