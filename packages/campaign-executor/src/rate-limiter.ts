interface TokenBucket {
  tokens: number
  lastRefill: number
}

export class RateLimiter {
  private minuteBucket: TokenBucket
  private hourBucket: TokenBucket
  private concurrent = 0
  private readonly maxConcurrent: number
  private readonly delayBetweenJobsMs: number
  private lastJobTime = 0

  constructor(
    private readonly tokensPerMinute: number,
    private readonly tokensPerHour: number,
    maxConcurrent: number,
    delayBetweenJobsMs: number,
  ) {
    this.minuteBucket = { tokens: tokensPerMinute, lastRefill: Date.now() }
    this.hourBucket = { tokens: tokensPerHour, lastRefill: Date.now() }
    this.maxConcurrent = maxConcurrent
    this.delayBetweenJobsMs = delayBetweenJobsMs
  }

  async acquire(): Promise<boolean> {
    this.refill(this.minuteBucket, this.tokensPerMinute, 60_000)
    this.refill(this.hourBucket, this.tokensPerHour, 3_600_000)

    if (this.concurrent >= this.maxConcurrent) return false
    if (this.minuteBucket.tokens < 1) return false
    if (this.hourBucket.tokens < 1) return false

    const now = Date.now()
    const elapsed = now - this.lastJobTime
    if (this.lastJobTime > 0 && elapsed < this.delayBetweenJobsMs) return false

    this.minuteBucket.tokens--
    this.hourBucket.tokens--
    this.concurrent++
    this.lastJobTime = now
    return true
  }

  release(): void {
    this.concurrent = Math.max(0, this.concurrent - 1)
  }

  getConcurrent(): number {
    return this.concurrent
  }

  getAvailableTokens(): { perMinute: number; perHour: number } {
    this.refill(this.minuteBucket, this.tokensPerMinute, 60_000)
    this.refill(this.hourBucket, this.tokensPerHour, 3_600_000)
    return {
      perMinute: this.minuteBucket.tokens,
      perHour: this.hourBucket.tokens,
    }
  }

  private refill(bucket: TokenBucket, maxTokens: number, intervalMs: number): void {
    const now = Date.now()
    const elapsed = now - bucket.lastRefill
    const refillTokens = Math.floor(elapsed / intervalMs) * maxTokens
    if (refillTokens > 0) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + refillTokens)
      bucket.lastRefill = now
    }
  }

  reset(): void {
    this.minuteBucket = { tokens: this.tokensPerMinute, lastRefill: Date.now() }
    this.hourBucket = { tokens: this.tokensPerHour, lastRefill: Date.now() }
    this.concurrent = 0
    this.lastJobTime = 0
  }
}
