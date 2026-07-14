import type { PrismaClient } from '@prisma/client'
import type { CampaignAnalytics } from '../types'

export class CampaignAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(
    organizationId?: string,
    startDate?: string,
    endDate?: string,
    channel?: string,
  ): Promise<CampaignAnalytics> {
    const campaignWhere: Record<string, unknown> = {}
    if (organizationId) campaignWhere.organizationId = organizationId
    if (channel) campaignWhere.channel = channel
    if (startDate || endDate) {
      campaignWhere.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }

    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      failedCampaigns,
      businessesContacted,
      deliveryRateMetric,
      readRateMetric,
      replyStats,
      completedDurations,
      topPerformingRaw,
      trendRaw,
    ] = await Promise.all([
      this.prisma.campaign.count({ where: campaignWhere }),
      this.prisma.campaign.count({ where: { ...campaignWhere, status: 'running' } }),
      this.prisma.campaign.count({ where: { ...campaignWhere, status: 'completed' } }),
      this.prisma.campaign.count({ where: { ...campaignWhere, status: 'failed' } }),
      this.prisma.campaignBusiness.count({
        where: organizationId ? { campaign: { organizationId } } : undefined,
      }),
      this.prisma.campaignStatistics.aggregate({
        where: { campaign: campaignWhere },
        _sum: { delivered: true, sent: true },
      }),
      this.prisma.analyticsMetric.aggregate({
        where: {
          metric: 'messages_read',
          ...(organizationId ? { organizationId } : {}),
        },
        _sum: { value: true },
      }),
      this.prisma.campaignStatistics.aggregate({
        where: { campaign: campaignWhere },
        _sum: { replied: true, totalBusinesses: true },
      }),
      this.prisma.campaign.findMany({
        where: { ...campaignWhere, status: 'completed', startedAt: { not: null }, completedAt: { not: null } },
        select: { startedAt: true, completedAt: true },
      }),
      this.prisma.campaign.findMany({
        where: campaignWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          statistics: { select: { delivered: true, totalBusinesses: true, replied: true, failed: true } },
        },
      }),
      this.prisma.campaign.findMany({
        where: {
          ...campaignWhere,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const successRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 100 : 0
    const completionPercent = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 100 : 0
    const deliveryRateNum =
      deliveryRateMetric._sum.sent && deliveryRateMetric._sum.sent > 0
        ? ((deliveryRateMetric._sum.delivered ?? 0) / deliveryRateMetric._sum.sent) * 100
        : 0
    const totalReplied = replyStats._sum.replied ?? 0
    const totalBusinesses = replyStats._sum.totalBusinesses ?? 0
    const readRateNum =
      totalBusinesses > 0 ? ((readRateMetric._sum.value ?? 0) / totalBusinesses) * 100 : 0
    const replyRate = totalBusinesses > 0 ? (totalReplied / totalBusinesses) * 100 : 0
    const failureRate = totalCampaigns > 0 ? (failedCampaigns / totalCampaigns) * 100 : 0

    let totalDurationMs = 0
    for (const c of completedDurations) {
      if (c.startedAt && c.completedAt) {
        totalDurationMs += c.completedAt.getTime() - c.startedAt.getTime()
      }
    }
    const averageCompletionTimeMs =
      completedDurations.length > 0 ? Math.round(totalDurationMs / completedDurations.length) : 0

    const topPerforming = topPerformingRaw.map((c) => {
      const stats = c.statistics[0]
      const total = stats?.totalBusinesses ?? 0
      const delivered = stats?.delivered ?? 0
      return {
        id: c.id,
        name: c.name,
        successRate: total > 0 ? (delivered / total) * 100 : 0,
        businessesContacted: total,
      }
    })

    const trendMap = new Map<string, { campaigns: number; completed: number }>()
    for (const c of trendRaw) {
      const date = c.createdAt.toISOString().split('T')[0]!
      const entry = trendMap.get(date) ?? { campaigns: 0, completed: 0 }
      entry.campaigns++
      if (c.status === 'completed') entry.completed++
      trendMap.set(date, entry)
    }
    const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }))

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      successRate: Math.round(successRate * 100) / 100,
      completionPercent: Math.round(completionPercent * 100) / 100,
      businessesContacted,
      deliveryRate: Math.round(deliveryRateNum * 100) / 100,
      readRate: Math.round(readRateNum * 100) / 100,
      replyRate: Math.round(replyRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      averageCompletionTimeMs,
      topPerforming,
      trend,
    }
  }
}
