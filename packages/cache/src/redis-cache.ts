import type { Cache, CacheOptions, CacheStats } from './types'
import { CacheError } from './types'

interface RedisLike {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK' | null>
  setex(key: string, ttl: number, value: string): Promise<'OK' | null>
  del(...keys: string[]): Promise<number>
  flushall(): Promise<'OK' | null>
  exists(key: string): Promise<number>
  keys(pattern: string): Promise<string[]>
  dbsize(): Promise<number>
  quit(): Promise<'OK'>
}

export class RedisCache<T = unknown> implements Cache<T> {
  private client: RedisLike
  private hits = 0
  private misses = 0
  private evictions = 0
  private readonly defaultTtlMs: number
  private readonly prefix: string

  constructor(options?: {
    client?: RedisLike
    defaultTtlMs?: number
    prefix?: string
  }) {
    this.defaultTtlMs = options?.defaultTtlMs ?? 60_000
    this.prefix = options?.prefix ?? 'cache:'
    this.client = options?.client ?? this.createDefaultClient()
  }

  private createDefaultClient(): RedisLike {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const IORedis = require('ioredis')
      return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
    } catch {
      throw new CacheError('ioredis not available. Install ioredis or provide a custom client.')
    }
  }

  private resolveKey(key: string, options?: CacheOptions): string {
    const ns = options?.namespace ? `${options.namespace}:` : ''
    return `${this.prefix}${ns}${key}`
  }

  private ttlToSeconds(ttlMs?: number): number {
    const ms = ttlMs ?? this.defaultTtlMs
    return Math.max(1, Math.ceil(ms / 1000))
  }

  async get(key: string, options?: CacheOptions): Promise<T | undefined> {
    try {
      const resolvedKey = this.resolveKey(key, options)
      const raw = await this.client.get(resolvedKey)
      if (raw === null) {
        this.misses++
        return undefined
      }
      this.hits++
      return JSON.parse(raw) as T
    } catch (err) {
      this.misses++
      return undefined
    }
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const resolvedKey = this.resolveKey(key, options)
      const ttl = this.ttlToSeconds(options?.ttlMs)
      const serialized = JSON.stringify(value)
      await this.client.setex(resolvedKey, ttl, serialized)
    } catch (err) {
      throw new CacheError('Failed to set cache entry', err)
    }
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const resolvedKey = this.resolveKey(key, options)
      const result = await this.client.del(resolvedKey)
      return result > 0
    } catch {
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      const allKeys = await this.client.keys(`${this.prefix}*`)
      if (allKeys.length > 0) {
        await this.client.del(...allKeys)
      }
      this.hits = 0
      this.misses = 0
      this.evictions = 0
    } catch (err) {
      throw new CacheError('Failed to clear cache', err)
    }
  }

  async has(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const resolvedKey = this.resolveKey(key, options)
      const result = await this.client.exists(resolvedKey)
      return result === 1
    } catch {
      return false
    }
  }

  async getOrSet(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get(key, options)
    if (cached !== undefined) return cached
    const value = await factory()
    await this.set(key, value, options)
    return value
  }

  async stats(): Promise<CacheStats> {
    try {
      const size = await this.client.dbsize()
      return {
        size,
        hits: this.hits,
        misses: this.misses,
        keys: size,
        evictions: this.evictions,
      }
    } catch {
      return { size: 0, hits: this.hits, misses: this.misses, keys: 0, evictions: this.evictions }
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.quit()
    } catch {
      // Ignore errors on close
    }
  }
}
