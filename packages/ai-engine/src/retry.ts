import type { RetryStrategy, FallbackStrategy } from './types';
import { AIEngineError } from './types';
import type { ProviderName } from '@conversation-platform/provider-framework';
import { ProviderError, RateLimitError, TimeoutError } from '@conversation-platform/provider-framework';

const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  retryableErrorCodes: ['RATE_LIMITED', 'TIMEOUT', 'SERVER_ERROR', 'UNAVAILABLE'],
};

export function createRetryStrategy(overrides?: Partial<RetryStrategy>): RetryStrategy {
  return { ...DEFAULT_RETRY_STRATEGY, ...overrides };
}

export function calculateDelay(attempt: number, strategy: RetryStrategy): number {
  const delay = strategy.initialDelayMs * Math.pow(strategy.backoffMultiplier, attempt);
  return Math.min(delay, strategy.maxDelayMs);
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof ProviderError) return error.retryable;
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  strategy: RetryStrategy = DEFAULT_RETRY_STRATEGY,
  onRetry?: (error: unknown, attempt: number) => void,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt >= strategy.maxRetries) {
        throw error;
      }
      if (onRetry) onRetry(error, attempt);
      const delay = calculateDelay(attempt, strategy);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export function createFallbackStrategy(providers: Array<{ provider: ProviderName; model: string }>): FallbackStrategy {
  return { providers, onFailure: 'next-provider' };
}

export function getNextFallback(strategy: FallbackStrategy, failed: { provider: ProviderName; model: string }): { provider: ProviderName; model: string } | null {
  const index = strategy.providers.findIndex(p => p.provider === failed.provider && p.model === failed.model);
  if (index === -1 || index >= strategy.providers.length - 1) return null;
  return strategy.providers[index + 1] ?? null;
}
