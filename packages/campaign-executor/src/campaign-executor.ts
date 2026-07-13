import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type {
  ExecutionConfig,
  IOutreachSender,
  CampaignProgress,
  DeadLetterEntry,
  QueueStatus,
} from './types'
import { DEFAULT_EXECUTION_CONFIG, ExecutionError } from './types'
import { RateLimiter } from './rate-limiter'
import { RetryPolicy } from './retry-policy'
import { JobProcessor } from './job-processor'
import { Scheduler } from './scheduler'
import { WorkerManager } from './worker-manager'
import { MetricsCollector } from './metrics'
import type { ExecutorConfig } from './config'

export class CampaignExecutor {
  private readonly rateLimiter: RateLimiter
  private readonly retryPolicy: RetryPolicy
  private readonly jobProcessor: JobProcessor
  private readonly scheduler: Scheduler
  private readonly workerManager: WorkerManager
  private readonly metrics: MetricsCollector
  private campaignConfigs: Map<string, ExecutionConfig> = new Map()
  private runningCampaigns: Set<string> = new Set()
  private isStarted = false

  constructor(
    private readonly prisma: PrismaClient,
    private readonly sender: IOutreachSender,
    private readonly executorConfig: ExecutorConfig,
    private readonly logger: Logger,
  ) {
    this.metrics = new MetricsCollector()
    this.rateLimiter = new RateLimiter(
      executorConfig.defaultRateLimitPerMinute,
      executorConfig.defaultRateLimitPerHour,
      executorConfig.defaultMaxConcurrent,
      executorConfig.defaultDelayBetweenJobsMs,
    )
    this.retryPolicy = new RetryPolicy(
      executorConfig.defaultRetryCount,
      executorConfig.defaultRetryDelaysMs,
      logger,
    )
    this.jobProcessor = new JobProcessor(
      prisma,
      sender,
      this.rateLimiter,
      this.retryPolicy,
      this.metrics,
      logger,
    )
    this.scheduler = new Scheduler(
      executorConfig.schedulerTickIntervalMs,
      logger,
    )
    this.workerManager = new WorkerManager(
      executorConfig.defaultMaxConcurrent,
      executorConfig.workerHeartbeatIntervalMs,
      executorConfig.workerStaleTimeoutMs,
      () => this.jobProcessor.processNext(),
      this.metrics,
      logger,
    )
  }

  async start(): Promise<void> {
    if (this.isStarted) return
    this.isStarted = true

    await this.workerManager.start()
    await this.scheduler.start()

    this.scheduler.setTickCallback(async () => {
      await this.processQueuedJobs()
    })

    this.logger.info('Campaign executor started')
  }

  async stop(): Promise<void> {
    this.isStarted = false
    await this.scheduler.stop()
    await this.workerManager.stop()
    this.logger.info('Campaign executor stopped')
  }

