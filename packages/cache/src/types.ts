export interface CacheEntry<T> {
  value: T
  expiresAt: number | null
  createdAt: number
}

export interface CacheOptions {
  ttlMs?: number
  namespace?: string
}

export interface CacheStats {
  size: number
  hits: number
  misses: number
  keys: number
  evictions: number
}

export interface Cache<T = unknown> {
  get(key: string): Promise<T | undefined>
  set(key: string, value: T, options?: CacheOptions): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
  getOrSet(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>
  stats(): Promise<CacheStats>
  close(): Promise<void>
}

export class CacheError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message)
    this.name = 'CacheError'
  }
}
