import type { MemoryEntry, ConversationMemory, SessionMemory, TenantMemory, UserPreferences, MemoryQuery } from './types';
import type { MemoryStore } from './store';

export class InMemoryMemoryStore implements MemoryStore {
  private entries = new Map<string, MemoryEntry[]>();
  private conversations = new Map<string, ConversationMemory>();
  private sessions = new Map<string, SessionMemory>();
  private tenants = new Map<string, TenantMemory>();
  private userPrefs = new Map<string, UserPreferences>();

  async saveEntry(entry: MemoryEntry): Promise<void> {
    const key = entry.conversationId;
    const existing = this.entries.get(key) ?? [];
    existing.push(entry);
    this.entries.set(key, existing);
    const conv = this.conversations.get(key);
    if (conv) {
      conv.entries = existing;
      conv.updatedAt = new Date();
    }
  }

  async getEntries(conversationId: string, limit?: number, before?: Date): Promise<MemoryEntry[]> {
    let entries = this.entries.get(conversationId) ?? [];
    if (before) entries = entries.filter(e => e.timestamp < before);
    if (limit) entries = entries.slice(-limit);
    return entries;
  }

  async getConversationMemory(conversationId: string): Promise<ConversationMemory | undefined> {
    return this.conversations.get(conversationId);
  }

  async saveConversationMemory(memory: ConversationMemory): Promise<void> {
    this.conversations.set(memory.conversationId, memory);
    this.entries.set(memory.conversationId, memory.entries);
  }

  async deleteConversationMemory(conversationId: string): Promise<void> {
    this.conversations.delete(conversationId);
    this.entries.delete(conversationId);
  }

  async saveSessionMemory(memory: SessionMemory): Promise<void> {
    this.sessions.set(memory.sessionId, memory);
  }

  async getSessionMemory(sessionId: string): Promise<SessionMemory | undefined> {
    return this.sessions.get(sessionId);
  }

  async saveTenantMemory(memory: TenantMemory): Promise<void> {
    this.tenants.set(memory.tenantId, memory);
  }

  async getTenantMemory(tenantId: string): Promise<TenantMemory | undefined> {
    return this.tenants.get(tenantId);
  }

  async saveUserPreferences(prefs: UserPreferences): Promise<void> {
    const key = `${prefs.tenantId}:${prefs.userId}`;
    this.userPrefs.set(key, prefs);
  }

  async getUserPreferences(userId: string, tenantId: string): Promise<UserPreferences | undefined> {
    return this.userPrefs.get(`${tenantId}:${userId}`);
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results: MemoryEntry[] = [];
    if (query.conversationId) {
      results = this.entries.get(query.conversationId) ?? [];
    } else {
      for (const entries of this.entries.values()) {
        results.push(...entries);
      }
    }
    if (query.after) results = results.filter(e => e.timestamp >= query.after!);
    if (query.before) results = results.filter(e => e.timestamp < query.before!);
    results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (query.limit) results = results.slice(-query.limit);
    return results;
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.conversations.clear();
    this.sessions.clear();
    this.tenants.clear();
    this.userPrefs.clear();
  }
}
