import { describe, it, expect } from 'vitest';
import { ProviderRegistry, calculateTokenUsage, mergeChunks, createResponseFromChunks, ProviderError, RateLimitError, TimeoutError } from '../index';
import type { AIProvider } from '../index';

describe('ProviderRegistry', () => {
  it('register and get a provider', () => {
    const reg = new ProviderRegistry();
    const mockProvider = { name: 'openai' } as AIProvider;
    reg.register('test', mockProvider);
    expect(reg.get('test')).toBe(mockProvider);
  });

  it('throws when registering duplicate', () => {
    const reg = new ProviderRegistry();
    reg.register('test', { name: 'openai' } as AIProvider);
    expect(() => reg.register('test', { name: 'anthropic' } as AIProvider)).toThrow('already registered');
  });

  it('throws when getting unregistered provider', () => {
    const reg = new ProviderRegistry();
    expect(() => reg.get('nope')).toThrow('not registered');
  });

  it('has, getAll, getNames, unregister, clear work', () => {
    const reg = new ProviderRegistry();
    reg.register('a', { name: 'openai' } as AIProvider);
    reg.register('b', { name: 'anthropic' } as AIProvider);
    expect(reg.has('a')).toBe(true);
    expect(reg.has('c')).toBe(false);
    expect(reg.getNames()).toEqual(['a', 'b']);
    expect(reg.getAll()).toHaveLength(2);
    expect(reg.unregister('a')).toBe(true);
    expect(reg.has('a')).toBe(false);
    reg.clear();
    expect(reg.getNames()).toHaveLength(0);
  });
});

describe('calculateTokenUsage', () => {
  it('estimates tokens based on content length', () => {
    const messages = [{ role: 'user' as const, content: 'hello' }];
    const result = calculateTokenUsage(messages, 'world');
    expect(result.promptTokens).toBe(2);
    expect(result.completionTokens).toBe(2);
    expect(result.totalTokens).toBe(4);
  });
});

describe('mergeChunks', () => {
  it('concatenates content from successive chunks', () => {
    const first = { id: '1', model: 'gpt-4', provider: 'openai' as const, content: 'Hello', finishReason: undefined };
    const second = { id: '2', model: 'gpt-4', provider: 'openai' as const, content: ' World', finishReason: 'stop' };
    const merged = mergeChunks(first, second);
    expect(merged.content).toBe('Hello World');
    expect(merged.finishReason).toBe('stop');
  });

  it('returns the chunk when previous is null', () => {
    const chunk = { id: '1', model: 'gpt-4', provider: 'openai' as const, content: 'Hello', finishReason: undefined };
    expect(mergeChunks(null, chunk)).toBe(chunk);
  });
});

describe('createResponseFromChunks', () => {
  it('assembles a response from chunks', () => {
    const chunks = [
      { id: '1', model: 'gpt-4', provider: 'openai' as const, content: 'Hello ', finishReason: undefined, usage: undefined },
      { id: '2', model: 'gpt-4', provider: 'openai' as const, content: 'World', finishReason: 'stop', usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 } },
    ];
    const res = createResponseFromChunks(chunks);
    expect(res.content).toBe('Hello World');
    expect(res.usage.totalTokens).toBe(7);
    expect(res.finishReason).toBe('stop');
  });
});

describe('Error classes', () => {
  it('ProviderError has correct properties', () => {
    const err = new ProviderError({ code: 'TEST', message: 'error', provider: 'openai', statusCode: 500, retryable: true });
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('TEST');
    expect(err.statusCode).toBe(500);
    expect(err.retryable).toBe(true);
  });

  it('RateLimitError has retryAfter', () => {
    const err = new RateLimitError({ message: 'too fast', provider: 'openai', retryAfter: 30 });
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.statusCode).toBe(429);
    expect(err.retryable).toBe(true);
    expect(err.retryAfter).toBe(30);
  });

  it('TimeoutError has code TIMEOUT', () => {
    const err = new TimeoutError({ message: 'timed out', provider: 'anthropic' });
    expect(err.code).toBe('TIMEOUT');
    expect(err.statusCode).toBe(408);
    expect(err.retryable).toBe(true);
  });
});
