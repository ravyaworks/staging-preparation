import type { Cache, CacheEntry, CacheOptions, CacheStats } from './types'
import { CacheError } from './types'

interface MemoryCacheItem<T> {
  value: T
  expiresAt: number | null
  createdAt: number
}

export class MemoryCache<T = unknown> implements Cache<T> {
  private store = new Map<string, MemoryCacheItem<T>>()
  private hits = 0
  private misses = 0
  private evictions = 0
  private sweepInterval: ReturnType<typeof setInterval> | null = null
  private readonly defaultTtlMs: number
  private readonly sweepIntervalMs: number

  constructor(options?: { defaultTtlMs?: number; sweepIntervalMs?: number }) {
    this.defaultTtlMs = options?.defaultTtlMs ?? 60_000
    this.sweepIntervalMs = options?.sweepIntervalMs ?? 30_000
    this.startSweeper()
  }

  private resolveKey(key: string, options?: CacheOptions): string {
    return options?.namespace ? `${options.namespace}:${key}` : key
  }

  async get(key: string, options?: CacheOptions): Promise<T | undefined> {
    const resolvedKey = this.resolveKey(key, options)
    const item = this.store.get(resolvedKey)
    if (!item) {
      this.misses++
      return undefined
    }
    if (this.isExpired(item)) {
      this.store.delete(resolvedKey)
      this.evictions++
      this.misses++
      return undefined
    }
    this.hits++
    return item.value
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttlMs ?? this.defaultTtlMs
    const resolvedKey = this.resolveKey(key, options)
    this.store.set(resolvedKey, {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl : null,
      createdAt: Date.now(),
    })
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    return this.store.delete(this.resolveKey(key, options))
  }

  async clear(): Promise<void> {
    this.store.clear()
    this.hits = 0
    this.misses = 0
    this.evictions = 0
  }

  async has(key: string, options?: CacheOptions): Promise<boolean> {
    const resolvedKey = this.resolveKey(key, options)
    const item = this.store.get(resolvedKey)
    if (!item) return false
    if (this.isExpired(item)) {
      this.store.delete(resolvedKey)
      this.evictions++
      return false
    }
    return true
  }

  async getOrSet(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get(key, options)
    if (cached !== undefined) return cached
    const value = await factory()
    await this.set(key, value, options)
    return value
  }

  async stats(): Promise<CacheStats> {
    this.sweep()
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      keys: this.store.size,
      evictions: this.evictions,
    }
  }

  async close(): Promise<void> {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval)
      this.sweepInterval = null
    }
    this.store.clear()
  }

  private isExpired(item: MemoryCacheItem<T>): boolean {
    return item.expiresAt !== null && Date.now() > item.expiresAt
  }

  private sweep(): void {
    for (const [key, item] of this.store) {
      if (this.isExpired(item)) {
        this.store.delete(key)
        this.evictions++
      }
    }
  }

  private startSweeper(): void {
    this.sweepInterval = setInterval(() => this.sweep(), this.sweepIntervalMs)
    if (this.sweepInterval && typeof this.sweepInterval === 'object') {
      this.sweepInterval.unref()
    }
  }
}
