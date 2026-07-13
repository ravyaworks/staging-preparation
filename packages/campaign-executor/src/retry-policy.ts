import type { Logger } from '@conversation-platform/logger'

export class RetryPolicy {
  constructor(
    private readonly maxRetries: number,
    private readonly delaysMs: number[],
    private readonly logger: Logger,
  ) {
    if (delaysMs.length < maxRetries) {
      const last = delaysMs[delaysMs.length - 1] ?? 60_000
      while (this.delaysMs.length < maxRetries) {
        this.delaysMs.push(last)
      }
    }
  }

  getDelayMs(attempt: number): number {
    const index = Math.min(attempt - 1, this.delaysMs.length - 1)
    return this.delaysMs[index] ?? 60_000
  }

  canRetry(attempts: number): boolean {
    return attempts < this.maxRetries
  }

  getMaxRetries(): number {
    return this.maxRetries
  }

  getDelaysMs(): number[] {
    return [...this.delaysMs]
  }

  shouldMoveToDeadLetter(attempts: number, lastError: string): boolean {
    const canRetry = this.canRetry(attempts)
    if (!canRetry) {
      this.logger.warn({ attempts, maxRetries: this.maxRetries, lastError }, 'Job moved to dead letter queue')
    }
    return !canRetry
  }

  getNextScheduledAt(attempt: number): Date {
    return new Date(Date.now() + this.getDelayMs(attempt))
  }
}
