import { PrismaClient, Prisma } from '@prisma/client'
import { BaseRepository } from '@conversation-platform/database'

export class CampaignLogRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findByCampaign(campaignId: string, limit = 50) {
    return this.prisma.campaignLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async create(data: Prisma.CampaignLogCreateInput) {
    return this.prisma.campaignLog.create({ data })
  }
}
