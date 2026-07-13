import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class OutreachJobRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string) {
    return this.prisma.outreachJob.findUnique({ where: { id } });
  }

  async findByTenant(tenantId: string, params?: { skip?: number; take?: number }) {
    return this.prisma.outreachJob.findMany({
      where: { tenantId },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.OutreachJobCreateInput) {
    return this.prisma.outreachJob.create({ data });
  }

  async update(id: string, data: Prisma.OutreachJobUpdateInput) {
    return this.prisma.outreachJob.update({
      where: { id },
      data,
    });
  }

  async countByTenant(tenantId: string) {
    return this.prisma.outreachJob.count({ where: { tenantId } });
  }
}
