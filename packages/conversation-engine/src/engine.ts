import type { Logger } from '@conversation-platform/logger';
import type { AIEngine } from '@conversation-platform/ai-engine';
import type { PromptRegistry } from '@conversation-platform/prompt-engine';
import type { MemoryManager } from '@conversation-platform/memory-engine';
import type { ContextManager } from '@conversation-platform/context-engine';
import { ConversationStateManager } from './state';
import { createResponsePipeline } from './pipeline';
import type { Conversation, ConversationStatus, SendMessageParams, ProcessMessageResult, ConversationFilter, ConversationStats } from './types';
import { ConversationError } from './types';

export function createConversationEngine(params: {
  aiEngine: AIEngine;
  promptRegistry: PromptRegistry;
  memoryManager: MemoryManager;
  contextManager: ContextManager;
  logger: Logger;
}) {
  const { aiEngine, promptRegistry, memoryManager, contextManager, logger } = params;
  const stateManager = new ConversationStateManager();
  const pipeline = createResponsePipeline({ aiEngine, promptRegistry, memoryManager, contextManager, stateManager, logger });

  const conversations = new Map<string, Conversation>();

  async function createConversation(params: {
    tenantId: string;
    channel: string;
    userId?: string;
    title?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Conversation> {
    const now = new Date();
    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const conversation: Conversation = {
      id,
      tenantId: params.tenantId,
      userId: params.userId,
      channel: params.channel,
      status: 'active',
      title: params.title,
      metadata: params.metadata,
      createdAt: now,
      updatedAt: now,
    };
    conversations.set(id, conversation);
    stateManager.initialize(id);
    logger.info({ conversationId: id, tenantId: params.tenantId }, 'Conversation created');
    return conversation;
  }

  async function sendMessage(params: SendMessageParams): Promise<ProcessMessageResult> {
    const conversation = conversations.get(params.conversationId);
    if (!conversation) {
      throw new ConversationError('NOT_FOUND', `Conversation ${params.conversationId} not found`);
    }
    if (conversation.status === 'closed') {
      throw new ConversationError('CONVERSATION_CLOSED', 'Cannot send message to a closed conversation');
    }

    await memoryManager.addEntry(params.conversationId, {
      conversationId: params.conversationId,
      role: params.role ?? 'user',
      content: params.content,
      tokenCount: Math.ceil(params.content.length / 4),
    });

    return pipeline.processMessage(conversation, params);
  }

  async function getConversation(id: string): Promise<Conversation | undefined> {
    return conversations.get(id);
  }

  async function updateConversationStatus(id: string, status: ConversationStatus): Promise<Conversation> {
    const conversation = conversations.get(id);
    if (!conversation) {
      throw new ConversationError('NOT_FOUND', `Conversation ${id} not found`);
    }
    conversation.status = status;
    conversation.updatedAt = new Date();
    if (status === 'resolved') conversation.resolvedAt = new Date();
    if (status === 'closed') conversation.closedAt = new Date();
    stateManager.setStatus(id, status);
    return conversation;
  }

  async function listConversations(filter?: ConversationFilter): Promise<Conversation[]> {
    let result = Array.from(conversations.values());
    if (filter?.tenantId) result = result.filter(c => c.tenantId === filter.tenantId);
    if (filter?.userId) result = result.filter(c => c.userId === filter.userId);
    if (filter?.channel) result = result.filter(c => c.channel === filter.channel);
    if (filter?.status) result = result.filter(c => c.status === filter.status);
    if (filter?.fromDate) result = result.filter(c => c.createdAt >= filter.fromDate!);
    if (filter?.toDate) result = result.filter(c => c.createdAt <= filter.toDate!);
    if (filter?.offset) result = result.slice(filter.offset);
    if (filter?.limit) result = result.slice(0, filter.limit);
    return result;
  }

  async function getConversationStats(): Promise<ConversationStats> {
    const all = Array.from(conversations.values());
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      total: all.length,
      active: all.filter(c => c.status === 'active').length,
      resolved: all.filter(c => c.status === 'resolved').length,
      closed: all.filter(c => c.status === 'closed').length,
      messagesToday: 0,
      averageResponseTime: 0,
    };
  }

  return {
    createConversation,
    sendMessage,
    getConversation,
    updateConversationStatus,
    listConversations,
    getConversationStats,
    getStateManager: () => stateManager,
  };
}

export type ConversationEngine = ReturnType<typeof createConversationEngine>;
