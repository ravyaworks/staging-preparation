import { describe, it, expect } from 'vitest'
import { RateLimiter } from '../rate-limiter'

describe('RateLimiter', () => {
  function createLimiter() {
    return new RateLimiter(30, 500, 10, 200)
  }

  it('should allow acquiring a token when under limits', async () => {
    const limiter = createLimiter()
    const result = await limiter.acquire()
    expect(result).toBe(true)
  })

  it('should block when concurrent limit is reached', async () => {
    const limiter = new RateLimiter(100, 1000, 2, 0)
    expect(await limiter.acquire()).toBe(true)
    expect(await limiter.acquire()).toBe(true)
    expect(await limiter.acquire()).toBe(false)
  })

  it('should allow release to free concurrent slot', async () => {
    const limiter = new RateLimiter(100, 1000, 1, 0)
    expect(await limiter.acquire()).toBe(true)
    expect(await limiter.acquire()).toBe(false)
    limiter.release()
    expect(await limiter.acquire()).toBe(true)
  })

  it('should report concurrent count', () => {
    const limiter = createLimiter()
    expect(limiter.getConcurrent()).toBe(0)
  })

  it('should report available tokens', () => {
    const limiter = new RateLimiter(60, 1000, 10, 0)
    const tokens = limiter.getAvailableTokens()
    expect(tokens.perMinute).toBe(60)
    expect(tokens.perHour).toBe(1000)
  })

  it('should reset state correctly', async () => {
    const limiter = new RateLimiter(1, 10, 1, 0)
    await limiter.acquire()
    expect(limiter.getConcurrent()).toBe(1)
    limiter.reset()
    expect(limiter.getConcurrent()).toBe(0)
    const tokens = limiter.getAvailableTokens()
    expect(tokens.perMinute).toBe(1)
    expect(tokens.perHour).toBe(10)
  })

  it('should enforce delay between jobs', async () => {
    const limiter = new RateLimiter(100, 1000, 10, 50000)
    expect(await limiter.acquire()).toBe(true)
    expect(await limiter.acquire()).toBe(false)
  })
})
