import type { AIEngine, AIEngineRequest, AIEngineResponse } from '@conversation-platform/ai-engine';
import type { PromptRegistry, CompiledPrompt } from '@conversation-platform/prompt-engine';
import type { MemoryManager } from '@conversation-platform/memory-engine';
import type { ContextManager, CompositeContext, MessageContext } from '@conversation-platform/context-engine';
import type { Logger } from '@conversation-platform/logger';
import type { MessageRole, SendMessageParams, ProcessMessageResult, Conversation, Message } from './types';
import { ConversationError } from './types';
import { ConversationStateManager } from './state';

export function createResponsePipeline(params: {
  aiEngine: AIEngine;
  promptRegistry: PromptRegistry;
  memoryManager: MemoryManager;
  contextManager: ContextManager;
  stateManager: ConversationStateManager;
  logger: Logger;
}) {
  const { aiEngine, promptRegistry, memoryManager, contextManager, stateManager, logger } = params;

  async function processMessage(
    conversation: Conversation,
    params: SendMessageParams,
  ): Promise<ProcessMessageResult> {
    const start = Date.now();

    stateManager.setProcessing(conversation.id, true);

    try {
      const systemPromptId = 'conversation-system-default';
      let systemPrompt: CompiledPrompt | undefined;

      try {
        systemPrompt = promptRegistry.compile(systemPromptId, { variables: {} });
      } catch {
        const context = contextManager.getConversation(conversation.id);
        const messages: MessageContext[] = [];
        const composite = contextManager.buildComposite(conversation.id, messages);
        const contextSummary = composite ? `Tenant: ${composite.tenant.name}\nConversation: ${conversation.title ?? conversation.id}` : '';
        systemPrompt = {
          role: 'system',
          content: `You are a helpful AI assistant for a multi-tenant conversation platform.\n${contextSummary}\nBe concise, accurate, and professional.`,
          templateId: 'conversation-system-default',
          version: 1,
          usedVariables: [],
        };
      }

      const memory = await memoryManager.getOrCreateConversationMemory(conversation.id);
      const recentMessages = memory.entries.slice(-20);

      const request: AIEngineRequest = {
        messages: [
          { role: 'system', content: systemPrompt.content },
          ...recentMessages.map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
          { role: 'user', content: params.content },
        ],
        metadata: { conversationId: conversation.id, tenantId: conversation.tenantId },
      };

      const response = await aiEngine.chat(request);
      const latency = Date.now() - start;

      await memoryManager.addEntry(conversation.id, {
        conversationId: conversation.id,
        role: 'user',
        content: params.content,
        tokenCount: Math.ceil(params.content.length / 4),
      });

      await memoryManager.addEntry(conversation.id, {
        conversationId: conversation.id,
        role: 'assistant',
        content: response.content,
        tokenCount: response.usage.totalTokens - Math.ceil(params.content.length / 4),
      });

      stateManager.setProcessing(conversation.id, false);

      const message: Message = {
        id: `${conversation.id}-msg-${Date.now()}`,
        conversationId: conversation.id,
        role: 'assistant',
        content: response.content,
        provider: response.provider,
        model: response.model,
        tokenCount: response.usage.totalTokens,
        latency,
        createdAt: new Date(),
      };

      return {
        reply: message,
        conversation: { ...conversation, updatedAt: new Date() },
        latency,
        provider: response.provider,
        model: response.model,
        tokenCount: response.usage.totalTokens,
        cost: response.usage.estimatedCost,
      };
    } catch (error) {
      stateManager.setProcessing(conversation.id, false);
      logger.error({ conversationId: conversation.id, error }, 'Failed to process message');
      throw error;
    }
  }

  return { processMessage };
}

export type ResponsePipeline = ReturnType<typeof createResponsePipeline>;
