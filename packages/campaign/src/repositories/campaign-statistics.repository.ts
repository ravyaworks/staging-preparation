import { PrismaClient } from '@prisma/client'
import { BaseRepository } from '@conversation-platform/database'

export class CampaignStatisticsRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findByCampaign(campaignId: string) {
    return this.prisma.campaignStatistics.findUnique({
      where: { campaignId },
    })
  }

  async upsert(campaignId: string, data: {
    totalBusinesses?: number
    jobsCreated?: number
    pending?: number
    queued?: number
    sending?: number
    sent?: number
    delivered?: number
    read?: number
    failed?: number
    replied?: number
  }) {
    return this.prisma.campaignStatistics.upsert({
      where: { campaignId },
      create: {
        campaignId,
        totalBusinesses: data.totalBusinesses ?? 0,
        jobsCreated: data.jobsCreated ?? 0,
        pending: data.pending ?? 0,
        queued: data.queued ?? 0,
        sending: data.sending ?? 0,
        sent: data.sent ?? 0,
        delivered: data.delivered ?? 0,
        read: data.read ?? 0,
        failed: data.failed ?? 0,
        replied: data.replied ?? 0,
      },
      update: {
        ...(data.totalBusinesses !== undefined ? { totalBusinesses: data.totalBusinesses } : {}),
        ...(data.jobsCreated !== undefined ? { jobsCreated: { increment: data.jobsCreated } } : {}),
        ...(data.pending !== undefined ? { pending: { increment: data.pending } } : {}),
        ...(data.queued !== undefined ? { queued: { increment: data.queued } } : {}),
        ...(data.sending !== undefined ? { sending: { increment: data.sending } } : {}),
        ...(data.sent !== undefined ? { sent: { increment: data.sent } } : {}),
        ...(data.delivered !== undefined ? { delivered: { increment: data.delivered } } : {}),
        ...(data.read !== undefined ? { read: { increment: data.read } } : {}),
        ...(data.failed !== undefined ? { failed: { increment: data.failed } } : {}),
        ...(data.replied !== undefined ? { replied: { increment: data.replied } } : {}),
      },
    })
  }
}
