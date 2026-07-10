import { describe, it, expect, vi } from 'vitest';
import { UsageTracker, estimateCost, createRetryStrategy, calculateDelay, isRetryable, withRetry, createFallbackStrategy, getNextFallback } from '../index';
import { ProviderError, RateLimitError, TimeoutError } from '@conversation-platform/provider-framework';
import type { ProviderName } from '@conversation-platform/provider-framework';

describe('UsageTracker', () => {
  it('track and getTotalCost/getTotalTokens', () => {
    const tracker = new UsageTracker();
    const cost1 = tracker.track('openai', 'gpt-4o', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 });
    expect(cost1.totalTokens).toBe(1500);
    const cost2 = tracker.track('openai', 'gpt-4o', { promptTokens: 500, completionTokens: 500, totalTokens: 1000 });
    expect(tracker.getTotalCost()).toBeCloseTo(cost1.estimatedCost + cost2.estimatedCost);
  });

  it('getProviderUsage and getModelUsage filter correctly', () => {
    const tracker = new UsageTracker();
    tracker.track('openai', 'gpt-4o', { promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    tracker.track('anthropic', 'claude-sonnet-4-20250514', { promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    expect(tracker.getProviderUsage('openai')).toHaveLength(1);
    expect(tracker.getModelUsage('gpt-4o')).toHaveLength(1);
    expect(tracker.count).toBe(2);
    tracker.clear();
    expect(tracker.count).toBe(0);
  });
});

describe('estimateCost', () => {
  it('calculates cost based on model pricing', () => {
    const result = estimateCost('openai', 'gpt-4o', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 });
    expect(result.promptTokens).toBe(1000);
    expect(result.completionTokens).toBe(500);
    expect(result.estimatedCost).toBeGreaterThan(0);
    expect(result.currency).toBe('USD');
  });

  it('handles unknown model with zero cost', () => {
    const result = estimateCost('openai', 'unknown-model', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 });
    expect(result.estimatedCost).toBe(0);
  });
});

describe('createRetryStrategy', () => {
  it('returns defaults when no overrides', () => {
    const s = createRetryStrategy();
    expect(s.maxRetries).toBe(3);
    expect(s.initialDelayMs).toBe(1000);
  });

  it('merges overrides with defaults', () => {
    const s = createRetryStrategy({ maxRetries: 5 });
    expect(s.maxRetries).toBe(5);
    expect(s.initialDelayMs).toBe(1000);
  });
});

describe('calculateDelay', () => {
  it('implements exponential backoff with max cap', () => {
    const s = createRetryStrategy({ initialDelayMs: 1000, backoffMultiplier: 2, maxDelayMs: 5000 });
    expect(calculateDelay(0, s)).toBe(1000);
    expect(calculateDelay(2, s)).toBe(4000);
    expect(calculateDelay(10, s)).toBe(5000);
  });
});

describe('isRetryable', () => {
  it('returns true for RateLimitError', () => {
    expect(isRetryable(new RateLimitError({ message: 'x', provider: 'openai' }))).toBe(true);
  });

  it('returns true for TimeoutError', () => {
    expect(isRetryable(new TimeoutError({ message: 'x', provider: 'openai' }))).toBe(true);
  });

  it('returns false for non-retryable errors', () => {
    expect(isRetryable(new Error('generic'))).toBe(false);
  });

  it('returns retryable property for ProviderError', () => {
    expect(isRetryable(new ProviderError({ code: 'X', message: 'x', provider: 'openai', retryable: true }))).toBe(true);
    expect(isRetryable(new ProviderError({ code: 'X', message: 'x', provider: 'openai', retryable: false }))).toBe(false);
  });
});

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new RateLimitError({ message: 'x', provider: 'openai' }))
      .mockResolvedValueOnce('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    const err = new RateLimitError({ message: 'x', provider: 'openai' });
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn, createRetryStrategy({ maxRetries: 1 }))).rejects.toThrow(err);
  });

  it('does not retry non-retryable errors', async () => {
    const err = new Error('fatal');
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn)).rejects.toThrow(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('createFallbackStrategy and getNextFallback', () => {
  it('creates a fallback strategy', () => {
    const strategy = createFallbackStrategy([{ provider: 'openai', model: 'gpt-4o' }, { provider: 'anthropic', model: 'claude-sonnet-4-20250514' }]);
    expect(strategy.providers).toHaveLength(2);
  });

  it('getNextFallback returns next provider', () => {
    const strategy = createFallbackStrategy([{ provider: 'openai', model: 'gpt-4o' }, { provider: 'anthropic', model: 'claude-sonnet-4-20250514' }]);
    const next = getNextFallback(strategy, { provider: 'openai', model: 'gpt-4o' });
    expect(next?.provider).toBe('anthropic');
  });

  it('getNextFallback returns null for last provider', () => {
    const strategy = createFallbackStrategy([{ provider: 'openai', model: 'gpt-4o' }]);
    expect(getNextFallback(strategy, { provider: 'openai', model: 'gpt-4o' })).toBeNull();
  });

  it('getNextFallback returns null for unknown provider', () => {
    const strategy = createFallbackStrategy([{ provider: 'openai', model: 'gpt-4o' }]);
    expect(getNextFallback(strategy, { provider: 'ollama' as ProviderName, model: 'x' })).toBeNull();
  });
});
