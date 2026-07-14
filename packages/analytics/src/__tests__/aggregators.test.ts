import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { BaseAggregator } from '../aggregators/base.aggregator'
import type { AnalyticsPeriod } from '../types'

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
  setLevel: vi.fn(),
  getLevel: vi.fn().mockReturnValue('info'),
} satisfies Logger

class TestAggregator extends BaseAggregator {
  async aggregate(period: AnalyticsPeriod, bucket: Date): Promise<void> {
    await this.upsertMetric('test_metric', 42, undefined, 'tenant_1', 'org_1', period, bucket)
  }
}

describe('BaseAggregator', () => {
  let aggregator: TestAggregator
  let mockPrisma: PrismaClient

  beforeEach(() => {
    mockPrisma = {
      $executeRaw: vi.fn().mockResolvedValue([1]),
      analyticsMetric: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaClient
    aggregator = new TestAggregator(mockPrisma, mockLogger)
  })

  it('getBucketTimestamp truncates to hour', () => {
    const date = new Date('2024-01-15T14:35:22.000Z')
    const bucket = aggregator.getBucketTimestamp('hour', date)
    expect(bucket.getUTCHours()).toBe(14)
    expect(bucket.getUTCMinutes()).toBe(0)
    expect(bucket.getUTCSeconds()).toBe(0)
  })

  it('getBucketTimestamp truncates to day', () => {
    const date = new Date('2024-01-15T14:35:22.000Z')
    const bucket = aggregator.getBucketTimestamp('day', date)
    expect(bucket.getUTCHours()).toBe(0)
    expect(bucket.getUTCMinutes()).toBe(0)
    expect(bucket.getUTCDate()).toBe(15)
  })

  it('getBucketTimestamp truncates to week (Monday)', () => {
    const date = new Date('2024-01-08T14:35:22.000Z') // Monday
    const bucket = aggregator.getBucketTimestamp('week', date)
    expect(bucket.getUTCHours()).toBe(0)
    expect(bucket.getUTCMinutes()).toBe(0)
  })

  it('aggregateAll calls aggregate for each period', async () => {
    const spy = vi.spyOn(aggregator, 'aggregate')
    await aggregator.aggregateAll(['hour', 'day'], new Date('2024-01-15T14:00:00.000Z'))
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
