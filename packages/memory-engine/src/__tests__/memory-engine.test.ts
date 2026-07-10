import { describe, it, expect } from 'vitest';
import { InMemoryMemoryStore, MemoryManager } from '../index';
import type { MemoryEntry, ConversationMemory } from '../index';

describe('InMemoryMemoryStore', () => {
  it('saveEntry and getEntries', async () => {
    const store = new InMemoryMemoryStore();
    const entry: MemoryEntry = { id: 'e1', conversationId: 'c1', role: 'user', content: 'hello', tokenCount: 2, timestamp: new Date() };
    await store.saveEntry(entry);
    const entries = await store.getEntries('c1');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.content).toBe('hello');
  });

  it('getEntries with limit and before', async () => {
    const store = new InMemoryMemoryStore();
    await store.saveEntry({ id: 'e1', conversationId: 'c1', role: 'user', content: 'a', tokenCount: 1, timestamp: new Date(1) });
    await store.saveEntry({ id: 'e2', conversationId: 'c1', role: 'user', content: 'b', tokenCount: 1, timestamp: new Date(2) });
    const limited = await store.getEntries('c1', 1);
    expect(limited).toHaveLength(1);
    expect(limited[0]?.id).toBe('e2');
    const before = await store.getEntries('c1', undefined, new Date(2));
    expect(before).toHaveLength(1);
    expect(before[0]?.id).toBe('e1');
  });

  it('CRUD for conversation/session/tenant memory', async () => {
    const store = new InMemoryMemoryStore();
    const now = new Date();
    const convMem: ConversationMemory = { conversationId: 'c1', entries: [], createdAt: now, updatedAt: now };
    await store.saveConversationMemory(convMem);
    expect(await store.getConversationMemory('c1')).toBeDefined();
    await store.deleteConversationMemory('c1');
    expect(await store.getConversationMemory('c1')).toBeUndefined();

    await store.saveSessionMemory({ sessionId: 's1', conversationId: 'c1', createdAt: now, updatedAt: now });
    expect(await store.getSessionMemory('s1')).toBeDefined();

    await store.saveTenantMemory({ tenantId: 't1' });
    expect(await store.getTenantMemory('t1')).toBeDefined();
  });

  it('save/get user preferences', async () => {
    const store = new InMemoryMemoryStore();
    await store.saveUserPreferences({ userId: 'u1', tenantId: 't1', language: 'en' });
    const prefs = await store.getUserPreferences('u1', 't1');
    expect(prefs?.language).toBe('en');
    expect(await store.getUserPreferences('u1', 't2')).toBeUndefined();
  });

  it('query filters and sorts', async () => {
    const store = new InMemoryMemoryStore();
    await store.saveEntry({ id: 'e1', conversationId: 'c1', role: 'user', content: 'a', tokenCount: 1, timestamp: new Date(1) });
    await store.saveEntry({ id: 'e2', conversationId: 'c1', role: 'user', content: 'b', tokenCount: 1, timestamp: new Date(3) });
    await store.saveEntry({ id: 'e3', conversationId: 'c2', role: 'user', content: 'c', tokenCount: 1, timestamp: new Date(2) });
    const results = await store.query({ after: new Date(1), limit: 2 });
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0]?.id).toBe('e3');
  });
});

describe('MemoryManager', () => {
  it('addEntry creates and saves an entry', async () => {
    const store = new InMemoryMemoryStore();
    const mgr = new MemoryManager(store);
    const entry = await mgr.addEntry('c1', { conversationId: 'c1', role: 'user', content: 'hi', tokenCount: 1 });
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeInstanceOf(Date);
    const history = await mgr.getHistory('c1');
    expect(history).toHaveLength(1);
  });

  it('getOrCreateConversationMemory creates if missing', async () => {
    const store = new InMemoryMemoryStore();
    const mgr = new MemoryManager(store);
    const mem = await mgr.getOrCreateConversationMemory('c1');
    expect(mem.conversationId).toBe('c1');
    expect(mem.entries).toEqual([]);
    const mem2 = await mgr.getOrCreateConversationMemory('c1');
    expect(mem2).toBe(mem);
  });

  it('setSummary stores summary on conversation memory', async () => {
    const store = new InMemoryMemoryStore();
    const mgr = new MemoryManager(store);
    await mgr.setSummary('c1', 'conversation summary', 10);
    expect(await mgr.getSummary('c1')).toBe('conversation summary');
  });

  it('getStats returns correct stats', async () => {
    const store = new InMemoryMemoryStore();
    const mgr = new MemoryManager(store);
    await mgr.addEntry('c1', { conversationId: 'c1', role: 'user', content: 'a', tokenCount: 2 });
    await mgr.addEntry('c1', { conversationId: 'c1', role: 'user', content: 'b', tokenCount: 3 });
    const stats = await mgr.getStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.totalConversations).toBe(1);
    expect(stats.totalTokens).toBe(5);
  });
});
