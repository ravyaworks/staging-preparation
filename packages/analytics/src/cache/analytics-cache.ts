interface CacheEntry<T = unknown> {
  data: T
  expiresAt: number
}

export class AnalyticsCache {
  private readonly cache = new Map<string, CacheEntry>()
  private readonly ttlMs: number

  constructor(ttlMs: number = 60_000) {
    this.ttlMs = ttlMs
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  getCacheKey(prefix: string, params: Record<string, unknown>): string {
    const sortedKeys = Object.keys(params).sort()
    const sorted: Record<string, unknown> = {}
    for (const key of sortedKeys) {
      sorted[key] = params[key]
    }
    return `${prefix}:${JSON.stringify(sorted)}`
  }

  async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    const result = await fn()
    this.set(key, result)
    return result
  }
}
