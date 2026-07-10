import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class WebhookRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByTenant(tenantId: string) {
    return this.prisma.webhook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.webhook.findUnique({ where: { id } });
  }

  async create(data: Prisma.WebhookCreateInput) {
    return this.prisma.webhook.create({ data });
  }

  async update(id: string, data: Prisma.WebhookUpdateInput) {
    return this.prisma.webhook.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.webhook.delete({ where: { id } });
  }
}
