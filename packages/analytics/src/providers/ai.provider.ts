import type { PrismaClient } from '@prisma/client'
import type { AIAnalytics } from '../types'

export class AIAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(tenantId?: string): Promise<AIAnalytics> {
    const messageWhere: Record<string, unknown> = {}
    if (tenantId) {
      messageWhere.conversation = { tenantId }
    }

    const [
      aiResponsesGenerated,
      aiEscalations,
      humanTakeovers,
      avgResponseTimeRaw,
      knowledgeBaseEvents,
      workflowEvents,
      totalMessages,
    ] = await Promise.all([
      this.prisma.message.count({
        where: {
          role: 'assistant',
          provider: { not: null },
          ...(tenantId ? { conversation: { tenantId } } : {}),
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          type: 'ai.escalation',
          ...(tenantId ? { tenantId } : {}),
        },
      }),
      this.prisma.conversation.count({
        where: {
          isHumanHandoff: true,
          ...(tenantId ? { tenantId } : {}),
        },
      }),
      this.prisma.message.findMany({
        where: {
          role: 'assistant',
          latency: { not: null },
          ...(tenantId ? { conversation: { tenantId } } : {}),
        },
        select: { latency: true },
        take: 5000,
      }),
      this.prisma.analyticsEvent.count({
        where: {
          type: 'ai.response',
          ...(tenantId ? { tenantId } : {}),
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          type: 'workflow.executed',
          ...(tenantId ? { tenantId } : {}),
        },
      }),
      this.prisma.message.count({
        where: {
          ...(tenantId ? { conversation: { tenantId } } : {}),
        },
      }),
    ])

    let totalLatencyMs = 0
    let latencyCount = 0
    for (const m of avgResponseTimeRaw) {
      if (m.latency !== null) {
        totalLatencyMs += m.latency
        latencyCount++
      }
    }
    const aiResponseTimeMs = latencyCount > 0 ? Math.round(totalLatencyMs / latencyCount) : 0

    const aiAccuracyFeedback = aiResponsesGenerated > 0
      ? Math.round(((aiResponsesGenerated - aiEscalations) / aiResponsesGenerated) * 100 * 100) / 100
      : 0

    const knowledgeBaseUsage = knowledgeBaseEvents
    const workflowTriggerRate = totalMessages > 0
      ? Math.round((workflowEvents / totalMessages) * 100 * 100) / 100
      : 0

    return {
      aiResponsesGenerated,
      aiAccuracyFeedback,
      aiEscalations,
      humanTakeovers,
      aiResponseTimeMs,
      knowledgeBaseUsage,
      workflowTriggerRate,
    }
  }
}
