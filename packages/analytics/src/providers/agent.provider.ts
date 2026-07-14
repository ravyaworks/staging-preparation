import type { PrismaClient } from '@prisma/client'
import type { AgentAnalytics } from '../types'

export class AgentAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(tenantId?: string): Promise<AgentAnalytics> {
    const conversationWhere: Record<string, unknown> = {}
    if (tenantId) conversationWhere.tenantId = tenantId

    const [
      assignedConversations,
      closedByAgents,
      activeAgentIds,
      avgResolutionRaw,
      avgResponseRaw,
      onlineWorkers,
      totalWorkers,
    ] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          ...conversationWhere,
          assignedToId: { not: null },
        },
      }),
      this.prisma.conversation.count({
        where: {
          ...conversationWhere,
          status: 'closed',
          assignedToId: { not: null },
        },
      }),
      this.prisma.conversation.findMany({
        where: {
          ...conversationWhere,
          status: 'active',
          assignedToId: { not: null },
        },
        select: { assignedToId: true },
        distinct: ['assignedToId'],
      }),
      this.prisma.conversation.findMany({
        where: {
          ...conversationWhere,
          status: 'closed',
          assignedToId: { not: null },
        },
        select: { createdAt: true, updatedAt: true },
        take: 1000,
      }),
      this.computeAgentResponseTime(conversationWhere),
      this.prisma.workerMetric.count({
        where: { status: 'active' },
      }),
      this.prisma.workerMetric.count(),
    ])

    const activeAgents = activeAgentIds.length
    const agentWorkload = activeAgents > 0
      ? Math.round((assignedConversations / activeAgents) * 100) / 100
      : 0
    const agentAvailability = totalWorkers > 0
      ? Math.round((onlineWorkers / totalWorkers) * 100 * 100) / 100
      : 0

    let totalResolutionMs = 0
    for (const c of avgResolutionRaw) {
      totalResolutionMs += c.updatedAt.getTime() - c.createdAt.getTime()
    }
    const averageResolutionTimeMs =
      avgResolutionRaw.length > 0 ? Math.round(totalResolutionMs / avgResolutionRaw.length) : 0

    return {
      activeAgents,
      assignedConversations,
      closedConversations: closedByAgents,
      averageResolutionTimeMs,
      customerResponseTimeMs: avgResponseRaw,
      agentWorkload,
      agentAvailability,
    }
  }

  private async computeAgentResponseTime(
    conversationWhere: Record<string, unknown>,
  ): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        ...conversationWhere,
        assignedToId: { not: null },
      },
      select: { id: true },
      take: 200,
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
