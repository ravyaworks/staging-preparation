import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { RedisCache } from '@conversation-platform/cache';

function createMockRedisClient() {
  const store = new Map<string, { value: string; expiresAt?: number }>();
  return {
    store,
    get: vi.fn(async (key: string) => { const entry = store.get(key); if (!entry) return null; if (entry.expiresAt && Date.now() > entry.expiresAt) { store.delete(key); return null; } return entry.value; }),
    set: vi.fn(async () => 'OK' as const),
    setex: vi.fn(async (key: string, ttl: number, value: string) => { store.set(key, { value, expiresAt: Date.now() + ttl * 1000 }); return 'OK' as const; }),
    del: vi.fn(async (...keys: string[]) => { let count = 0; for (const key of keys) if (store.delete(key)) count++; return count; }),
    flushall: vi.fn(async () => { store.clear(); return 'OK' as const; }),
    exists: vi.fn(async (key: string) => store.has(key) ? 1 : 0),
    keys: vi.fn(async (pattern: string) => { const prefix = pattern.replace('*', ''); return Array.from(store.keys()).filter(k => k.startsWith(prefix)); }),
    dbsize: vi.fn(async () => store.size),
    quit: vi.fn(async () => 'OK' as const),
  };
}

describe('Redis Cache Integration', () => {
  let cache: RedisCache;
  let mockClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(() => {
    mockClient = createMockRedisClient();
    cache = new RedisCache({ client: mockClient as any, defaultTtlMs: 60_000, prefix: 'test:' });
  });

  afterAll(async () => { await cache.close(); });

  describe('Set and Get', () => {
    it('should set and get a string value', async () => {
      mockClient.get.mockResolvedValueOnce(JSON.stringify('hello'));
      await cache.set('greeting', 'hello');
      expect(await cache.get<string>('greeting')).toBe('hello');
    });

    it('should set and get an object value', async () => {
      const obj = { name: 'Acme', count: 42 };
      mockClient.get.mockResolvedValueOnce(JSON.stringify(obj));
      await cache.set('config', obj);
      expect(await cache.get<typeof obj>('config')).toEqual(obj);
    });

    it('should return undefined for missing keys', async () => {
      mockClient.get.mockResolvedValueOnce(null);
      expect(await cache.get('nonexistent')).toBeUndefined();
    });

    it('should delete a key', async () => {
      mockClient.del.mockResolvedValueOnce(1);
      expect(await cache.delete('to-delete')).toBe(true);
    });
  });

  describe('TTL Expiration', () => {
    it('should use custom TTL', async () => {
      await cache.set('short-lived', 'data', { ttlMs: 5000 });
      expect(mockClient.setex).toHaveBeenCalledWith('test:short-lived', 5, '"data"');
    });

    it('should use namespace in key', async () => {
      await cache.set('key1', 'value', { namespace: 'users' });
      expect(mockClient.setex).toHaveBeenCalledWith('test:users:key1', 60, '"value"');
    });
  });

  describe('Cache Patterns', () => {
    it('should implement getOrSet with cache hit', async () => {
      mockClient.get.mockResolvedValueOnce(JSON.stringify('cached'));
      const factory = vi.fn(async () => 'fresh');
      expect(await cache.getOrSet('key', factory)).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should implement getOrSet with cache miss', async () => {
      mockClient.get.mockResolvedValueOnce(null);
      const factory = vi.fn(async () => 'fresh');
      expect(await cache.getOrSet('key', factory)).toBe('fresh');
      expect(factory).toHaveBeenCalledOnce();
    });

    it('should clear only prefixed keys', async () => {
      mockClient.keys.mockResolvedValueOnce(['test:a', 'test:b', 'other:c']);
      await cache.clear();
      expect(mockClient.del).toHaveBeenCalledWith('test:a', 'test:b', 'other:c');
    });
  });

  describe('Error Handling', () => {
    it('should handle get errors gracefully', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('connection lost'));
      expect(await cache.get('error-key')).toBeUndefined();
    });

    it('should handle delete errors gracefully', async () => {
      mockClient.del.mockRejectedValueOnce(new Error('del failed'));
      expect(await cache.delete('fail')).toBe(false);
    });
  });
});
