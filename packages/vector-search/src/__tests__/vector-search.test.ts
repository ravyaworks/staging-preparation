import { describe, it, expect } from 'vitest';
import { SemanticRetriever, MetadataSearchEngine, HybridSearchEngine } from '../index';
import type { SearchQuery, SearchFilter } from '../index';

describe('SemanticRetriever', () => {
  it('index and search by vector similarity', async () => {
    const ret = new SemanticRetriever();
    await ret.index({ id: 'r1', vector: [1, 0, 0], metadata: { text: 'alpha' } });
    await ret.index({ id: 'r2', vector: [0, 1, 0], metadata: { text: 'beta' } });
    const results = await ret.search({ vector: [0.9, 0.1, 0], topK: 2 });
    expect(results).toHaveLength(2);
    expect(results[0]?.record.id).toBe('r1');
  });

  it('search with filter', async () => {
    const ret = new SemanticRetriever();
    await ret.index({ id: 'r1', vector: [1, 0], metadata: { type: 'a' } });
    await ret.index({ id: 'r2', vector: [0, 1], metadata: { type: 'b' } });
    const filter: SearchFilter = { field: 'type', operator: 'eq', value: 'a' };
    const results = await ret.search({ vector: [1, 0], topK: 10, filter });
    expect(results).toHaveLength(1);
    expect(results[0]?.record.id).toBe('r1');
  });

  it('remove deletes record', async () => {
    const ret = new SemanticRetriever();
    await ret.index({ id: 'r1', vector: [1, 0] });
    expect(await ret.remove('r1')).toBe(true);
    const results = await ret.search({ vector: [1, 0], topK: 10 });
    expect(results).toHaveLength(0);
  });

  it('clear removes all records', async () => {
    const ret = new SemanticRetriever();
    await ret.index({ id: 'r1', vector: [1, 0] });
    await ret.index({ id: 'r2', vector: [0, 1] });
    await ret.clear();
    const results = await ret.search({ vector: [1, 0], topK: 10 });
    expect(results).toHaveLength(0);
  });
});

describe('MetadataSearchEngine', () => {
  it('search by eq filter', () => {
    const engine = new MetadataSearchEngine();
    engine.index('r1', { type: 'a', status: 'active' });
    engine.index('r2', { type: 'b', status: 'inactive' });
    const results = engine.search([{ field: 'type', operator: 'eq', value: 'a' }]);
    expect(results).toEqual(['r1']);
  });

  it('search by multiple filters', () => {
    const engine = new MetadataSearchEngine();
    engine.index('r1', { type: 'a', status: 'active' });
    engine.index('r2', { type: 'a', status: 'inactive' });
    const results = engine.search([
      { field: 'type', operator: 'eq', value: 'a' },
      { field: 'status', operator: 'eq', value: 'active' },
    ]);
    expect(results).toEqual(['r1']);
  });

  it('contains filter', () => {
    const engine = new MetadataSearchEngine();
    engine.index('r1', { name: 'Hello World' });
    const results = engine.search([{ field: 'name', operator: 'contains', value: 'World' }]);
    expect(results).toEqual(['r1']);
  });
});

describe('HybridSearchEngine', () => {
  it('combines semantic and metadata search', async () => {
    const semantic = new SemanticRetriever();
    const metadata = new MetadataSearchEngine();
    await semantic.index({ id: 'r1', vector: [1, 0], metadata: { type: 'a' } });
    await semantic.index({ id: 'r2', vector: [0, 1], metadata: { type: 'b' } });
    metadata.index('r1', { type: 'a' });
    metadata.index('r2', { type: 'b' });
    const hybrid = new HybridSearchEngine(semantic, metadata);
    const query: SearchQuery = { vector: [1, 0], topK: 10 };
    const results = await hybrid.search(query, [{ field: 'type', operator: 'eq', value: 'a' }]);
    expect(results).toHaveLength(1);
    expect(results[0]?.record.id).toBe('r1');
  });
});
