export type JobExecutionStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'dead_letter'
  | 'cancelled'

export type ExecutionEventType =
  | 'campaign.started'
  | 'campaign.paused'
  | 'campaign.resumed'
  | 'campaign.completed'
  | 'campaign.cancelled'
  | 'campaign.failed'
  | 'job.queued'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'job.retrying'
  | 'job.dead_letter'
  | 'job.cancelled'
  | 'worker.started'
  | 'worker.stopped'
  | 'worker.heartbeat'
  | 'scheduler.tick'

export interface ExecutionConfig {
  startDate: string | null
  startTime: string | null
  endDate: string | null
  dailyStartTime: string | null
  dailyEndTime: string | null
  timezone: string
  retryCount: number
  retryDelaysMs: number[]
  rateLimitPerMinute: number
  rateLimitPerHour: number
  maxConcurrent: number
  delayBetweenJobsMs: number
}

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  startDate: null,
  startTime: null,
  endDate: null,
  dailyStartTime: null,
  dailyEndTime: null,
  timezone: 'UTC',
  retryCount: 3,
  retryDelaysMs: [30000, 120000, 300000],
  rateLimitPerMinute: 30,
  rateLimitPerHour: 500,
  maxConcurrent: 10,
  delayBetweenJobsMs: 200,
}

export interface SchedulerState {
  isRunning: boolean
  isPaused: boolean
  startedAt: Date | null
  pausedAt: Date | null
  completedJobs: number
  failedJobs: number
  totalJobs: number
  lastTickAt: Date | null
}

export interface QueueStatus {
  pending: number
  queued: number
  processing: number
  completed: number
  failed: number
  retrying: number
  deadLetter: number
  cancelled: number
}

export interface WorkerInfo {
  id: string
  status: 'active' | 'idle' | 'stopped'
  startedAt: Date
  lastHeartbeatAt: Date
  jobsProcessed: number
  currentJobId: string | null
}

export interface DeadLetterEntry {
  jobId: string
  campaignId: string
  campaignName: string
  recipientName: string
  recipientPhone: string
  attempts: number
  maxAttempts: number
  lastError: string
  failedAt: Date
}

export interface CampaignProgress {
  campaignId: string
  campaignName: string
  status: string
  total: number
  pending: number
  queued: number
  processing: number
  completed: number
  failed: number
  retrying: number
  deadLetter: number
  cancelled: number
  progressPercent: number
  estimatedCompletionAt: Date | null
  averageProcessingTimeMs: number
}

export interface IOutreachSender {
  send(recipientPhone: string, message: string, metadata?: Record<string, unknown>): Promise<{
    success: boolean
    messageId?: string
    error?: string
    metadata?: Record<string, unknown>
  }>
}

export class ExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'ExecutionError'
  }
}
