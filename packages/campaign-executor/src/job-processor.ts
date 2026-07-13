import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { IOutreachSender, JobExecutionStatus } from './types'
import { RateLimiter } from './rate-limiter'
import { RetryPolicy } from './retry-policy'
import { MetricsCollector } from './metrics'
import { ExecutionError } from './types'

interface QueuedJob {
  id: string
  campaignId: string
  campaignBusinessId: string
  recipientPhone: string
  personalizedMessage: string
  metadata: Record<string, unknown>
}

export class JobProcessor {
  private processing = false
  private currentJobId: string | null = null
  private jobsProcessed = 0

  constructor(
    private readonly prisma: PrismaClient,
    private readonly sender: IOutreachSender,
    private readonly rateLimiter: RateLimiter,
    private readonly retryPolicy: RetryPolicy,
    private readonly metrics: MetricsCollector,
    private readonly logger: Logger,
  ) {}

  async processNext(): Promise<boolean> {
    if (this.processing) return false

    const canProceed = await this.rateLimiter.acquire()
    if (!canProceed) return false

    this.processing = true

    try {
      const job = await this.dequeue()
      if (!job) {
        this.rateLimiter.release()
        this.processing = false
        return false
      }

      this.currentJobId = job.id
      await this.execute(job)
      this.currentJobId = null
      this.jobsProcessed++
      return true
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : 'Unknown' }, 'Job processor error')
      return false
    } finally {
      this.rateLimiter.release()
      this.processing = false
    }
  }

  private async dequeue(): Promise<QueuedJob | null> {
    const now = new Date()

    const job = await this.prisma.outreachJob.findFirst({
      where: {
        status: 'queued',
        scheduledAt: { lte: now },
        OR: [
          { lockedAt: null },
          { lockedAt: { lt: new Date(now.getTime() - 60_000) } },
        ],
      },
      orderBy: [{ attempts: 'asc' }, { createdAt: 'asc' }],
      take: 1,
    })

    if (!job) return null

    await this.prisma.outreachJob.update({
      where: { id: job.id },
      data: {
        status: 'processing',
        lockedAt: now,
        lockedBy: `worker_${process.pid}`,
      },
    })

    return {
      id: job.id,
      campaignId: job.campaignId ?? '',
      campaignBusinessId: '',
      recipientPhone: job.recipientPhone,
      personalizedMessage: job.personalizedMessage,
      metadata: (job.metadata as Record<string, unknown>) ?? {},
    }
  }

  private async execute(job: QueuedJob): Promise<void> {
    const startTime = Date.now()
    this.metrics.incrementCounter('jobs.started')

    this.logger.info({ jobId: job.id, phone: job.recipientPhone }, 'Job started')

    try {
      const result = await this.sender.send(
        job.recipientPhone,
        job.personalizedMessage,
        job.metadata,
      )

      const duration = Date.now() - startTime
      this.metrics.recordHistogram('job.duration', duration)

      if (result.success) {
        await this.handleSuccess(job, result)
      } else {
        await this.handleFailure(job, result.error ?? 'Send failed', startTime)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      await this.handleFailure(job, message, startTime)
    }
  }

  private async handleSuccess(
    job: QueuedJob,
    result: { success: boolean; messageId?: string; metadata?: Record<string, unknown> },
  ): Promise<void> {
    await this.prisma.outreachJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        senderResult: result.metadata ? JSON.parse(JSON.stringify(result.metadata)) : { success: true },
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    })

    if (job.campaignBusinessId) {
      await this.prisma.campaignBusiness.update({
        where: { id: job.campaignBusinessId },
        data: { status: 'sent' },
      })
    }

    if (job.campaignId) {
      await this.updateStats(job.campaignId, 'sent')
    }

    this.metrics.incrementCounter('jobs.completed')
    this.metrics.incrementCounter('messages.sent')

    this.logger.info({ jobId: job.id, messageId: result.messageId }, 'Job completed')
  }

  private async handleFailure(job: QueuedJob, errorMessage: string, startTime: number): Promise<void> {
    const dbJob = await this.prisma.outreachJob.findUnique({ where: { id: job.id } })
    const attempts = (dbJob?.attempts ?? 0) + 1

    if (this.retryPolicy.shouldMoveToDeadLetter(attempts, errorMessage)) {
      await this.prisma.outreachJob.update({
        where: { id: job.id },
        data: {
          status: 'dead_letter',
          attempts,
          lastError: errorMessage,
          processedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        },
      })

      if (job.campaignBusinessId) {
        await this.prisma.campaignBusiness.update({
          where: { id: job.campaignBusinessId },
          data: { status: 'failed', errors: [{ error: errorMessage, attempts }] as any },
        })
      }

      if (job.campaignId) {
        await this.updateStats(job.campaignId, 'failed')
      }

      this.metrics.incrementCounter('jobs.dead_letter')
      this.logger.warn({ jobId: job.id, attempts, maxRetries: this.retryPolicy.getMaxRetries() }, 'Job moved to dead letter queue')
      return
    }

    const nextScheduledAt = this.retryPolicy.getNextScheduledAt(attempts)

    await this.prisma.outreachJob.update({
      where: { id: job.id },
      data: {
        status: 'retrying',
        attempts,
        lastError: errorMessage,
        scheduledAt: nextScheduledAt,
        lockedAt: null,
        lockedBy: null,
      },
    })

    if (job.campaignId) {
      await this.updateStats(job.campaignId, 'failed')
    }

    this.metrics.incrementCounter('jobs.retrying')
    this.logger.info({ jobId: job.id, attempts, nextRetryAt: nextScheduledAt.toISOString() }, 'Job scheduled for retry')
  }

  private async updateStats(campaignId: string, field: 'sent' | 'failed'): Promise<void> {
    await this.prisma.campaignStatistics.upsert({
      where: { campaignId },
      create: {
        campaignId,
        [field]: 1,
      },
      update: {
        [field]: { increment: 1 },
      },
    })
  }

  getJobsProcessed(): number {
    return this.jobsProcessed
  }

  getCurrentJobId(): string | null {
    return this.currentJobId
  }

  isProcessing(): boolean {
    return this.processing
  }
}
