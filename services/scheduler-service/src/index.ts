import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import type { QueueService, Job } from '@conversation-platform/queue'

export interface ScheduleConfig {
  jobType: string
  cronExpression: string
  payload?: Record<string, unknown>
}

export interface SchedulerService {
  registerSchedule(config: ScheduleConfig): void
  start(): Promise<void>
  stop(): Promise<void>
}

export function createSchedulerService(config: AppConfig, logger: Logger, queue: QueueService): SchedulerService {
  const schedules: ScheduleConfig[] = []
  let timer: ReturnType<typeof setInterval> | null = null

  return {
    registerSchedule(schedule: ScheduleConfig): void {
      schedules.push(schedule)
      logger.info({ jobType: schedule.jobType, cron: schedule.cronExpression }, 'Schedule registered')
    },

    async start(): Promise<void> {
      logger.info('Scheduler service started')
      timer = setInterval(() => {
        for (const schedule of schedules) {
          queue.dispatch(schedule.jobType, schedule.payload ?? {})
        }
      }, 60000)
    },

    async stop(): Promise<void> {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      logger.info('Scheduler service stopped')
    },
  }
}
