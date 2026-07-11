import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryCache } from '../memory-cache'

describe('MemoryCache', () => {
  let cache: MemoryCache

  beforeEach(() => {
    cache = new MemoryCache({ defaultTtlMs: 60_000, sweepIntervalMs: 10_000 })
  })

  afterEach(async () => {
    await cache.close()
  })

  it('stores and retrieves values', async () => {
    await cache.set('key1', 'value1')
    expect(await cache.get('key1')).toBe('value1')
  })

  it('returns undefined for missing keys', async () => {
    expect(await cache.get('nonexistent')).toBeUndefined()
  })

  it('returns false for has() on missing keys', async () => {
    expect(await cache.has('nonexistent')).toBe(false)
  })

  it('deletes values', async () => {
    await cache.set('key1', 'value1')
    expect(await cache.delete('key1')).toBe(true)
    expect(await cache.get('key1')).toBeUndefined()
  })

  it('returns false when deleting missing key', async () => {
    expect(await cache.delete('nonexistent')).toBe(false)
  })

  it('clears all values', async () => {
    await cache.set('a', 1)
    await cache.set('b', 2)
    await cache.clear()
    expect(await cache.get('a')).toBeUndefined()
    expect(await cache.get('b')).toBeUndefined()
  })

  it('respects TTL', async () => {
    cache = new MemoryCache({ defaultTtlMs: 50, sweepIntervalMs: 10_000 })
    await cache.set('key1', 'value1', { ttlMs: 50 })
    expect(await cache.get('key1')).toBe('value1')
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(await cache.get('key1')).toBeUndefined()
  })

  it('supports infinite TTL with 0', async () => {
    await cache.set('key1', 'forever', { ttlMs: 0 })
    expect(await cache.get('key1')).toBe('forever')
  })

  it('getOrSet uses factory on miss', async () => {
    const factory = vi.fn().mockResolvedValue('computed')
    const result = await cache.getOrSet('missing', factory)
    expect(result).toBe('computed')
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('getOrSet returns cached value on hit', async () => {
    await cache.set('existing', 'cached')
    const factory = vi.fn().mockResolvedValue('computed')
    const result = await cache.getOrSet('existing', factory)
    expect(result).toBe('cached')
    expect(factory).not.toHaveBeenCalled()
  })

  it('supports namespaced keys', async () => {
    await cache.set('key1', 'value1', { namespace: 'ns1' })
    await cache.set('key1', 'value2', { namespace: 'ns2' })
    expect(await cache.get('key1', { namespace: 'ns1' })).toBe('value1')
    expect(await cache.get('key1', { namespace: 'ns2' })).toBe('value2')
  })

  it('tracks stats', async () => {
    const stats1 = await cache.stats()
    expect(stats1.hits).toBe(0)
    expect(stats1.misses).toBe(0)

    await cache.get('nope')
    await cache.get('nope2')
    await cache.set('yes', 'ok')
    await cache.get('yes')

    const stats2 = await cache.stats()
    expect(stats2.hits).toBe(1)
    expect(stats2.misses).toBe(2)
    expect(stats2.keys).toBe(1)
  })

  it('evicts expired entries on access', async () => {
    cache = new MemoryCache({ defaultTtlMs: 50, sweepIntervalMs: 10_000 })
    await cache.set('ephemeral', 'gone', { ttlMs: 50 })
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(await cache.get('ephemeral')).toBeUndefined()
    const stats = await cache.stats()
    expect(stats.evictions).toBeGreaterThanOrEqual(1)
    expect(stats.keys).toBe(0)
  })
})
