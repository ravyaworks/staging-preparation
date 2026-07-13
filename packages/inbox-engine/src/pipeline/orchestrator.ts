import type { Logger } from '@conversation-platform/logger';
import type { AIEngine } from '@conversation-platform/ai-engine';
import type { WorkflowEngine } from '@conversation-platform/workflow-engine';
import type { KnowledgeEngine } from '@conversation-platform/knowledge-engine';
import type { ConversationEngine } from '@conversation-platform/conversation-engine';
import type { QueueService } from '@conversation-platform/queue';
import type { IncomingChannelAdapter, NormalizedMessage, PipelineResult, PipelineContext } from '../types';
import { createIdentityResolver } from './identity-resolver';
import { createConversationResolver } from './conversation-resolver';
import { createMessagePersister } from './message-persister';
import { createWorkflowIntegrator } from './workflow-integrator';
import { createAIIntegrator } from './ai-integrator';
import { createResponseGenerator } from './response-generator';

export function createIncomingPipeline(params: {
  aiEngine: AIEngine | null;
  workflowEngine: WorkflowEngine | null;
  knowledgeEngine: KnowledgeEngine | null;
  conversationEngine: ConversationEngine | null;
  queueService: QueueService | null;
  logger: Logger;
}) {
  const { logger } = params;
  const identityResolver = createIdentityResolver(logger);
  const conversationResolver = createConversationResolver(logger);
  const messagePersister = createMessagePersister(logger);
  const workflowIntegrator = createWorkflowIntegrator(params.workflowEngine, logger);
  const aiIntegrator = createAIIntegrator(params.aiEngine, params.knowledgeEngine, params.conversationEngine, logger);
  const responseGenerator = createResponseGenerator(params.queueService, logger);

  async function process(params: {
    tenantId: string;
    adapter: IncomingChannelAdapter;
    payload: Record<string, unknown>;
  }): Promise<PipelineResult> {
    const start = Date.now();
    const { tenantId, adapter, payload } = params;

    try {
      if (!adapter.validate(payload)) {
        return {
          success: false,
          context: null as unknown as PipelineContext,
          error: 'Invalid payload',
          totalLatency: Date.now() - start,
        };
      }

      const normalizedMessage: NormalizedMessage = adapter.normalize(payload);

      const identity = await identityResolver.resolve(tenantId, normalizedMessage);

      const conversation = await conversationResolver.resolve(tenantId, normalizedMessage, identity);

      const persisted = await messagePersister.persist({
        tenantId,
        conversationId: conversation.conversationId,
        contactId: identity.contactId,
        message: normalizedMessage,
        direction: 'inbound',
        status: 'delivered',
      });

      const context: PipelineContext = {
        tenantId,
        normalizedMessage,
        identity,
        conversation,
        metadata: {
          persistedMessageId: persisted.messageId,
          channel: normalizedMessage.channel,
        },
        startedAt: new Date(),
      };

      const workflowResults = await workflowIntegrator.execute(context);

      const aiResponse = await aiIntegrator.generate(context);

      let outboundMessageId: string | undefined;
      if (aiResponse) {
        const outboundPersisted = await messagePersister.persist({
          tenantId,
          conversationId: conversation.conversationId,
          contactId: identity.contactId,
          message: {
            ...normalizedMessage,
            id: `ai-${Date.now()}`,
            content: aiResponse.content,
            direction: 'outbound',
          } as NormalizedMessage,
          direction: 'outbound',
          status: 'sent',
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokenCount: aiResponse.tokenCount,
          latency: aiResponse.latency,
          aiMetadata: { generatedBy: 'ai-engine' },
        });

        const queued = await responseGenerator.send({
          tenantId,
          conversationId: conversation.conversationId,
          contactId: identity.contactId,
          content: aiResponse.content,
          channel: normalizedMessage.channel,
          channelMessageId: normalizedMessage.channelMessageId,
          metadata: {
            aiResponse: true,
            provider: aiResponse.provider,
            model: aiResponse.model,
            persistedMessageId: outboundPersisted.messageId,
          },
        });

        outboundMessageId = queued?.messageId;
      }

      return {
        success: true,
        context,
        aiResponse: aiResponse ?? undefined,
        workflowResults: workflowResults.results,
        outboundMessageId,
        totalLatency: Date.now() - start,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error, tenantId }, 'Incoming message pipeline failed');
      return {
        success: false,
        context: null as unknown as PipelineContext,
        error: message,
        totalLatency: Date.now() - start,
      };
    }
  }

  return { process };
}

export type IncomingPipeline = ReturnType<typeof createIncomingPipeline>;
