import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class ChannelConnectionRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByTenant(tenantId: string) {
    return this.prisma.channelConnection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTenantAndType(tenantId: string, channelType: string) {
    return this.prisma.channelConnection.findUnique({
      where: { tenantId_channelType: { tenantId, channelType } },
    });
  }

  async create(data: Prisma.ChannelConnectionCreateInput) {
    return this.prisma.channelConnection.create({ data });
  }

  async update(id: string, data: Prisma.ChannelConnectionUpdateInput) {
    return this.prisma.channelConnection.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.channelConnection.delete({ where: { id } });
  }
}
