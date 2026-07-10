import type { MemoryEntry, ConversationMemory, SessionMemory, TenantMemory, UserPreferences, MemoryQuery } from './types';

export interface MemoryStore {
  saveEntry(entry: MemoryEntry): Promise<void>;
  getEntries(conversationId: string, limit?: number, before?: Date): Promise<MemoryEntry[]>;
  getConversationMemory(conversationId: string): Promise<ConversationMemory | undefined>;
  saveConversationMemory(memory: ConversationMemory): Promise<void>;
  deleteConversationMemory(conversationId: string): Promise<void>;
  saveSessionMemory(memory: SessionMemory): Promise<void>;
  getSessionMemory(sessionId: string): Promise<SessionMemory | undefined>;
  saveTenantMemory(memory: TenantMemory): Promise<void>;
  getTenantMemory(tenantId: string): Promise<TenantMemory | undefined>;
  saveUserPreferences(prefs: UserPreferences): Promise<void>;
  getUserPreferences(userId: string, tenantId: string): Promise<UserPreferences | undefined>;
  query(query: MemoryQuery): Promise<MemoryEntry[]>;
  clear(): Promise<void>;
}
