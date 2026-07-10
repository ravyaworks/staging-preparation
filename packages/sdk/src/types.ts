import type { PaginatedResult } from '@conversation-platform/types';

export interface Conversation {
  id: string;
  tenantId: string;
  channelId: string;
  status: 'active' | 'waiting' | 'resolved' | 'closed';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Channel {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  connected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeQuery {
  query: string;
  results: KnowledgeResult[];
}

export interface KnowledgeResult {
  documentId: string;
  libraryId: string;
  title: string;
  snippet: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface Document {
  id: string;
  libraryId: string;
  title: string;
  type: string;
  status: 'processing' | 'ready' | 'error';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AnalyticsQuery {
  metric: string;
  dimensions: string[];
  filters?: Record<string, unknown>;
  startDate: string;
  endDate: string;
  interval?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsResult {
  metric: string;
  data: Array<Record<string, unknown>>;
  summary: Record<string, unknown>;
}

export interface CreateConversationParams {
  channelId: string;
  participantId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageParams {
  content: string;
  role?: 'user' | 'assistant' | 'system';
  metadata?: Record<string, unknown>;
}

export interface CreateWebhookParams {
  url: string;
  events: string[];
  secret?: string;
  enabled?: boolean;
}

export interface ConnectChannelParams {
  type: string;
  name: string;
  config: Record<string, unknown>;
}

export interface ListConversationsParams {
  page?: number;
  limit?: number;
  status?: Conversation['status'];
  channelId?: string;
}

export interface ListMessagesParams {
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
}

export type SDKPaginatedResult<T> = PaginatedResult<T>;
