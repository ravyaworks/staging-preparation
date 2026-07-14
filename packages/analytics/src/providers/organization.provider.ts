import type { PrismaClient } from '@prisma/client'
import type { OrganizationAnalytics } from '../types'

export class OrganizationAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(organizationId?: string): Promise<OrganizationAnalytics> {
    const [organizationSummary, monthlyActivity] = await Promise.all([
      this.getSummary(),
      this.getMonthlyActivity(organizationId),
    ])
    return { organizationSummary, monthlyActivity }
  }

  async getSummary(): Promise<OrganizationAnalytics['organizationSummary']> {
    const organizations = await this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        campaigns: { select: { id: true } },
        users: {
          select: {
            conversations: { select: { id: true } },
          },
        },
      },
    })

    return organizations.map((org) => {
      let conversations = 0
      for (const user of org.users) {
        conversations += user.conversations.length
      }

      return {
        id: org.id,
        name: org.name,
        campaigns: org.campaigns.length,
        conversations,
        messages: 0,
      }
    })
  }

  async getMonthlyActivity(
    organizationId?: string,
  ): Promise<OrganizationAnalytics['monthlyActivity']> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const metrics = await this.prisma.analyticsMetric.findMany({
      where: {
        metric: { in: ['campaigns_created', 'conversations_created', 'messages_sent'] },
        period: 'month',
        bucket: { gte: sixMonthsAgo },
        ...(organizationId ? { organizationId } : {}),
      },
      select: {
        metric: true,
        value: true,
        bucket: true,
      },
      orderBy: { bucket: 'asc' },
    })

    const monthMap = new Map<string, { campaigns: number; conversations: number; messages: number }>()
    for (const m of metrics) {
      const month = m.bucket.toISOString().substring(0, 7)
      const entry = monthMap.get(month) ?? { campaigns: 0, conversations: 0, messages: 0 }
      if (m.metric === 'campaigns_created') entry.campaigns += m.value
      else if (m.metric === 'conversations_created') entry.conversations += m.value
      else if (m.metric === 'messages_sent') entry.messages += m.value
      monthMap.set(month, entry)
    }

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }))
  }
}
