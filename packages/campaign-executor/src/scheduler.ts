import type { Logger } from '@conversation-platform/logger'
import type { ExecutionConfig, SchedulerState } from './types'
import { ExecutionError } from './types'

export class Scheduler {
  private timer: ReturnType<typeof setInterval> | null = null
  private state: SchedulerState = {
    isRunning: false,
    isPaused: false,
    startedAt: null,
    pausedAt: null,
    completedJobs: 0,
    failedJobs: 0,
    totalJobs: 0,
    lastTickAt: null,
  }

  constructor(
    private readonly tickIntervalMs: number,
    private readonly logger: Logger,
  ) {}

  async start(): Promise<void> {
    if (this.state.isRunning) return
    this.state.isRunning = true
    this.state.isPaused = false
    this.state.startedAt = new Date()
    this.logger.info({ tickIntervalMs: this.tickIntervalMs }, 'Scheduler started')
  }

  async stop(): Promise<void> {
    this.state.isRunning = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.logger.info('Scheduler stopped')
  }

  async pause(): Promise<void> {
    if (!this.state.isRunning) {
      throw new ExecutionError('Scheduler is not running', 'SCHEDULER_NOT_RUNNING', 400)
    }
    this.state.isPaused = true
    this.state.pausedAt = new Date()
    this.logger.info('Scheduler paused')
  }

  async resume(): Promise<void> {
    if (!this.state.isRunning) {
      throw new ExecutionError('Scheduler is not running', 'SCHEDULER_NOT_RUNNING', 400)
    }
    this.state.isPaused = false
    this.state.pausedAt = null
    this.logger.info('Scheduler resumed')
  }

  getState(): SchedulerState {
    return { ...this.state }
  }

  isPaused(): boolean {
    return this.state.isPaused
  }

  isRunning(): boolean {
    return this.state.isRunning
  }

  now(): Date {
    return new Date()
  }

  canExecute(campaignConfig: ExecutionConfig): boolean {
    const now = this.now()

    if (campaignConfig.startDate) {
      const start = new Date(campaignConfig.startDate)
      if (now < start) return false
    }

    if (campaignConfig.endDate) {
      const end = new Date(campaignConfig.endDate)
      if (now > end) return false
    }

    if (campaignConfig.startTime) {
      const [h, m] = campaignConfig.startTime.split(':').map(Number)
      const startMinutes = (h ?? 0) * 60 + (m ?? 0)
      const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
      if (currentMinutes < startMinutes) return false
    }

    if (campaignConfig.dailyStartTime && campaignConfig.dailyEndTime) {
      const [sh, sm] = campaignConfig.dailyStartTime.split(':').map(Number)
      const [eh, em] = campaignConfig.dailyEndTime.split(':').map(Number)
      const startMinutes = (sh ?? 0) * 60 + (sm ?? 0)
      const endMinutes = (eh ?? 0) * 60 + (em ?? 0)
      const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()

      if (startMinutes <= endMinutes) {
        if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false
      } else {
        if (currentMinutes < startMinutes && currentMinutes > endMinutes) return false
      }
    }

    return true
  }

  setTickCallback(callback: () => Promise<void>): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(async () => {
      if (!this.state.isRunning || this.state.isPaused) return
      this.state.lastTickAt = new Date()
      try {
        await callback()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.logger.error({ error: message }, 'Scheduler tick error')
      }
    }, this.tickIntervalMs)
  }

  incrementStats(completed: number, failed: number, total: number): void {
    this.state.completedJobs += completed
    this.state.failedJobs += failed
    this.state.totalJobs += total
  }
}
