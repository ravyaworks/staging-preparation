import { describe, it, expect, vi } from 'vitest'
import { RetryPolicy } from '../retry-policy'

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

describe('RetryPolicy', () => {
  function createPolicy(maxRetries = 3) {
    return new RetryPolicy(maxRetries, [1000, 5000, 30000], mockLogger)
  }

  it('should allow retry when under max retries', () => {
    const policy = createPolicy(3)
    expect(policy.canRetry(0)).toBe(true)
    expect(policy.canRetry(1)).toBe(true)
    expect(policy.canRetry(2)).toBe(true)
    expect(policy.canRetry(3)).toBe(false)
    expect(policy.canRetry(4)).toBe(false)
  })

  it('should return correct delay for each attempt', () => {
    const policy = createPolicy(3)
    expect(policy.getDelayMs(1)).toBe(1000)
    expect(policy.getDelayMs(2)).toBe(5000)
    expect(policy.getDelayMs(3)).toBe(30000)
  })

  it('should return last delay for attempts beyond delay array', () => {
    const policy = new RetryPolicy(5, [1000], mockLogger)
    expect(policy.getDelayMs(1)).toBe(1000)
    expect(policy.getDelayMs(3)).toBe(1000)
    expect(policy.getDelayMs(5)).toBe(1000)
  })

  it('should pad delays array if shorter than maxRetries', () => {
    const policy = new RetryPolicy(5, [1000], mockLogger)
    const delays = policy.getDelaysMs()
    expect(delays).toHaveLength(5)
    expect(delays[0]).toBe(1000)
    expect(delays[4]).toBe(1000)
  })

  it('should move to dead letter when retries exhausted', () => {
    const policy = createPolicy(1)
    expect(policy.canRetry(1)).toBe(false)
    expect(policy.shouldMoveToDeadLetter(1, 'test error')).toBe(true)
  })

  it('should not move to dead letter when retries remain', () => {
    const policy = createPolicy(3)
    expect(policy.shouldMoveToDeadLetter(1, 'test error')).toBe(false)
    expect(policy.shouldMoveToDeadLetter(2, 'test error')).toBe(false)
  })

  it('should return getNextScheduledAt in the future', () => {
    const policy = createPolicy(3)
    const next = policy.getNextScheduledAt(1)
    expect(next.getTime()).toBeGreaterThan(Date.now())
  })

  it('should return getMaxRetries', () => {
    const policy = createPolicy(5)
    expect(policy.getMaxRetries()).toBe(5)
  })
})
