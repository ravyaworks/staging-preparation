import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class IntegrationRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByTenant(tenantId: string) {
    return this.prisma.integration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.integration.findUnique({ where: { id } });
  }

  async create(data: Prisma.IntegrationCreateInput) {
    return this.prisma.integration.create({ data });
  }

  async update(id: string, data: Prisma.IntegrationUpdateInput) {
    return this.prisma.integration.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.integration.delete({ where: { id } });
  }

  async findByTenantAndChannel(tenantId: string, channelType: string) {
    return this.prisma.integration.findMany({
      where: { tenantId, channelType },
      orderBy: { createdAt: 'desc' },
    });
  }
}
