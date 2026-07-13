import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsService } from '../analytics-service'

const mockPrisma = {
  outreachJob: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
  },
  workerMetric: {
    findMany: vi.fn(),
  },
  campaign: {
    findMany: vi.fn(),
  },
  deliveryEvent: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
}

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('AnalyticsService', () => {
  let analytics: AnalyticsService

  beforeEach(() => {
    vi.clearAllMocks()
    analytics = new AnalyticsService(mockPrisma as any, mockLogger as any)
  })

  describe('getDeliveryAnalytics', () => {
    it('should compute analytics over a period', async () => {
      const now = new Date()
      const anHourAgo = new Date(now.getTime() - 3600000)

      mockPrisma.outreachJob.findMany
        .mockResolvedValueOnce([
          { id: '1', status: 'completed', attempts: 0, createdAt: anHourAgo, processedAt: now, campaignId: 'c1' },
          { id: '2', status: 'failed', attempts: 1, createdAt: anHourAgo, processedAt: now, campaignId: 'c1' },
          { id: '3', status: 'completed', attempts: 0, createdAt: anHourAgo, processedAt: now, campaignId: 'c2' },
          { id: '4', status: 'queued', attempts: 0, createdAt: anHourAgo, processedAt: null, campaignId: 'c2' },
        ])
        .mockResolvedValueOnce([
          { id: '1', campaignId: 'c1', campaign: { name: 'Camp A' } },
          { id: '3', campaignId: 'c2', campaign: { name: 'Camp B' } },
        ])
        .mockResolvedValueOnce([
          { createdAt: anHourAgo, processedAt: now },
          { createdAt: anHourAgo, processedAt: now },
          { createdAt: anHourAgo, processedAt: now },
        ])

      mockPrisma.outreachJob.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)

      mockPrisma.workerMetric.findMany.mockResolvedValue([
        { workerId: 'w1', status: 'active' },
        { workerId: 'w2', status: 'active' },
        { workerId: 'w3', status: 'idle' },
      ])

      mockPrisma.campaign.findMany.mockResolvedValue([
        { id: 'c1', name: 'Camp A', _count: { jobs: 2 } },
        { id: 'c2', name: 'Camp B', _count: { jobs: 2 } },
      ])

      const result = await analytics.getDeliveryAnalytics(anHourAgo, now)

      expect(result.totalJobs).toBe(4)
      expect(result.completedJobs).toBe(2)
      expect(result.failedJobs).toBe(1)
      expect(result.retriedJobs).toBe(1)
      expect(result.successRate).toBe(50)
      expect(result.activeWorkers).toBe(2)
      expect(result.idleWorkers).toBe(1)
      expect(result.campaignCompletionRates).toHaveLength(2)
    })
  })

  describe('getQueueHealth', () => {
    it('should return queue health metrics', async () => {
      mockPrisma.outreachJob.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)

      mockPrisma.outreachJob.findFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 300000),
      })

      mockPrisma.outreachJob.findMany.mockResolvedValue([
        { id: '1' }, { id: '2' },
      ])

      mockPrisma.deliveryEvent.findMany
        .mockResolvedValueOnce([
          { jobId: 'j1', timestamp: new Date() },
          { jobId: 'j2', timestamp: new Date() },
        ])
        .mockResolvedValueOnce([
          { jobId: 'j1', timestamp: new Date(Date.now() - 10000) },
          { jobId: 'j2', timestamp: new Date(Date.now() - 20000) },
        ])

      const health = await analytics.getQueueHealth()

      expect(health.queuedCount).toBe(5)
      expect(health.processingCount).toBe(2)
      expect(health.deadLetterCount).toBe(1)
      expect(health.currentLoad).toBe(7)
      expect(health.throughputPerMinute).toBe(2)
      expect(typeof health.isHealthy).toBe('boolean')
    })
  })
})
