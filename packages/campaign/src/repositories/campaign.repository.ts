import { PrismaClient, Prisma } from '@prisma/client'
import { BaseRepository } from '@conversation-platform/database'

export class CampaignRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findById(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id, deletedAt: null },
    })
  }

  async findByOrganization(
    organizationId: string,
    params: {
      page: number
      limit: number
      status?: string
      channel?: string
      search?: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
    },
  ) {
    const where: Prisma.CampaignWhereInput = {
      organizationId,
      deletedAt: null,
    }

    if (params.status) where.status = params.status
    if (params.channel) where.channel = params.channel
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    const skip = (params.page - 1) * params.limit

    const [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: { _count: { select: { businesses: true } } },
      }),
      this.prisma.campaign.count({ where }),
    ])

    return { items, total, page: params.page, limit: params.limit }
  }

  async create(data: Prisma.CampaignCreateInput) {
    return this.prisma.campaign.create({ data })
  }

  async update(id: string, data: Prisma.CampaignUpdateInput) {
    return this.prisma.campaign.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string) {
    return this.prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async countByOrganization(organizationId: string, status?: string) {
    return this.prisma.campaign.count({
      where: {
        organizationId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
    })
  }
}