  async executeCampaign(
    campaignId: string,
    config: Partial<ExecutionConfig> = {},
  ): Promise<{ jobsCreated: number }> {
    const fullConfig = { ...DEFAULT_EXECUTION_CONFIG, ...config }
    this.campaignConfigs.set(campaignId, fullConfig)

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        businesses: { where: { status: 'pending' } },
        statistics: true,
      },
    })

    if (!campaign) {
      throw new ExecutionError('Campaign not found', 'NOT_FOUND', 404)
    }

    if (campaign.status !== 'ready') {
      throw new ExecutionError(
        `Campaign must be in "ready" status to execute (current: ${campaign.status})`,
        'INVALID_STATUS',
        400,
      )
    }

    if (campaign.businesses.length === 0) {
      throw new ExecutionError('Campaign has no businesses to process', 'NO_BUSINESSES', 400)
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    })

    await this.prisma.campaignLog.create({
      data: {
        campaign: { connect: { id: campaignId } },
        action: 'campaign.started',
        message: `Campaign execution started with ${campaign.businesses.length} businesses`,
      },
    })

    let jobsCreated = 0
    for (const business of campaign.businesses) {
      const job = await this.prisma.outreachJob.create({
        data: {
          recipientName: business.businessName,
          recipientPhone: business.phone,
          messageTemplate: business.personalizedMessage,
          personalizedMessage: business.personalizedMessage,
          status: 'queued',
          campaign: { connect: { id: campaignId } },
          metadata: { campaignId, businessId: business.id, channel: campaign.channel },
        },
      })

      await this.prisma.campaignBusiness.update({
        where: { id: business.id },
        data: {
          status: 'queued',
          outreachJobId: job.id,
        },
      })

      jobsCreated++
    }

    await this.prisma.campaignStatistics.upsert({
      where: { campaignId },
      create: {
        campaignId,
        totalBusinesses: campaign.businesses.length,
        queued: campaign.businesses.length,
        jobsCreated,
      },
      update: {
        jobsCreated: { increment: jobsCreated },
        queued: { increment: jobsCreated },
      },
    })

    await this.prisma.campaignLog.create({
      data: {
        campaign: { connect: { id: campaignId } },
        action: 'jobs.created',
        message: `Created ${jobsCreated} outreach jobs for campaign`,
        metadata: { jobsCreated },
      },
    })

    this.runningCampaigns.add(campaignId)
    this.metrics.incrementCounter('campaigns.started')
    this.metrics.setGauge('campaigns.running', this.runningCampaigns.size)

    this.logger.info({ campaignId, jobsCreated }, 'Campaign execution started')

    return { jobsCreated }
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw new ExecutionError('Campaign not found', 'NOT_FOUND', 404)
    if (campaign.status !== 'running') throw new ExecutionError('Campaign is not running', 'NOT_RUNNING', 400)

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    })

    await this.prisma.campaignLog.create({
      data: {
        campaign: { connect: { id: campaignId } },
        action: 'campaign.paused',
        message: 'Campaign execution paused',
      },
    })

    this.logger.info({ campaignId }, 'Campaign paused')
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw new ExecutionError('Campaign not found', 'NOT_FOUND', 404)
    if (campaign.status !== 'paused') throw new ExecutionError('Campaign is not paused', 'NOT_PAUSED', 400)

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'running' },
    })

    await this.prisma.campaignLog.create({
      data: {
        campaign: { connect: { id: campaignId } },
        action: 'campaign.resumed',
        message: 'Campaign execution resumed',
      },
    })

    this.runningCampaigns.add(campaignId)
    this.logger.info({ campaignId }, 'Campaign resumed')
  }

  async cancelCampaign(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw new ExecutionError('Campaign not found', 'NOT_FOUND', 404)
    if (campaign.status !== 'running' && campaign.status !== 'paused') {
      throw new ExecutionError('Campaign is not running or paused', 'NOT_RUNNING', 400)
    }

    await this.prisma.outreachJob.updateMany({
      where: { campaignId, status: { in: ['pending', 'queued', 'processing', 'retrying'] } },
      data: { status: 'cancelled' },
    })

    await this.prisma.campaignBusiness.updateMany({
      where: { campaignId, status: { in: ['pending', 'queued', 'sending'] } },
      data: { status: 'failed' },
    })

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'cancelled', completedAt: new Date() },
    })

    await this.prisma.campaignLog.create({
      data: {
        campaign: { connect: { id: campaignId } },
        action: 'campaign.cancelled',
        message: 'Campaign execution cancelled',
      },
    })

    this.runningCampaigns.delete(campaignId)
    this.metrics.incrementCounter('campaigns.cancelled')
    this.metrics.setGauge('campaigns.running', this.runningCampaigns.size)

    this.logger.info({ campaignId }, 'Campaign cancelled')
  }

  async retryJob(jobId: string): Promise<void> {
    const job = await this.prisma.outreachJob.findUnique({ where: { id: jobId } })
    if (!job) throw new ExecutionError('Job not found', 'NOT_FOUND', 404)
    if (job.status !== 'failed' && job.status !== 'dead_letter') {
      throw new ExecutionError('Job is not in a retryable state', 'NOT_RETRYABLE', 400)
    }

    await this.prisma.outreachJob.update({
      where: { id: jobId },
      data: {
        status: 'queued',
        attempts: 0,
        lastError: null,
        scheduledAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    })

    this.logger.info({ jobId }, 'Job queued for retry')
  }

  async retryFailedJobs(campaignId: string): Promise<number> {
    const result = await this.prisma.outreachJob.updateMany({
      where: {
        campaignId,
        status: { in: ['failed', 'dead_letter'] },
      },
      data: {
        status: 'queued',
        attempts: 0,
        lastError: null,
        scheduledAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    })

    this.logger.info({ campaignId, count: result.count }, 'Failed jobs requeued for retry')
    return result.count
  }

  async skipJob(jobId: string): Promise<void> {
    const job = await this.prisma.outreachJob.findUnique({ where: { id: jobId } })
    if (!job) throw new ExecutionError('Job not found', 'NOT_FOUND', 404)

    await this.prisma.outreachJob.update({
      where: { id: jobId },
      data: { status: 'cancelled' },
    })

    this.logger.info({ jobId }, 'Job skipped (cancelled)')
  }

  async getCampaignProgress(campaignId: string): Promise<CampaignProgress | null> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { statistics: true },
    })

    if (!campaign) return null

    const jobs = await this.prisma.outreachJob.findMany({
      where: { campaignId },
      select: { status: true, createdAt: true, processedAt: true },
    })

    const stats = campaign.statistics[0]
    const total = jobs.length
    const pending = jobs.filter(j => j.status === 'pending').length
    const queued = jobs.filter(j => j.status === 'queued').length
    const processing = jobs.filter(j => j.status === 'processing').length
    const completed = jobs.filter(j => j.status === 'completed').length
    const failed = jobs.filter(j => j.status === 'failed').length
    const retrying = jobs.filter(j => j.status === 'retrying').length
    const deadLetter = jobs.filter(j => j.status === 'dead_letter').length
    const cancelled = jobs.filter(j => j.status === 'cancelled').length

    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

    const processingTimes = jobs
      .filter((j): j is typeof j & { processedAt: Date; createdAt: Date } =>
        j.processedAt !== null && j.createdAt !== null)
      .map(j => j.processedAt.getTime() - j.createdAt.getTime())

    const avgTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0

    const remaining = total - completed
    const estimatedCompletionAt = avgTime > 0 && remaining > 0
      ? new Date(Date.now() + remaining * avgTime)
      : null

    return {
      campaignId,
      campaignName: campaign.name,
      status: campaign.status,
      total,
      pending,
      queued,
      processing,
      completed,
      failed,
      retrying,
      deadLetter,
      cancelled,
      progressPercent,
      estimatedCompletionAt,
      averageProcessingTimeMs: avgTime,
    }
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const counts = await Promise.all([
      this.prisma.outreachJob.count({ where: { status: 'pending' } }),
      this.prisma.outreachJob.count({ where: { status: 'queued' } }),
      this.prisma.outreachJob.count({ where: { status: 'processing' } }),
      this.prisma.outreachJob.count({ where: { status: 'completed' } }),
      this.prisma.outreachJob.count({ where: { status: 'failed' } }),
      this.prisma.outreachJob.count({ where: { status: 'retrying' } }),
      this.prisma.outreachJob.count({ where: { status: 'dead_letter' } }),
      this.prisma.outreachJob.count({ where: { status: 'cancelled' } }),
    ])

    return {
      pending: counts[0],
      queued: counts[1],
      processing: counts[2],
      completed: counts[3],
      failed: counts[4],
      retrying: counts[5],
      deadLetter: counts[6],
      cancelled: counts[7],
    }
  }

  async getDeadLetterQueue(campaignId?: string): Promise<DeadLetterEntry[]> {
    const where: Record<string, unknown> = { status: 'dead_letter' }
    if (campaignId) where['campaignId'] = campaignId

    const jobs = await this.prisma.outreachJob.findMany({
      where: where as any,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    return jobs.map(j => ({
      jobId: j.id,
      campaignId: j.campaignId ?? '',
      campaignName: '',
      recipientName: j.recipientName,
      recipientPhone: j.recipientPhone,
      attempts: j.attempts,
      maxAttempts: j.maxAttempts,
      lastError: j.lastError ?? 'Unknown',
      failedAt: j.processedAt ?? j.updatedAt,
    }))
  }

  getSchedulerState() {
    return this.scheduler.getState()
  }

  getMetrics() {
    return this.metrics.getAllCounters()
  }

  getWorkers() {
    return this.workerManager.getWorkers()
  }

  getIsStarted(): boolean {
    return this.isStarted
  }

  private async processQueuedJobs(): Promise<void> {
    const queuedCount = await this.prisma.outreachJob.count({
      where: { status: 'queued', scheduledAt: { lte: new Date() } },
    })

    if (queuedCount === 0) return

    await this.jobProcessor.processNext()
  }

  private countJobStatuses(jobs: { status: string }[]): Record<string, number> {
    const counts: Record<string, number> = {
      pending: 0, queued: 0, processing: 0, completed: 0,
      failed: 0, retrying: 0, deadLetter: 0, cancelled: 0,
    }
    for (const j of jobs) {
      if (j.status in counts) {
        counts[j.status] = (counts[j.status] ?? 0) + 1
      }
    }
    return counts
  }
}
