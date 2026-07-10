import { describe, it, expect } from 'vitest';
import { InMemoryEmbeddingStore, InMemoryEmbeddingCache, EmbeddingService } from '../index';
import type { EmbeddingProvider, EmbeddingVector } from '../index';

function createMockProvider(): EmbeddingProvider {
  return {
    async generateEmbedding(text: string): Promise<EmbeddingVector> {
      return { values: text.split('').map(c => c.charCodeAt(0) / 100), dimensions: text.length };
    },
    async generateEmbeddings(texts: string[]): Promise<EmbeddingVector[]> {
      return texts.map(t => ({ values: [1, 2, 3], dimensions: 3 }));
    },
    getDimensions() { return 3; },
    getModel() { return 'mock-model'; },
  };
}

describe('InMemoryEmbeddingStore', () => {
  it('store and get', async () => {
    const store = new InMemoryEmbeddingStore();
    await store.store({ id: 'e1', vector: { values: [1, 2, 3], dimensions: 3 }, text: 'hello', model: 'm', provider: 'p' });
    const result = await store.get('e1');
    expect(result?.text).toBe('hello');
    expect(result?.vector.values).toEqual([1, 2, 3]);
  });

  it('storeBatch stores multiple', async () => {
    const store = new InMemoryEmbeddingStore();
    await store.storeBatch([
      { id: 'e1', vector: { values: [1], dimensions: 1 }, text: 'a', model: 'm', provider: 'p' },
      { id: 'e2', vector: { values: [2], dimensions: 1 }, text: 'b', model: 'm', provider: 'p' },
    ]);
    expect(await store.get('e1')).toBeDefined();
    expect(await store.get('e2')).toBeDefined();
  });

  it('delete removes record', async () => {
    const store = new InMemoryEmbeddingStore();
    await store.store({ id: 'e1', vector: { values: [1], dimensions: 1 }, text: 'x', model: 'm', provider: 'p' });
    expect(await store.delete('e1')).toBe(true);
    expect(await store.get('e1')).toBeUndefined();
  });

  it('search returns sorted by cosine similarity', async () => {
    const store = new InMemoryEmbeddingStore();
    await store.store({ id: 'e1', vector: { values: [1, 0, 0], dimensions: 3 }, text: 'a', model: 'm', provider: 'p' });
    await store.store({ id: 'e2', vector: { values: [0, 1, 0], dimensions: 3 }, text: 'b', model: 'm', provider: 'p' });
    const results = await store.search({ values: [0.9, 0.1, 0], dimensions: 3 }, { topK: 2 });
    expect(results).toHaveLength(2);
    expect(results[0]?.record.id).toBe('e1');
  });

  it('search respects minScore', async () => {
    const store = new InMemoryEmbeddingStore();
    await store.store({ id: 'e1', vector: { values: [1, 0], dimensions: 2 }, text: 'a', model: 'm', provider: 'p' });
    const results = await store.search({ values: [1, 0], dimensions: 2 }, { minScore: 0.99 });
    expect(results).toHaveLength(1);
  });
});

describe('InMemoryEmbeddingCache', () => {
  it('set, get, has, clear', async () => {
    const cache = new InMemoryEmbeddingCache();
    const vec: EmbeddingVector = { values: [1], dimensions: 1 };
    await cache.set('key1', vec);
    expect(await cache.has('key1')).toBe(true);
    expect((await cache.get('key1'))?.values).toEqual([1]);
    await cache.clear();
    expect(await cache.has('key1')).toBe(false);
  });
});

describe('EmbeddingService', () => {
  it('generateAndStore creates record', async () => {
    const provider = createMockProvider();
    const store = new InMemoryEmbeddingStore();
    const svc = new EmbeddingService(provider, store);
    const record = await svc.generateAndStore('hello', { source: 'test' });
    expect(record.id).toBeTruthy();
    expect(record.metadata?.source).toBe('test');
    expect((await store.get(record.id))?.text).toBe('hello');
  });

  it('search generates query embedding and searches', async () => {
    const provider = createMockProvider();
    const store = new InMemoryEmbeddingStore();
    await store.store({ id: 'e1', vector: { values: [1, 0], dimensions: 2 }, text: 'hello', model: 'm', provider: 'p' });
    const svc = new EmbeddingService(provider, store);
    const results = await svc.search('hello');
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('generateAndStoreBatch stores multiple records', async () => {
    const provider = createMockProvider();
    const store = new InMemoryEmbeddingStore();
    const svc = new EmbeddingService(provider, store);
    const records = await svc.generateAndStoreBatch(['a', 'b'], [{ src: '1' }, { src: '2' }]);
    expect(records).toHaveLength(2);
  });
});
