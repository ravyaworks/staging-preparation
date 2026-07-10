import type { ProviderName } from '@conversation-platform/provider-framework';

export type ConversationStatus = 'active' | 'paused' | 'resolved' | 'closed' | 'pending';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Conversation {
  id: string;
  tenantId: string;
  userId?: string;
  channel: string;
  status: ConversationStatus;
  title?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  provider?: ProviderName;
  model?: string;
  tokenCount?: number;
  latency?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ConversationState {
  conversationId: string;
  status: ConversationStatus;
  currentStep?: string;
  waitingForInput: boolean;
  processingMessage: boolean;
  metadata?: Record<string, unknown>;
  updatedAt: Date;
}

export interface SendMessageParams {
  conversationId: string;
  content: string;
  role?: MessageRole;
  metadata?: Record<string, unknown>;
}

export interface ProcessMessageResult {
  reply: Message;
  conversation: Conversation;
  latency: number;
  provider: ProviderName;
  model: string;
  tokenCount: number;
  cost: number;
}

export interface ConversationFilter {
  tenantId?: string;
  userId?: string;
  channel?: string;
  status?: ConversationStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ConversationStats {
  total: number;
  active: number;
  resolved: number;
  closed: number;
  messagesToday: number;
  averageResponseTime: number;
}

export class ConversationError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ConversationError';
    this.code = code;
  }
}
