import type { Logger } from '@conversation-platform/logger';
import { getPrismaClient, ConversationRepository } from '@conversation-platform/database';
import type { NormalizedMessage, IdentityResult, ConversationResult } from '../types';

export function createConversationResolver(logger: Logger) {
  function getRepo(): ConversationRepository {
    const prisma = getPrismaClient();
    return new ConversationRepository(prisma);
  }

  async function resolve(
    tenantId: string,
    message: NormalizedMessage,
    identity: IdentityResult,
  ): Promise<ConversationResult> {
    const repo = getRepo();
    const contactId = identity.contactId;

    const activeConversation = await repo.findActiveByContact(tenantId, contactId, message.channel);
    if (activeConversation) {
      return {
        conversationId: activeConversation.id,
        isNew: false,
        conversation: {
          id: activeConversation.id,
          status: activeConversation.status,
          priority: activeConversation.priority,
          channel: activeConversation.channel ?? message.channel,
          contactId: activeConversation.contactId,
          assignedToId: activeConversation.assignedToId,
          isAiEnabled: activeConversation.isAiEnabled,
          isHumanHandoff: activeConversation.isHumanHandoff,
        },
      };
    }

    const newConversation = await repo.create({
      tenant: { connect: { id: tenantId } },
      contact: { connect: { id: contactId } },
      channel: message.channel,
      status: 'active',
      priority: 'normal',
      isAiEnabled: true,
      isHumanHandoff: false,
      labels: [],
      title: identity.contact.name ?? `Conversation with ${message.sender.phone ?? message.sender.id}`,
      lastMessageAt: new Date(),
      lastMessagePreview: message.content.slice(0, 200),
      messageCount: 0,
    } as any);

    return {
      conversationId: newConversation.id,
      isNew: true,
      conversation: {
        id: newConversation.id,
        status: newConversation.status,
        priority: newConversation.priority,
        channel: newConversation.channel ?? message.channel,
        contactId: newConversation.contactId,
        assignedToId: newConversation.assignedToId,
        isAiEnabled: newConversation.isAiEnabled,
        isHumanHandoff: newConversation.isHumanHandoff,
      },
    };
  }

  return { resolve };
}

export type ConversationResolver = ReturnType<typeof createConversationResolver>;
