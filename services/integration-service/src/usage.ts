import type { ChannelType } from '@conversation-platform/channel-core'
import type { IntegrationUsage, IntegrationStats } from './types'
import type { IntegrationUsageRepository } from '@conversation-platform/database'

export class UsageTracker {
  private usageRecords: IntegrationUsage[] = []
  private maxSize: number
  private usageRepo?: IntegrationUsageRepository

  constructor(maxSize = 100000, usageRepo?: IntegrationUsageRepository) {
    this.maxSize = maxSize
    this.usageRepo = usageRepo
  }

  record(params: {
    integrationId: string
    tenantId: string
    messagesSent?: number
    messagesReceived?: number
    errors?: number
    latencyMs?: number
  }): void {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const periodEnd = now.toISOString()

    const existing = this.usageRecords.find(
      r => r.integrationId === params.integrationId && r.periodStart === periodStart,
    )

    if (existing) {
      existing.messagesSent += params.messagesSent ?? 0
      existing.messagesReceived += params.messagesReceived ?? 0
      existing.errors += params.errors ?? 0
      existing.totalLatencyMs += params.latencyMs ?? 0
      existing.averageLatencyMs = existing.totalLatencyMs / (existing.messagesSent + existing.messagesReceived)
      existing.periodEnd = periodEnd
    } else {
      this.usageRecords.push({
        integrationId: params.integrationId,
        tenantId: params.tenantId,
        periodStart,
        periodEnd,
        messagesSent: params.messagesSent ?? 0,
        messagesReceived: params.messagesReceived ?? 0,
        errors: params.errors ?? 0,
        totalLatencyMs: params.latencyMs ?? 0,
        averageLatencyMs: params.latencyMs ?? 0,
      })
    }

    if (this.usageRecords.length > this.maxSize) {
      this.usageRecords = this.usageRecords.slice(-this.maxSize)
    }

    if (this.usageRepo) {
      this.usageRepo.upsert({
        integrationId: params.integrationId,
        periodStart: new Date(periodStart),
        periodEnd: now,
        messagesSent: params.messagesSent ?? 0,
        messagesReceived: params.messagesReceived ?? 0,
        errors: params.errors ?? 0,
        totalLatencyMs: params.latencyMs ?? 0,
      }).catch(() => {})
    }
  }

  getUsage(integrationId: string, days = 7): IntegrationUsage[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return this.usageRecords
      .filter(r => r.integrationId === integrationId && new Date(r.periodStart) >= cutoff)
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
  }

  async getUsageFromDb(integrationId: string, days = 7): Promise<IntegrationUsage[] | undefined> {
    if (!this.usageRepo) return undefined
    const records = await this.usageRepo.findByIntegration(integrationId, days)
    return records.map(r => ({
      integrationId: r.integrationId,
      tenantId: '',
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      messagesSent: r.messagesSent,
      messagesReceived: r.messagesReceived,
      errors: r.errors,
      totalLatencyMs: r.totalLatencyMs,
      averageLatencyMs: (r.messagesSent + r.messagesReceived) > 0 ? r.totalLatencyMs / (r.messagesSent + r.messagesReceived) : 0,
    }))
  }

  getTenantUsage(tenantId: string, days = 7): IntegrationUsage[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return this.usageRecords
      .filter(r => r.tenantId === tenantId && new Date(r.periodStart) >= cutoff)
  }

  getStats(
    integrations: Array<{ id: string; channelType: ChannelType }>,
  ): IntegrationStats {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

    const todayRecords = this.usageRecords.filter(r => r.periodStart >= todayStart)
    const allTenantRecords = this.usageRecords

    const totalMessagesSent = todayRecords.reduce((s, r) => s + r.messagesSent, 0)
    const totalMessagesReceived = todayRecords.reduce((s, r) => s + r.messagesReceived, 0)
    const totalErrors = todayRecords.reduce((s, r) => s + r.errors, 0)
    const totalLatency = todayRecords.reduce((s, r) => s + r.totalLatencyMs, 0)
    const totalMessages = totalMessagesSent + totalMessagesReceived

    const channelCounts = new Map<ChannelType, number>()
    for (const int of integrations) {
      const usage = allTenantRecords.filter(r => r.integrationId === int.id)
      const count = usage.reduce((s, r) => s + r.messagesSent + r.messagesReceived, 0)
      channelCounts.set(int.channelType, (channelCounts.get(int.channelType) ?? 0) + count)
    }

    const topChannels = Array.from(channelCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([channelType, messageCount]) => ({ channelType, messageCount }))

    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.length,
      totalMessagesToday: totalMessages,
      totalErrorsToday: totalErrors,
      averageLatencyMs: totalMessages > 0 ? totalLatency / totalMessages : 0,
      topChannels,
    }
  }

  clear(): void {
    this.usageRecords = []
  }
}
