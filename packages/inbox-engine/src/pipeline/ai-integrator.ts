import type { Logger } from '@conversation-platform/logger';
import type { AIEngine, AIEngineResponse } from '@conversation-platform/ai-engine';
import type { KnowledgeEngine, KnowledgeSearchQuery } from '@conversation-platform/knowledge-engine';
import type { ConversationEngine } from '@conversation-platform/conversation-engine';
import type { PipelineContext } from '../types';

export function createAIIntegrator(
  aiEngine: AIEngine | null,
  knowledgeEngine: KnowledgeEngine | null,
  conversationEngine: ConversationEngine | null,
  logger: Logger,
) {
  async function generate(context: PipelineContext): Promise<{
    content: string;
    provider: string;
    model: string;
    tokenCount: number;
    latency: number;
  } | null> {
    if (!aiEngine) {
      logger.info({ conversationId: context.conversation.conversationId }, 'AI engine not configured, skipping AI response');
      return null;
    }

    if (!context.conversation.conversation.isAiEnabled || context.conversation.conversation.isHumanHandoff) {
      return null;
    }

    const start = Date.now();

    try {
      let knowledgeContext = '';
      if (knowledgeEngine) {
        try {
          const searchQuery: KnowledgeSearchQuery = {
            query: context.normalizedMessage.content,
            limit: 3,
          };
          const results = knowledgeEngine.search(searchQuery);
          if (results && Array.isArray(results) && results.length > 0) {
            knowledgeContext = results
              .map((r) => r.document?.content ?? '')
              .filter(Boolean)
              .join('\n');
          }
        } catch (ke) {
          logger.warn({ error: ke }, 'Knowledge search failed, continuing without context');
        }
      }

      let response: AIEngineResponse;

      if (conversationEngine) {
        try {
          const convResult = await conversationEngine.sendMessage({
            conversationId: context.conversation.conversationId,
            content: context.normalizedMessage.content,
            role: 'user',
            metadata: {
              tenantId: context.tenantId,
              contactId: context.identity.contactId,
              channel: context.normalizedMessage.channel,
              ...(knowledgeContext ? { knowledgeContext } : {}),
            },
          });
          response = {
            content: convResult.reply.content,
            model: convResult.model,
            provider: convResult.provider,
            usage: {
              promptTokens: 0,
              completionTokens: convResult.tokenCount,
              totalTokens: convResult.tokenCount,
              estimatedCost: convResult.cost,
              currency: 'USD',
            },
            latency: convResult.latency,
            finishReason: 'stop',
          };
        } catch (ce) {
          logger.warn({ error: ce }, 'Conversation engine failed, falling back to direct AI call');
          response = await aiEngine.chat({
            messages: [
              { role: 'system', content: 'You are a helpful AI assistant.' },
              { role: 'user', content: context.normalizedMessage.content },
            ],
            metadata: {
              conversationId: context.conversation.conversationId,
              tenantId: context.tenantId,
            },
          });
        }
      } else {
        response = await aiEngine.chat({
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: context.normalizedMessage.content },
          ],
          metadata: {
            conversationId: context.conversation.conversationId,
            tenantId: context.tenantId,
          },
        });
      }

      const latency = Date.now() - start;

      return {
        content: response.content,
        provider: response.provider,
        model: response.model,
        tokenCount: response.usage?.totalTokens ?? 0,
        latency,
      };
    } catch (error) {
      logger.error({ error, conversationId: context.conversation.conversationId }, 'AI response generation failed');
      return null;
    }
  }

  return { generate };
}

export type AIIntegrator = ReturnType<typeof createAIIntegrator>;
