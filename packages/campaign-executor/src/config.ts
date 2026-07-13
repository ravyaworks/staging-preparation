export interface ExecutorConfig {
  queuePollIntervalMs: number
  defaultRetryCount: number
  defaultRetryDelaysMs: number[]
  defaultRateLimitPerMinute: number
  defaultRateLimitPerHour: number
  defaultMaxConcurrent: number
  defaultDelayBetweenJobsMs: number
  workerHeartbeatIntervalMs: number
  workerStaleTimeoutMs: number
  schedulerTickIntervalMs: number
  defaultTimezone: string
}

export function loadExecutorConfig(): ExecutorConfig {
  return {
    queuePollIntervalMs: parseInt(process.env['EXECUTOR_QUEUE_POLL_MS'] ?? '1000', 10),
    defaultRetryCount: parseInt(process.env['EXECUTOR_RETRY_COUNT'] ?? '3', 10),
    defaultRetryDelaysMs: parseDelays(process.env['EXECUTOR_RETRY_DELAYS_MS'] ?? '30000,120000,300000'),
    defaultRateLimitPerMinute: parseInt(process.env['EXECUTOR_RATE_LIMIT_PER_MINUTE'] ?? '30', 10),
    defaultRateLimitPerHour: parseInt(process.env['EXECUTOR_RATE_LIMIT_PER_HOUR'] ?? '500', 10),
    defaultMaxConcurrent: parseInt(process.env['EXECUTOR_MAX_CONCURRENT'] ?? '10', 10),
    defaultDelayBetweenJobsMs: parseInt(process.env['EXECUTOR_DELAY_BETWEEN_JOBS_MS'] ?? '200', 10),
    workerHeartbeatIntervalMs: parseInt(process.env['EXECUTOR_WORKER_HEARTBEAT_MS'] ?? '5000', 10),
    workerStaleTimeoutMs: parseInt(process.env['EXECUTOR_WORKER_STALE_TIMEOUT_MS'] ?? '30000', 10),
    schedulerTickIntervalMs: parseInt(process.env['EXECUTOR_SCHEDULER_TICK_MS'] ?? '2000', 10),
    defaultTimezone: process.env['EXECUTOR_DEFAULT_TIMEZONE'] ?? 'UTC',
  }
}

function parseDelays(value: string): number[] {
  return value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0)
}
