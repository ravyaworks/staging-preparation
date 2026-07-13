import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Scheduler } from '../scheduler'
import { ExecutionError } from '../types'

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
  setLevel: vi.fn(),
  getLevel: vi.fn().mockReturnValue('info'),
}

describe('Scheduler', () => {
  let scheduler: Scheduler

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    scheduler = new Scheduler(1000, mockLogger)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start and stop', async () => {
    await scheduler.start()
    expect(scheduler.isRunning()).toBe(true)
    expect(scheduler.isPaused()).toBe(false)

    await scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  it('should not start twice', async () => {
    await scheduler.start()
    await scheduler.start()
    expect(scheduler.isRunning()).toBe(true)
  })

  it('should pause and resume', async () => {
    await scheduler.start()
    await scheduler.pause()
    expect(scheduler.isPaused()).toBe(true)

    await scheduler.resume()
    expect(scheduler.isPaused()).toBe(false)
  })

  it('should throw when pausing a stopped scheduler', async () => {
    await expect(scheduler.pause()).rejects.toThrow(ExecutionError)
  })

  it('should throw when resuming a stopped scheduler', async () => {
    await expect(scheduler.resume()).rejects.toThrow(ExecutionError)
  })

  it('should return state', async () => {
    await scheduler.start()
    const state = scheduler.getState()
    expect(state.isRunning).toBe(true)
    expect(state.isPaused).toBe(false)
    expect(state.startedAt).toBeInstanceOf(Date)
  })

  it('should execute within date range', () => {
    const config = {
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      startTime: null,
      dailyStartTime: null,
      dailyEndTime: null,
      timezone: 'UTC',
      retryCount: 3,
      retryDelaysMs: [1000],
      rateLimitPerMinute: 30,
      rateLimitPerHour: 500,
      maxConcurrent: 10,
      delayBetweenJobsMs: 200,
    }
    expect(scheduler.canExecute(config)).toBe(true)
  })

  it('should not execute before startDate', () => {
    const config = {
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: null,
      startTime: null,
      dailyStartTime: null,
      dailyEndTime: null,
      timezone: 'UTC',
      retryCount: 3,
      retryDelaysMs: [1000],
      rateLimitPerMinute: 30,
      rateLimitPerHour: 500,
      maxConcurrent: 10,
      delayBetweenJobsMs: 200,
    }
    expect(scheduler.canExecute(config)).toBe(false)
  })

  it('should not execute after endDate', () => {
    const config = {
      startDate: null,
      endDate: new Date(Date.now() - 86400000).toISOString(),
      startTime: null,
      dailyStartTime: null,
      dailyEndTime: null,
      timezone: 'UTC',
      retryCount: 3,
      retryDelaysMs: [1000],
      rateLimitPerMinute: 30,
      rateLimitPerHour: 500,
      maxConcurrent: 10,
      delayBetweenJobsMs: 200,
    }
    expect(scheduler.canExecute(config)).toBe(false)
  })

  it('should not execute outside daily time window', () => {
    const config = {
      startDate: null,
      endDate: null,
      startTime: null,
      dailyStartTime: '01:00',
      dailyEndTime: '02:00',
      timezone: 'UTC',
      retryCount: 3,
      retryDelaysMs: [1000],
      rateLimitPerMinute: 30,
      rateLimitPerHour: 500,
      maxConcurrent: 10,
      delayBetweenJobsMs: 200,
    }
    expect(scheduler.canExecute(config)).toBe(false)
  })

  it('should increment stats', async () => {
    await scheduler.start()
    scheduler.incrementStats(5, 2, 10)
    const state = scheduler.getState()
    expect(state.completedJobs).toBe(5)
    expect(state.failedJobs).toBe(2)
    expect(state.totalJobs).toBe(10)
  })

  it('should set tick callback and call it on interval', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    await scheduler.start()
    scheduler.setTickCallback(callback)

    vi.advanceTimersByTime(5000)
    expect(callback).toHaveBeenCalled()
  })

  it('should not call tick callback when paused', async () => {
    const callback = vi.fn().mockResolvedValue(undefined)
    await scheduler.start()
    await scheduler.pause()
    scheduler.setTickCallback(callback)

    vi.advanceTimersByTime(5000)
    expect(callback).not.toHaveBeenCalled()
  })
})
