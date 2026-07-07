import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class ApiKeyRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByKeyPrefix(prefix: string) {
    return this.prisma.apiKey.findFirst({ where: { keyPrefix: prefix } });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ApiKeyCreateInput) {
    return this.prisma.apiKey.create({ data });
  }

  async deactivate(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
