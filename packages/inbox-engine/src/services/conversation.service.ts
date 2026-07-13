import type { Logger } from '@conversation-platform/logger';
import { getPrismaClient, ConversationRepository, MessageRepository } from '@conversation-platform/database';
import type { ConversationFilter } from '../types';

export function createConversationService(logger: Logger) {
  function getConvRepo(): ConversationRepository {
    const prisma = getPrismaClient();
    return new ConversationRepository(prisma);
  }

  function getMsgRepo(): MessageRepository {
    const prisma = getPrismaClient();
    return new MessageRepository(prisma);
  }

  async function list(filter: ConversationFilter) {
    const repo = getConvRepo();
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      tenantId: filter.tenantId,
      deletedAt: null,
    };
    if (filter.status) where.status = filter.status;
    if (filter.channel) where.channel = filter.channel;
    if (filter.priority) where.priority = filter.priority;
    if (filter.assignedToId) where.assignedToId = filter.assignedToId;
    if (filter.contactId) where.contactId = filter.contactId;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { lastMessagePreview: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const prisma = getPrismaClient();
    const [items, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: limit,
        include: { contact: true, assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      prisma.conversation.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async function getById(id: string) {
    const prisma = getPrismaClient();
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });
  }

  async function getMessages(conversationId: string, page = 1, limit = 50) {
    return getMsgRepo().findByConversation(conversationId, page, limit);
  }

  async function updateStatus(id: string, status: string) {
    return getConvRepo().update(id, { status } as any);
  }

  async function updatePriority(id: string, priority: string) {
    return getConvRepo().update(id, { priority } as any);
  }

  async function close(id: string) {
    return getConvRepo().update(id, { status: 'closed' } as any);
  }

  async function reopen(id: string) {
    return getConvRepo().update(id, { status: 'active', deletedAt: null } as any);
  }

  return { list, getById, getMessages, updateStatus, updatePriority, close, reopen };
}

export type ConversationService = ReturnType<typeof createConversationService>;
