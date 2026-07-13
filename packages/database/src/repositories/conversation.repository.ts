import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class ConversationRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByTenant(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  async findActiveByContact(tenantId: string, contactId: string, channel: string) {
    return this.prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId,
        channel,
        status: { in: ['active', 'waiting'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ConversationCreateInput) {
    return this.prisma.conversation.create({ data });
  }

  async update(id: string, data: Prisma.ConversationUpdateInput) {
    return this.prisma.conversation.update({
      where: { id },
      data,
    });
  }
}
