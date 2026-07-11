import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RedisCache } from '../redis-cache'

function createMockRedis() {
  const store = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, _mode: string, _ttl: number) => { store.set(key, ''); return 'OK' as const }),
    setex: vi.fn(async (key: string, _ttl: number, value: string) => { store.set(key, value); return 'OK' as const }),
    del: vi.fn(async (...keys: string[]) => {
      let count = 0
      for (const k of keys) { if (store.delete(k)) count++ }
      return count
    }),
    flushall: vi.fn(async () => { store.clear(); return 'OK' as const }),
    exists: vi.fn(async (key: string) => store.has(key) ? 1 : 0),
    keys: vi.fn(async (pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return Array.from(store.keys()).filter(k => regex.test(k))
    }),
    dbsize: vi.fn(async () => store.size),
    quit: vi.fn(async () => 'OK' as const),
  }
}

describe('RedisCache', () => {
  let mockRedis: ReturnType<typeof createMockRedis>
  let cache: RedisCache

  beforeEach(() => {
    mockRedis = createMockRedis()
    cache = new RedisCache({ client: mockRedis, defaultTtlMs: 60000, prefix: 'test:' })
  })

  it('should set and get values', async () => {
    await cache.set('key1', { hello: 'world' })
    const val = await cache.get('key1')
    expect(val).toEqual({ hello: 'world' })
  })

  it('should return undefined for missing keys', async () => {
    const val = await cache.get('nonexistent')
    expect(val).toBeUndefined()
  })

  it('should use namespaced keys', async () => {
    await cache.set('key1', 'val1', { namespace: 'ns1' })
    const key = 'test:ns1:key1'
    expect(mockRedis.setex).toHaveBeenCalledWith(key, 60, '"val1"')
  })

  it('should delete values', async () => {
    await cache.set('del-key', 'value')
    const deleted = await cache.delete('del-key')
    expect(deleted).toBe(true)
    const val = await cache.get('del-key')
    expect(val).toBeUndefined()
  })

  it('should return false when deleting missing key', async () => {
    const deleted = await cache.delete('missing')
    expect(deleted).toBe(false)
  })

  it('should check existence', async () => {
    await cache.set('exists-key', 'value')
    const exists = await cache.has('exists-key')
    expect(exists).toBe(true)
    const notExists = await cache.has('no-key')
    expect(notExists).toBe(false)
  })

  it('should clear all keys with prefix', async () => {
    await cache.set('a', '1')
    await cache.set('b', '2')
    await cache.clear()
    expect(await cache.get('a')).toBeUndefined()
    expect(await cache.get('b')).toBeUndefined()
    expect(mockRedis.keys).toHaveBeenCalledWith('test:*')
  })

  it('getOrSet should compute and cache', async () => {
    const factory = vi.fn().mockResolvedValue('computed')
    const result1 = await cache.getOrSet('compute-key', factory)
    expect(result1).toBe('computed')
    expect(factory).toHaveBeenCalledTimes(1)

    const result2 = await cache.getOrSet('compute-key', factory)
    expect(result2).toBe('computed')
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('getOrSet should recompute on miss', async () => {
    const factory = vi.fn().mockResolvedValue('fresh')
    await cache.getOrSet('recomp', factory)
    await cache.delete('recomp')
    await cache.getOrSet('recomp', factory)
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it('should provide stats', async () => {
    await cache.get('miss')
    await cache.set('hit-key', 'val')
    await cache.get('hit-key')
    const stats = await cache.stats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.keys).toBeGreaterThanOrEqual(0)
  })

  it('should close gracefully', async () => {
    await cache.close()
    expect(mockRedis.quit).toHaveBeenCalled()
  })
})
