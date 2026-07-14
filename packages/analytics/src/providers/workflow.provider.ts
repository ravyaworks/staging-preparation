import type { PrismaClient } from '@prisma/client'
import type { WorkflowAnalytics } from '../types'

export class WorkflowAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(): Promise<WorkflowAnalytics> {
    const [
      workflowExecutions,
      workflowSuccesses,
      workflowFailures,
      executionTimes,
      workflowEventsRaw,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { type: 'workflow.executed' },
      }),
      this.prisma.analyticsEvent.count({
        where: { type: 'workflow.completed' },
      }),
      this.prisma.analyticsEvent.count({
        where: { type: 'workflow.failed' },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          type: { in: ['workflow.executed', 'workflow.completed', 'workflow.failed'] },
        },
        select: { data: true, timestamp: true, type: true },
        take: 5000,
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          type: { in: ['workflow.executed', 'workflow.completed'] },
        },
        select: { data: true },
        take: 5000,
      }),
    ])

    const workflowSuccessRate =
      workflowExecutions > 0
        ? Math.round((workflowSuccesses / workflowExecutions) * 100 * 100) / 100
        : 0

    let totalExecutionMs = 0
    let executionCount = 0
    const executedMap = new Map<string, Date>()
    for (const e of executionTimes) {
      const data = e.data as Record<string, unknown>
      const workflowId = data?.workflowId as string | undefined
      if (!workflowId) continue

      if (e.type === 'workflow.executed') {
        executedMap.set(workflowId, e.timestamp)
      } else if (e.type === 'workflow.completed') {
        const start = executedMap.get(workflowId)
        if (start) {
          totalExecutionMs += e.timestamp.getTime() - start.getTime()
          executionCount++
          executedMap.delete(workflowId)
        }
      }
    }
    const averageExecutionTimeMs =
      executionCount > 0 ? Math.round(totalExecutionMs / executionCount) : 0

    const workflowCounts = new Map<string, number>()
    for (const e of workflowEventsRaw) {
      const data = e.data as Record<string, unknown>
      const workflowId = data?.workflowId as string | undefined
      const workflowName = data?.workflowName as string | undefined
      if (!workflowId) continue
      const key = `${workflowId}:::${workflowName ?? workflowId}`
      workflowCounts.set(key, (workflowCounts.get(key) ?? 0) + 1)
    }

    const mostUsedWorkflows = Array.from(workflowCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const separatorIndex = key.indexOf(':::')
        const id = key.substring(0, separatorIndex)
        const name = key.substring(separatorIndex + 3) || id
        return { id, name, executions: count }
      })

    return {
      workflowExecutions,
      workflowSuccessRate,
      workflowFailures,
      averageExecutionTimeMs,
      mostUsedWorkflows,
    }
  }
}
