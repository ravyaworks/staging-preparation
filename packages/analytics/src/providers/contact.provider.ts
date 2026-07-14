import type { PrismaClient } from '@prisma/client'
import type { ContactAnalytics } from '../types'

export class ContactAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(tenantId?: string): Promise<ContactAnalytics> {
    const baseWhere: Record<string, unknown> = {}
    if (tenantId) baseWhere.tenantId = tenantId

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalContacts,
      newContacts,
      returningContacts,
      sourceGroups,
      campaignSourceGroups,
      industryGroups,
    ] = await Promise.all([
      this.prisma.contact.count({ where: baseWhere }),
      this.prisma.contact.count({
        where: {
          ...baseWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.contact.count({
        where: {
          ...baseWhere,
          conversationCount: { gt: 1 },
        },
      }),
      this.prisma.contact.findMany({
        where: baseWhere,
        select: { metadata: true },
        take: 5000,
      }),
      this.prisma.contact.groupBy({
        by: ['campaignSource'],
        where: {
          ...baseWhere,
          campaignSource: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      this.prisma.contact.findMany({
        where: baseWhere,
        select: { customFields: true },
        take: 5000,
      }),
    ])

    const sourceCountMap = new Map<string, number>()
    for (const c of sourceGroups) {
      const meta = c.metadata as Record<string, unknown> | null
      const source = (meta?.source as string) ?? 'unknown'
      sourceCountMap.set(source, (sourceCountMap.get(source) ?? 0) + 1)
    }
    const contactSources = Array.from(sourceCountMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)

    const campaignSources = campaignSourceGroups.map((g) => ({
      campaignId: g.campaignSource!,
      campaignName: g.campaignSource!,
      count: g._count.id,
    }))

    const industryCountMap = new Map<string, number>()
    for (const c of industryGroups) {
      const fields = c.customFields as Record<string, unknown> | null
      const industry = (fields?.industry as string) ?? 'unknown'
      industryCountMap.set(industry, (industryCountMap.get(industry) ?? 0) + 1)
    }
    const industryDistribution = Array.from(industryCountMap.entries())
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalContacts,
      newContacts,
      returningContacts,
      contactSources,
      campaignSources,
      industryDistribution,
    }
  }
}
