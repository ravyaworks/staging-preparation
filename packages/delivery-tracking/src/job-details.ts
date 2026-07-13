import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { JobDetails, JobFailureData, JobTimelineEntry } from './types'
import { DeliveryTrackingError } from './types'
import { DeliveryTracker } from './delivery-tracker'
import { FailureTracker } from './failure-tracker'

export class JobDetailsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly deliveryTracker: DeliveryTracker,
    private readonly failureTracker: FailureTracker,
    private readonly logger: Logger,
  ) {}

  async getJobDetails(jobId: string): Promise<JobDetails | null> {
    const job = await this.prisma.outreachJob.findUnique({
      where: { id: jobId },
      include: { campaign: { select: { name: true, channel: true } } },
    })

    if (!job) return null

    const [timeline, failures] = await Promise.all([
      this.deliveryTracker.getJobTimeline(jobId),
      this.failureTracker.getJobFailures(jobId),
    ])

    const createdAt = job.createdAt
    const processedAt = job.processedAt
    const processingDurationMs = processedAt && createdAt
      ? processedAt.getTime() - createdAt.getTime()
      : null

    const queuedEvent = timeline.find(e => e.type === 'job.queued')
    const processingEvent = timeline.find(e => e.type === 'job.processing')
    const queueWaitTimeMs = processingEvent?.timestamp && queuedEvent?.timestamp
      ? processingEvent.timestamp.getTime() - queuedEvent.timestamp.getTime()
      : null

    const lastEvent = timeline.length > 0 ? timeline[timeline.length - 1] : null

    return {
      id: job.id,
      recipientName: job.recipientName,
      recipientPhone: job.recipientPhone,
      messageTemplate: job.messageTemplate,
      personalizedMessage: job.personalizedMessage,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      lastError: job.lastError,
      senderResult: (job.senderResult ?? {}) as Record<string, unknown>,
      scheduledAt: job.scheduledAt,
      processedAt: job.processedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      campaignId: job.campaignId,
      campaignName: job.campaign?.name ?? null,
      channel: job.campaign?.channel ?? null,
      timeline,
      failures,
      processingDurationMs,
      queueWaitTimeMs,
      currentWorkerId: lastEvent?.workerId ?? null,
    }
  }

  async listJobs(
    options: {
      campaignId?: string
      status?: string
      search?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    } = {},
  ): Promise<{ items: JobDetails[]; total: number; page: number; limit: number }> {
    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 20, 100)
    const where: Record<string, any> = {}

    if (options.campaignId) where['campaignId'] = options.campaignId
    if (options.status) where['status'] = options.status
    if (options.search) {
      where['OR'] = [
        { recipientName: { contains: options.search, mode: 'insensitive' } },
        { recipientPhone: { contains: options.search } },
        { personalizedMessage: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, string> = {}
    orderBy[options.sortBy ?? 'createdAt'] = options.sortOrder ?? 'desc'

    const [items, total] = await Promise.all([
      this.prisma.outreachJob.findMany({
        where: where as any,
        orderBy: orderBy as any,
        skip: (page - 1) * limit,
        take: limit,
        include: { campaign: { select: { name: true, channel: true } } },
      }),
      this.prisma.outreachJob.count({ where: where as any }),
    ])

    const details = await Promise.all(
      items.map(item => this.getJobDetails(item.id)),
    )

    return {
      items: details.filter((d): d is JobDetails => d !== null),
      total,
      page,
      limit,
    }
  }

  async getCampaignJobs(
    campaignId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ): Promise<{ items: JobDetails[]; total: number }> {
    return this.listJobs({ ...options, campaignId })
  }

  async getProcessingDuration(jobId: string): Promise<number | null> {
    const details = await this.getJobDetails(jobId)
    return details?.processingDurationMs ?? null
  }

  async getQueueWaitTime(jobId: string): Promise<number | null> {
    const details = await this.getJobDetails(jobId)
    return details?.queueWaitTimeMs ?? null
  }
}
