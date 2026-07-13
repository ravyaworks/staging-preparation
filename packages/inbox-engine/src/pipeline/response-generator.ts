import type { Logger } from '@conversation-platform/logger';
import type { QueueService } from '@conversation-platform/queue';
import type { PipelineContext } from '../types';

export function createResponseGenerator(queueService: QueueService | null, logger: Logger) {
  async function send(params: {
    tenantId: string;
    conversationId: string;
    contactId: string;
    content: string;
    channel: string;
    channelMessageId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ messageId: string } | null> {
    if (!queueService) {
      logger.warn({ conversationId: params.conversationId }, 'Queue service not configured, skipping outbound');
      return null;
    }

    try {
      const messageId = await queueService.dispatch('outbound-message', {
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        contactId: params.contactId,
        content: params.content,
        channel: params.channel,
        channelMessageId: params.channelMessageId,
        metadata: params.metadata ?? {},
      });

      return { messageId };
    } catch (error) {
      logger.error({ error, conversationId: params.conversationId }, 'Failed to dispatch outbound message');
      return null;
    }
  }

  return { send };
}

export type ResponseGenerator = ReturnType<typeof createResponseGenerator>;
