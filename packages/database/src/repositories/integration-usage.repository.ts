import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './base';

export class IntegrationUsageRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByIntegration(integrationId: string, days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.prisma.integrationUsage.findMany({
      where: {
        integrationId,
        periodStart: { gte: cutoff },
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async upsert(data: {
    integrationId: string;
    periodStart: Date;
    periodEnd: Date;
    messagesSent: number;
    messagesReceived: number;
    errors: number;
    totalLatencyMs: number;
  }) {
    return this.prisma.integrationUsage.upsert({
      where: {
        integrationId_periodStart: {
          integrationId: data.integrationId,
          periodStart: data.periodStart,
        },
      },
      create: {
        integrationId: data.integrationId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        messagesSent: data.messagesSent,
        messagesReceived: data.messagesReceived,
        errors: data.errors,
        totalLatencyMs: data.totalLatencyMs,
      },
      update: {
        periodEnd: data.periodEnd,
        messagesSent: { increment: data.messagesSent },
        messagesReceived: { increment: data.messagesReceived },
        errors: { increment: data.errors },
        totalLatencyMs: { increment: data.totalLatencyMs },
      },
    });
  }
}
