export interface MemoryEntry {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationMemory {
  conversationId: string;
  entries: MemoryEntry[];
  summary?: string;
  summaryTokens?: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface SessionMemory {
  sessionId: string;
  conversationId: string;
  preferences?: Record<string, unknown>;
  state?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantMemory {
  tenantId: string;
  globalContext?: string;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UserPreferences {
  userId: string;
  tenantId: string;
  language?: string;
  timezone?: string;
  tone?: string;
  customInstructions?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  limit?: number;
  before?: Date;
  after?: Date;
}

export interface MemoryStats {
  totalEntries: number;
  totalConversations: number;
  oldestEntry?: Date;
  newestEntry?: Date;
  totalTokens: number;
}

export class MemoryError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'MemoryError';
    this.code = code;
  }
}
