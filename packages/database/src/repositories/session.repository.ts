import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class SessionRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string) {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findByToken(token: string) {
    return this.prisma.session.findUnique({ where: { token } });
  }

  async findByRefreshToken(refreshToken: string) {
    return this.prisma.session.findUnique({ where: { refreshToken } });
  }

  async findActiveByUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async create(data: Prisma.SessionCreateInput) {
    return this.prisma.session.create({ data });
  }

  async deactivate(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deactivateAllForUser(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  async updateActivity(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { lastActivity: new Date() },
    });
  }

  async cleanupExpired() {
    return this.prisma.session.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }
}
