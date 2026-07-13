export type DeliveryEventType =
  | 'job.created'
  | 'job.draft'
  | 'job.queued'
  | 'job.waiting'
  | 'job.processing'
  | 'job.sent'
  | 'job.completed'
  | 'job.failed'
  | 'job.retrying'
  | 'job.dead_letter'
  | 'job.cancelled'
  | 'job.retry_scheduled'
  | 'job.sender_invoked'
  | 'job.message_sent'
  | 'job.retry_started'
  | 'campaign.started'
  | 'campaign.completed'
  | 'campaign.failed'
  | 'worker.online'
  | 'worker.offline'
  | 'worker.heartbeat'
  | 'queue.overflow'
  | 'high_failure_rate'

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical'

export type ResolutionStatus = 'unresolved' | 'resolved' | 'dismissed' | 'automatic'

export interface DeliveryEventData {
  id: string
  jobId: string
  type: string
  previousStatus: string | null
  currentStatus: string
  timestamp: Date
  workerId: string | null
  channel: string | null
  metadata: Record<string, unknown>
}

export interface JobFailureData {
  id: string
  jobId: string
  errorType: string
  errorMessage: string
  retryCount: number
  lastRetryAt: Date | null
  stackTrace: string | null
  resolutionStatus: ResolutionStatus
  resolvedAt: Date | null
  resolvedBy: string | null
  createdAt: Date
}

export interface WorkerMetricData {
  workerId: string
  currentJobId: string | null
  jobsProcessed: number
  successCount: number
  failureCount: number
  averageProcessingMs: number
  lastHeartbeatAt: Date
  status: 'active' | 'idle' | 'stopped'
  startedAt: Date
}

export interface JobTimelineEntry {
  timestamp: Date
  type: string
  previousStatus: string | null
  currentStatus: string
  workerId: string | null
  durationFromPreviousMs: number | null
}

export interface JobDetails {
  id: string
  recipientName: string
  recipientPhone: string
  messageTemplate: string
  personalizedMessage: string
  status: string
  attempts: number
  maxAttempts: number
  lastError: string | null
  senderResult: Record<string, unknown>
  scheduledAt: Date | null
  processedAt: Date | null
  createdAt: Date
  updatedAt: Date
  campaignId: string | null
  campaignName: string | null
  channel: string | null
  timeline: JobTimelineEntry[]
  failures: JobFailureData[]
  processingDurationMs: number | null
  queueWaitTimeMs: number | null
  currentWorkerId: string | null
}

export interface DeliveryAnalytics {
  periodStart: Date
  periodEnd: Date
  totalJobs: number
  completedJobs: number
  failedJobs: number
  retriedJobs: number
  successRate: number
  failureRate: number
  retryRate: number
  averageJobTimeMs: number
  averageQueueWaitTimeMs: number
  averageProcessingTimeMs: number
  workerUtilization: number
  activeWorkers: number
  idleWorkers: number
  campaignCompletionRates: Array<{
    campaignId: string
    campaignName: string
    completionPercent: number
    totalJobs: number
    completedJobs: number
  }>
}

export interface QueueHealth {
  currentLoad: number
  queuedCount: number
  processingCount: number
  averageWaitTimeMs: number
  throughputPerMinute: number
  deadLetterCount: number
  oldestJobAgeMs: number
  isHealthy: boolean
}

export interface WorkerStatus {
  workerId: string
  status: string
  currentJobId: string | null
  jobsProcessed: number
  successCount: number
  failureCount: number
  averageProcessingMs: number
  uptimeMs: number
  lastHeartbeatAt: Date
}

export class DeliveryTrackingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'DeliveryTrackingError'
  }
}
