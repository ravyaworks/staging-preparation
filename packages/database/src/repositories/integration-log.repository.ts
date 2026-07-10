import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class IntegrationLogRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByIntegration(integrationId: string, limit = 50) {
    return this.prisma.integrationLog.findMany({
      where: { integrationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async create(data: Prisma.IntegrationLogCreateInput) {
    return this.prisma.integrationLog.create({ data });
  }
}
