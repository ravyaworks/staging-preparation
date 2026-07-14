import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { AnalyticsPeriod } from '../types'
import { BaseAggregator } from './base.aggregator'

const PERIOD_MS: Record<AnalyticsPeriod, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
}

export class CampaignAggregator extends BaseAggregator {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger)
  }

  async aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void> {
    const periodMs = PERIOD_MS[period]
    const bucketEnd = new Date(bucket.getTime() + periodMs)

    this.logger.info('Running campaign aggregation', {
      period,
      bucket: bucket.toISOString(),
      bucketEnd: bucketEnd.toISOString(),
    })

    const organizations = await this.prisma.campaign.groupBy({
      by: ['organizationId'],
      _count: { id: true },
    })

    const orgIds = organizations.map((o) => o.organizationId)

    const totalCampaigns = await this.prisma.campaign.count({
      where: { createdAt: { lte: bucketEnd } },
    })
    await this.upsertMetric(
      'total_campaigns',
      totalCampaigns,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    for (const orgId of orgIds) {
      const orgTotal = await this.prisma.campaign.count({
        where: {
          organizationId: orgId,
          createdAt: { lte: bucketEnd },
        },
      })
      await this.upsertMetric(
        'total_campaigns',
        orgTotal,
        undefined,
        undefined,
        orgId,
        period,
        bucket,
      )
    }

    const activeCampaigns = await this.prisma.campaign.count({
      where: {
        status: 'running',
        createdAt: { lte: bucketEnd },
      },
    })
    await this.upsertMetric(
      'active_campaigns',
      activeCampaigns,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    for (const orgId of orgIds) {
      const orgActive = await this.prisma.campaign.count({
        where: {
          organizationId: orgId,
          status: 'running',
          createdAt: { lte: bucketEnd },
        },
      })
      await this.upsertMetric(
        'active_campaigns',
        orgActive,
        undefined,
        undefined,
        orgId,
        period,
        bucket,
      )
    }

    const completedCampaigns = await this.prisma.campaign.count({
      where: {
        status: 'completed',
        createdAt: { lte: bucketEnd },
      },
    })
    await this.upsertMetric(
      'completed_campaigns',
      completedCampaigns,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    for (const orgId of orgIds) {
      const orgCompleted = await this.prisma.campaign.count({
        where: {
          organizationId: orgId,
          status: 'completed',
          createdAt: { lte: bucketEnd },
        },
      })
      await this.upsertMetric(
        'completed_campaigns',
        orgCompleted,
        undefined,
        undefined,
        orgId,
        period,
        bucket,
      )
    }

    const campaignsCreated = await this.prisma.campaign.count({
      where: {
        createdAt: { gte: bucket, lt: bucketEnd },
      },
    })
    await this.upsertMetric(
      'campaigns_created',
      campaignsCreated,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    for (const orgId of orgIds) {
      const orgCreated = await this.prisma.campaign.count({
        where: {
          organizationId: orgId,
          createdAt: { gte: bucket, lt: bucketEnd },
        },
      })
      await this.upsertMetric(
        'campaigns_created',
        orgCreated,
        undefined,
        undefined,
        orgId,
        period,
        bucket,
      )
    }

    const completedEvents = await this.prisma.analyticsEvent.count({
      where: {
        type: 'campaign.completed',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })

    const failedEvents = await this.prisma.analyticsEvent.count({
      where: {
        type: 'campaign.failed',
        timestamp: { gte: bucket, lt: bucketEnd },
      },
    })

    const totalFinished = completedEvents + failedEvents
    const successRate = totalFinished > 0 ? (completedEvents / totalFinished) * 100 : 0

    await this.upsertMetric(
      'campaign_success_rate',
      successRate,
      undefined,
      undefined,
      undefined,
      period,
      bucket,
    )

    this.logger.info('Campaign aggregation complete', {
      period,
      bucket: bucket.toISOString(),
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      campaignsCreated,
      successRate,
    })
  }
}
