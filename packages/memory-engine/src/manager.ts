import type { MemoryEntry, ConversationMemory, SessionMemory, MemoryStats } from './types';
import type { MemoryStore } from './store';
import { MemoryError } from './types';

export class MemoryManager {
  private store: MemoryStore;
  private maxEntriesPerConversation: number;

  constructor(store: MemoryStore, maxEntriesPerConversation = 1000) {
    this.store = store;
    this.maxEntriesPerConversation = maxEntriesPerConversation;
  }

  async addEntry(conversationId: string, entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: `${conversationId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };
    await this.store.saveEntry(newEntry);
    return newEntry;
  }

  async getHistory(conversationId: string, limit?: number): Promise<MemoryEntry[]> {
    return this.store.getEntries(conversationId, limit);
  }

  async getOrCreateConversationMemory(conversationId: string): Promise<ConversationMemory> {
    const existing = await this.store.getConversationMemory(conversationId);
    if (existing) return existing;
    const now = new Date();
    const memory: ConversationMemory = {
      conversationId,
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
    await this.store.saveConversationMemory(memory);
    return memory;
  }

  async setSummary(conversationId: string, summary: string, tokens?: number): Promise<void> {
    const memory = await this.getOrCreateConversationMemory(conversationId);
    memory.summary = summary;
    memory.summaryTokens = tokens;
    memory.updatedAt = new Date();
    await this.store.saveConversationMemory(memory);
  }

  async getSummary(conversationId: string): Promise<string | undefined> {
    const memory = await this.store.getConversationMemory(conversationId);
    return memory?.summary;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.store.deleteConversationMemory(conversationId);
  }

  async getStats(): Promise<MemoryStats> {
    const allConversations = await this.getAllConversationIds();
    let totalEntries = 0;
    let totalTokens = 0;
    let oldest: Date | undefined;
    let newest: Date | undefined;
    for (const id of allConversations) {
      const entries = await this.store.getEntries(id);
      totalEntries += entries.length;
      for (const e of entries) {
        totalTokens += e.tokenCount;
        if (!oldest || e.timestamp < oldest) oldest = e.timestamp;
        if (!newest || e.timestamp > newest) newest = e.timestamp;
      }
    }
    return { totalEntries, totalConversations: allConversations.length, oldestEntry: oldest, newestEntry: newest, totalTokens };
  }

  private async getAllConversationIds(): Promise<string[]> {
    const ids: string[] = [];
    const entries = await this.store.query({});
    const seen = new Set<string>();
    for (const e of entries) {
      if (!seen.has(e.conversationId)) {
        seen.add(e.conversationId);
        ids.push(e.conversationId);
      }
    }
    return ids;
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }
}
