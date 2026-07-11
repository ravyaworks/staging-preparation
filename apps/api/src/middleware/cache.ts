import { MemoryCache } from '@conversation-platform/cache'
import type { Cache } from '@conversation-platform/cache'

export const appCache: Cache = new MemoryCache({
  defaultTtlMs: 60_000,
  sweepIntervalMs: 30_000,
})

export function withCache<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs?: number,
): Promise<T> {
  return appCache.getOrSet(key, factory, { ttlMs }) as Promise<T>
}

export async function invalidateCache(pattern?: string): Promise<void> {
  if (pattern) {
    // Pattern-based invalidation requires a more sophisticated cache backend
  }
  await appCache.clear()
}
