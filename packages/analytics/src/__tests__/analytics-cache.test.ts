import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnalyticsCache } from '../cache/analytics-cache'

describe('AnalyticsCache', () => {
  let cache: AnalyticsCache

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new AnalyticsCache(1000)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores and retrieves values', () => {
    cache.set('test', { foo: 'bar' })
    expect(cache.get('test')).toEqual({ foo: 'bar' })
  })

  it('returns null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('returns null for expired entries', () => {
    cache.set('test', 'value')
    vi.advanceTimersByTime(1500)
    expect(cache.get('test')).toBeNull()
  })

  it('invalidates all entries', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.invalidate()
    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBeNull()
  })

  it('invalidates by pattern', () => {
    cache.set('campaigns:1', 1)
    cache.set('campaigns:2', 2)
    cache.set('overview', 3)
    cache.invalidate('campaigns')
    expect(cache.get('campaigns:1')).toBeNull()
    expect(cache.get('campaigns:2')).toBeNull()
    expect(cache.get('overview')).toBe(3)
  })

  it('generates deterministic cache keys', () => {
    const key1 = cache.getCacheKey('test', { a: 1, b: 2 })
    const key2 = cache.getCacheKey('test', { b: 2, a: 1 })
    expect(key1).toBe(key2)
    expect(key1).toContain('test')
  })

  it('wrap pattern computes and caches', async () => {
    const fn = vi.fn().mockResolvedValue('computed')
    const result1 = await cache.wrap('key', fn)
    const result2 = await cache.wrap('key', fn)
    expect(result1).toBe('computed')
    expect(result2).toBe('computed')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
