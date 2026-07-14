import type { PrismaClient } from '@prisma/client'
import type { ConversationAnalytics } from '../types'

export class ConversationAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(
    tenantId?: string,
    organizationId?: string,
    channel?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ConversationAnalytics> {
    const baseWhere: Record<string, unknown> = {}
    if (tenantId) baseWhere.tenantId = tenantId

    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    if (Object.keys(dateFilter).length > 0) baseWhere.createdAt = dateFilter

    const campaignWhere: Record<string, unknown> = {}
    if (organizationId) campaignWhere.organizationId = organizationId

    const [
      totalConversations,
      activeConversations,
      closedConversations,
      avgDurationRaw,
      avgResponseTimeRaw,
      reopenedConversations,
      escalatedConversations,
      trendRaw,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: baseWhere }),
      this.prisma.conversation.count({ where: { ...baseWhere, status: 'active' } }),
      this.prisma.conversation.count({ where: { ...baseWhere, status: 'closed' } }),
      this.prisma.conversation.findMany({
        where: { ...baseWhere, status: 'closed' },
        select: { createdAt: true, updatedAt: true },
        take: 1000,
      }),
      this.computeAverageResponseTime(baseWhere),
      this.prisma.analyticsEvent.count({
        where: {
          type: 'conversation.reopened',
          ...(tenantId ? { tenantId } : {}),
          ...(organizationId ? { organizationId } : {}),
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          type: 'conversation.escalated',
          ...(tenantId ? { tenantId } : {}),
          ...(organizationId ? { organizationId } : {}),
        },
      }),
      this.prisma.conversation.findMany({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { createdAt: true, status: true, updatedAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    let totalDurationMs = 0
    for (const c of avgDurationRaw) {
      totalDurationMs += c.updatedAt.getTime() - c.createdAt.getTime()
    }
    const averageDurationMs =
      avgDurationRaw.length > 0 ? Math.round(totalDurationMs / avgDurationRaw.length) : 0

    const trendMap = new Map<string, { created: number; closed: number }>()
    for (const c of trendRaw) {
      const date = c.createdAt.toISOString().split('T')[0]!
      const entry = trendMap.get(date) ?? { created: 0, closed: 0 }
      entry.created++
      if (c.status === 'closed') entry.closed++
      trendMap.set(date, entry)
    }
    const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }))

    return {
      totalConversations,
      activeConversations,
      closedConversations,
      averageDurationMs,
      averageResponseTimeMs: avgResponseTimeRaw,
      customerWaitTimeMs: avgResponseTimeRaw,
      reopenedConversations,
      escalatedConversations,
      trend,
    }
  }

  private async computeAverageResponseTime(
    baseWhere: Record<string, unknown>,
  ): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: baseWhere,
      select: { id: true },
      take: 500,
    })

    if (conversations.length === 0) return 0

    const conversationIds = conversations.map((c) => c.id)

    const messages = await this.prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      select: { conversationId: true, direction: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const byConversation = new Map<string, Array<{ direction: string; createdAt: Date }>>()
    for (const m of messages) {
      const list = byConversation.get(m.conversationId) ?? []
      list.push({ direction: m.direction, createdAt: m.createdAt })
      byConversation.set(m.conversationId, list)
    }

    let totalResponseMs = 0
    let responseCount = 0

    for (const msgs of byConversation.values()) {
      for (let i = 1; i < msgs.length; i++) {
        const current = msgs[i]!
        const previous = msgs[i - 1]!
        if (current.direction === 'outbound' && previous.direction === 'inbound') {
          totalResponseMs += current.createdAt.getTime() - previous.createdAt.getTime()
          responseCount++
        }
      }
    }

    return responseCount > 0 ? Math.round(totalResponseMs / responseCount) : 0
  }
}
