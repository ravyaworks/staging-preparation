import type { Logger } from '@conversation-platform/logger';
import { getPrismaClient, ConversationRepository } from '@conversation-platform/database';
import type { HumanHandoffRequest, ConversationNote } from '../types';

export function createHumanHandoffService(logger: Logger) {
  function getRepo(): ConversationRepository {
    const prisma = getPrismaClient();
    return new ConversationRepository(prisma);
  }

  async function assign(request: HumanHandoffRequest): Promise<boolean> {
    const repo = getRepo();
    const conversation = await repo.findById(request.conversationId);
    if (!conversation) {
      logger.warn({ conversationId: request.conversationId }, 'Conversation not found for assignment');
      return false;
    }

    await repo.update(request.conversationId, {
      assignedToId: request.assignedToId,
      isAiEnabled: false,
      isHumanHandoff: true,
    } as any);

    logger.info(
      { conversationId: request.conversationId, assignedTo: request.assignedToId },
      'Conversation assigned to agent',
    );
    return true;
  }

  async function release(conversationId: string): Promise<boolean> {
    const repo = getRepo();
    const conversation = await repo.findById(conversationId);
    if (!conversation) return false;

    await repo.update(conversationId, {
      assignedToId: null,
      isAiEnabled: true,
      isHumanHandoff: false,
    } as any);

    logger.info({ conversationId }, 'Conversation released from human handoff');
    return true;
  }

  async function addNote(params: {
    conversationId: string;
    authorId: string;
    authorName: string;
    content: string;
  }): Promise<ConversationNote> {
    const note: ConversationNote = {
      id: `note-${Date.now()}`,
      conversationId: params.conversationId,
      authorId: params.authorId,
      authorName: params.authorName,
      content: params.content,
      createdAt: new Date(),
    };

    const repo = getRepo();
    const conversation = await repo.findById(params.conversationId);
    if (conversation) {
      const existingNotes = (conversation.metadata as Record<string, unknown>)?.notes as ConversationNote[] ?? [];
      existingNotes.push(note);
      await repo.update(params.conversationId, {
        metadata: { ...(conversation.metadata as Record<string, unknown> ?? {}), notes: existingNotes },
      } as any);
    }

    return note;
  }

  async function getNotes(conversationId: string): Promise<ConversationNote[]> {
    const repo = getRepo();
    const conversation = await repo.findById(conversationId);
    if (!conversation) return [];
    return ((conversation.metadata as Record<string, unknown>)?.notes as ConversationNote[]) ?? [];
  }

  return { assign, release, addNote, getNotes };
}

export type HumanHandoffService = ReturnType<typeof createHumanHandoffService>;
