import { PrismaClient, Prisma } from '@prisma/client'
import { BaseRepository } from '@conversation-platform/database'

export class CampaignBusinessRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findByCampaign(
    campaignId: string,
    params: {
      page: number
      limit: number
      search?: string
      status?: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
    },
  ) {
    const where: Prisma.CampaignBusinessWhereInput = { campaignId }

    if (params.status) where.status = params.status
    if (params.search) {
      where.OR = [
        { businessName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
      ]
    }

    const skip = (params.page - 1) * params.limit

    const [items, total] = await Promise.all([
      this.prisma.campaignBusiness.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
      }),
      this.prisma.campaignBusiness.count({ where }),
    ])

    return { items, total, page: params.page, limit: params.limit }
  }

  async findById(id: string) {
    return this.prisma.campaignBusiness.findUnique({ where: { id } })
  }

  async findByCampaignAndPhone(campaignId: string, phone: string) {
    return this.prisma.campaignBusiness.findUnique({
      where: { campaignId_phone: { campaignId, phone } },
    })
  }

  async create(data: Prisma.CampaignBusinessCreateInput) {
    return this.prisma.campaignBusiness.create({ data })
  }

  async createMany(data: Prisma.CampaignBusinessCreateManyInput[]) {
    return this.prisma.campaignBusiness.createMany({ data })
  }

  async update(id: string, data: Prisma.CampaignBusinessUpdateInput) {
    return this.prisma.campaignBusiness.update({ where: { id }, data })
  }

  async countByCampaign(campaignId: string, status?: string) {
    return this.prisma.campaignBusiness.count({
      where: { campaignId, ...(status ? { status } : {}) },
    })
  }

  async updateStatusByCampaign(
    campaignId: string,
    fromStatus: string,
    toStatus: string,
  ) {
    return this.prisma.campaignBusiness.updateMany({
      where: { campaignId, status: fromStatus },
      data: { status: toStatus },
    })
  }
}
