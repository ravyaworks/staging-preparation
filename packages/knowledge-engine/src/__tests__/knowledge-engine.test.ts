import { describe, it, expect } from 'vitest';
import { KnowledgeEngine } from '../index';

describe('KnowledgeEngine', () => {
  it('createCollection and getCollection', () => {
    const engine = new KnowledgeEngine();
    const col = engine.createCollection({ name: 'Test', tenantId: 't1' });
    expect(col.id).toBeTruthy();
    expect(engine.getCollection(col.id)?.name).toBe('Test');
  });

  it('listCollections filters by tenant', () => {
    const engine = new KnowledgeEngine();
    engine.createCollection({ name: 'A', tenantId: 't1' });
    engine.createCollection({ name: 'B', tenantId: 't2' });
    expect(engine.listCollections('t1')).toHaveLength(1);
    expect(engine.listCollections('t2')).toHaveLength(1);
  });

  it('updateCollection modifies and sets updatedAt', () => {
    const engine = new KnowledgeEngine();
    const col = engine.createCollection({ name: 'Old', tenantId: 't1' });
    const updated = engine.updateCollection(col.id, { name: 'New' });
    expect(updated?.name).toBe('New');
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(col.updatedAt.getTime());
  });

  it('deleteCollection removes collection', () => {
    const engine = new KnowledgeEngine();
    const col = engine.createCollection({ name: 'D', tenantId: 't1' });
    expect(engine.deleteCollection(col.id)).toBe(true);
    expect(engine.getCollection(col.id)).toBeUndefined();
  });

  it('createDocument with content and versioning', () => {
    const engine = new KnowledgeEngine();
    const doc = engine.createDocument({ collectionId: 'c1', title: 'Doc1', content: 'Hello', status: 'draft' });
    expect(doc.id).toBeTruthy();
    expect(doc.version).toBe(1);
    expect(doc.checksum).toBeTruthy();
  });

  it('updateDocument increments version', () => {
    const engine = new KnowledgeEngine();
    const doc = engine.createDocument({ collectionId: 'c1', title: 'Doc1', content: 'v1', status: 'draft' });
    const updated = engine.updateDocument(doc.id, { content: 'v2' });
    expect(updated?.version).toBe(2);
    expect(updated?.checksum).not.toBe(doc.checksum);
  });

  it('publishDocument sets status to published', () => {
    const engine = new KnowledgeEngine();
    const doc = engine.createDocument({ collectionId: 'c1', title: 'Doc1', content: 'x', status: 'draft' });
    const published = engine.publishDocument(doc.id);
    expect(published?.status).toBe('published');
  });

  it('archiveDocument sets status to archived', () => {
    const engine = new KnowledgeEngine();
    const doc = engine.createDocument({ collectionId: 'c1', title: 'Doc1', content: 'x', status: 'draft' });
    const archived = engine.archiveDocument(doc.id);
    expect(archived?.status).toBe('archived');
  });

  it('search returns scored results', () => {
    const engine = new KnowledgeEngine();
    engine.createDocument({ collectionId: 'c1', title: 'Alpha', content: 'The quick brown fox', status: 'published' });
    engine.createDocument({ collectionId: 'c1', title: 'Beta', content: 'Something else', status: 'published' });
    const results = engine.search({ query: 'fox', collectionId: 'c1' });
    expect(results.length).toBe(1);
    expect(results[0]?.document.title).toBe('Alpha');
    expect(results[0]?.score).toBeGreaterThan(0);
  });

  it('categories CRUD', () => {
    const engine = new KnowledgeEngine();
    const cat = engine.createCategory({ collectionId: 'c1', name: 'FAQ' });
    expect(engine.getCategory(cat.id)?.name).toBe('FAQ');
    expect(engine.listCategories('c1')).toHaveLength(1);
  });

  it('tags CRUD', () => {
    const engine = new KnowledgeEngine();
    const tag = engine.createTag({ collectionId: 'c1', name: 'important' });
    expect(engine.listTags('c1')).toHaveLength(1);
  });

  it('getVersionHistory returns ordered versions', () => {
    const engine = new KnowledgeEngine();
    const doc = engine.createDocument({ collectionId: 'c1', title: 'D', content: 'v1', status: 'draft' });
    engine.updateDocument(doc.id, { content: 'v2' });
    engine.updateDocument(doc.id, { content: 'v3' });
    const history = engine.getVersionHistory(doc.id);
    expect(history).toHaveLength(3);
    expect(history[0]?.version).toBe(1);
    expect(history[2]?.version).toBe(3);
  });

  it('getStats returns correct counts', () => {
    const engine = new KnowledgeEngine();
    engine.createCollection({ name: 'C1', tenantId: 't1' });
    engine.createDocument({ collectionId: 'c1', title: 'D1', content: 'x', status: 'published' });
    engine.createDocument({ collectionId: 'c1', title: 'D2', content: 'y', status: 'draft' });
    const stats = engine.getStats();
    expect(stats.totalDocuments).toBe(2);
    expect(stats.totalCollections).toBe(1);
    expect(stats.publishedCount).toBe(1);
    expect(stats.draftCount).toBe(1);
  });

  it('importDocuments bulk creates documents', () => {
    const engine = new KnowledgeEngine();
    const docs = engine.importDocuments([
      { collectionId: 'c1', title: 'I1', content: 'a', status: 'draft' },
      { collectionId: 'c1', title: 'I2', content: 'b', status: 'published' },
    ]);
    expect(docs).toHaveLength(2);
    expect(engine.getStats().totalDocuments).toBe(2);
  });

  it('exportDocuments returns all or filtered', () => {
    const engine = new KnowledgeEngine();
    engine.createDocument({ collectionId: 'c1', title: 'D1', content: 'x', status: 'draft' });
    engine.createDocument({ collectionId: 'c2', title: 'D2', content: 'y', status: 'draft' });
    expect(engine.exportDocuments('c1')).toHaveLength(1);
    expect(engine.exportDocuments()).toHaveLength(2);
  });
});
