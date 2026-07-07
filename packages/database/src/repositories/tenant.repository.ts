import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class TenantRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id, deletedAt: null } });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug, deletedAt: null } });
  }

  async findMany(params?: { skip?: number; take?: number }) {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.TenantCreateInput) {
    return this.prisma.tenant.create({ data });
  }

  async update(id: string, data: Prisma.TenantUpdateInput) {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
