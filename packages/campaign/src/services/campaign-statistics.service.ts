import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { CampaignError } from '../types'

export class CampaignStatisticsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async getStatistics(campaignId: string) {
    const stats = await this.prisma.campaignStatistics.findUnique({
      where: { campaignId },
    })

    if (!stats) {
      throw new CampaignError('Statistics not found for campaign', 'NOT_FOUND', 404)
    }

    const totalProcessed =
      stats.sent + stats.delivered + stats.read + stats.failed + stats.replied

    const progress =
      stats.totalBusinesses > 0
        ? Math.round((totalProcessed / stats.totalBusinesses) * 100)
        : 0

    return {
      ...stats,
      progress,
      totalProcessed,
      successRate:
        totalProcessed > 0
          ? Math.round(((stats.delivered + stats.read + stats.replied) / totalProcessed) * 100)
          : 0,
    }
  }

  async recalculate(campaignId: string) {
    const [total, pending, sent, delivered, read, failed, replied] =
      await Promise.all([
        this.prisma.campaignBusiness.count({ where: { campaignId } }),
        this.prisma.campaignBusiness.count({ where: { campaignId, status: 'pending' } }),
        this.prisma.campaignBusiness.count({ where: { campaignId, status: 'sent' } }),
        this.prisma.campaignBusiness.count({ where: { campaignId, status: 'delivered' } }),
        this.prisma.campaignBusiness.count({ where: { campaignId, status: 'read' } }),
        this.prisma.campaignBusiness.count({ where: { campaignId, status: 'failed' } }),
        this.prisma.campaignBusiness.count({ where: { campaignId, status: 'replied' } }),
      ])

    return this.prisma.campaignStatistics.upsert({
      where: { campaignId },
      create: {
        campaignId,
        totalBusinesses: total,
        pending,
        queued: 0,
        sending: 0,
        sent,
        delivered,
        read,
        failed,
        replied,
      },
      update: {
        totalBusinesses: total,
        pending,
        queued: 0,
        sending: 0,
        sent,
        delivered,
        read,
        failed,
        replied,
      },
    })
  }

  async incrementStat(campaignId: string, field: string): Promise<void> {
    const validFields = [
      'totalBusinesses', 'jobsCreated', 'pending', 'queued',
      'sending', 'sent', 'delivered', 'read', 'failed', 'replied',
    ]

    if (!validFields.includes(field)) {
      throw new CampaignError(`Invalid statistics field: ${field}`, 'INVALID_FIELD', 400)
    }

    await this.prisma.campaignStatistics.upsert({
      where: { campaignId },
      create: {
        campaignId,
        [field]: 1,
      },
      update: {
        [field]: { increment: 1 },
      },
    })
  }
}
