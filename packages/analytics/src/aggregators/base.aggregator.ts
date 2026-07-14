import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { AnalyticsPeriod } from '../types'

const PERIOD_MS: Record<AnalyticsPeriod, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
}

export abstract class BaseAggregator {
  protected readonly prisma: PrismaClient
  protected readonly logger: Logger

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma
    this.logger = logger
  }

  abstract aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void>

  getBucketTimestamp(period: AnalyticsPeriod, date: Date): Date {
    const ms = PERIOD_MS[period]
    const epochMs = date.getTime()
    return new Date(epochMs - (epochMs % ms))
  }

  async upsertMetric(
    metric: string,
    value: number,
    dimension: string | undefined,
    tenantId: string | undefined,
    organizationId: string | undefined,
    period: AnalyticsPeriod,
    bucket: Date,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO analytics_metrics (id, metric, value, dimension, "tenantId", "organizationId", period, bucket, "createdAt")
      VALUES (gen_random_uuid(), ${metric}, ${value}, ${dimension}, ${tenantId}, ${organizationId}, ${period}, ${bucket}, now())
      ON CONFLICT (metric, period, bucket, dimension, "tenantId", "organizationId")
      DO UPDATE SET value = EXCLUDED.value
    `
  }

  async aggregateAll(periods: AnalyticsPeriod[], asOf?: Date): Promise<void> {
    const now = asOf ?? new Date()
    for (const period of periods) {
      const bucket = this.getBucketTimestamp(period, now)
      this.logger.info('Aggregating', { period, bucket: bucket.toISOString() })
      await this.aggregate(period, bucket)
    }
  }
}
