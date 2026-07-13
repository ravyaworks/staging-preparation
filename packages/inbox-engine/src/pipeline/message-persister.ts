import type { Logger } from '@conversation-platform/logger';
import { getPrismaClient, MessageRepository, ConversationRepository } from '@conversation-platform/database';
import type { NormalizedMessage } from '../types';

export function createMessagePersister(logger: Logger) {
  function getMessageRepo(): MessageRepository {
    const prisma = getPrismaClient();
    return new MessageRepository(prisma);
  }

  function getConversationRepo(): ConversationRepository {
    const prisma = getPrismaClient();
    return new ConversationRepository(prisma);
  }

  async function persist(params: {
    tenantId: string;
    conversationId: string;
    contactId: string;
    message: NormalizedMessage;
    direction: string;
    status?: string;
    provider?: string;
    model?: string;
    tokenCount?: number;
    latency?: number;
    aiMetadata?: Record<string, unknown>;
  }): Promise<{ messageId: string }> {
    const messageRepo = getMessageRepo();
    const conversationRepo = getConversationRepo();

    const created = await messageRepo.create({
      conversation: { connect: { id: params.conversationId } },
      contactId: params.contactId,
      role: params.direction === 'inbound' ? 'user' : 'assistant',
      direction: params.direction,
      messageType: params.message.messageType,
      content: params.message.content,
      status: params.status ?? (params.direction === 'inbound' ? 'delivered' : 'sent'),
      provider: params.provider,
      model: params.model,
      tokenCount: params.tokenCount,
      latency: params.latency,
      attachments: JSON.stringify(params.message.attachments),
      metadata: JSON.stringify({
        ...params.message.metadata,
        channelMessageId: params.message.channelMessageId,
        channel: params.message.channel,
        ...(params.aiMetadata ?? {}),
      }),
    } as any);

    const preview = params.message.content.slice(0, 200);
    await conversationRepo.update(params.conversationId, {
      lastMessageAt: new Date(),
      lastMessagePreview: preview,
      messageCount: { increment: 1 },
    } as any);

    return { messageId: created.id };
  }

  return { persist };
}

export type MessagePersister = ReturnType<typeof createMessagePersister>;
