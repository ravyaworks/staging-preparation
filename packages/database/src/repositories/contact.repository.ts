import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class ContactRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByTenant(tenantId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.ContactWhereInput = { tenantId, deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { lastActivityAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.contact.findUnique({ where: { id } });
  }

  async findByPhone(tenantId: string, phone: string) {
    return this.prisma.contact.findFirst({
      where: { tenantId, phone, deletedAt: null },
    });
  }

  async findByEmail(tenantId: string, email: string) {
    return this.prisma.contact.findFirst({
      where: { tenantId, email, deletedAt: null },
    });
  }

  async create(data: Prisma.ContactCreateInput) {
    return this.prisma.contact.create({ data });
  }

  async update(id: string, data: Prisma.ContactUpdateInput) {
    return this.prisma.contact.update({ where: { id }, data });
  }

  async upsertByPhone(tenantId: string, phone: string, data: Prisma.ContactCreateInput) {
    const existing = await this.findByPhone(tenantId, phone);
    if (existing) {
      return this.update(existing.id, {
        ...data,
        conversationCount: existing.conversationCount,
      } as Prisma.ContactUpdateInput);
    }
    return this.create(data);
  }

  async softDelete(id: string) {
    return this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
