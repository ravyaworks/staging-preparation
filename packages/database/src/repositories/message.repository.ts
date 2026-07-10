import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class MessageRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByConversation(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);
    return { items, total, page, limit };
  }

  async create(data: Prisma.MessageCreateInput) {
    return this.prisma.message.create({ data });
  }
}
