import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class AuditLogRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: Prisma.AuditLogCreateInput) {
    return this.prisma.auditLog.create({ data });
  }

  async findByTenant(tenantId: string, params?: { skip?: number; take?: number }) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
