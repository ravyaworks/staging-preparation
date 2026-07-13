import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FailureTracker } from '../failure-tracker'

const mockPrisma = {
  jobFailure: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('FailureTracker', () => {
  let tracker: FailureTracker

  beforeEach(() => {
    vi.clearAllMocks()
    tracker = new FailureTracker(mockPrisma as any, mockLogger as any)
  })

  describe('recordFailure', () => {
    it('should create a failure record', async () => {
      const mockFailure = {
        id: 'fail-1', jobId: 'job-1', errorType: 'TIMEOUT', errorMessage: 'Connection timed out',
        retryCount: 1, lastRetryAt: null, stackTrace: null, resolutionStatus: 'unresolved',
        resolvedAt: null, resolvedBy: null, createdAt: new Date(),
      }
      mockPrisma.jobFailure.create.mockResolvedValue(mockFailure)

      const result = await tracker.recordFailure('job-1', 'TIMEOUT', 'Connection timed out', 1)

      expect(result).toMatchObject({
        id: 'fail-1', errorType: 'TIMEOUT', resolutionStatus: 'unresolved',
      })
      expect(mockPrisma.jobFailure.create).toHaveBeenCalledWith({
        data: { jobId: 'job-1', errorType: 'TIMEOUT', errorMessage: 'Connection timed out', retryCount: 1, stackTrace: null, resolutionStatus: 'unresolved' },
      })
    })

    it('should record failure with stack trace', async () => {
      mockPrisma.jobFailure.create.mockResolvedValue({
        id: 'fail-2', jobId: 'job-1', errorType: 'RATE_LIMIT', errorMessage: 'Too many requests',
        retryCount: 2, lastRetryAt: null, stackTrace: 'Error:...', resolutionStatus: 'unresolved',
        resolvedAt: null, resolvedBy: null, createdAt: new Date(),
      })

      const result = await tracker.recordFailure('job-1', 'RATE_LIMIT', 'Too many requests', 2, 'Error:...')
      expect(result.stackTrace).toBe('Error:...')
    })
  })

  describe('updateRetry', () => {
    it('should update retry count and timestamp', async () => {
      const before = new Date(Date.now() - 60000)
      mockPrisma.jobFailure.findFirst.mockResolvedValue({
        id: 'fail-1', retryCount: 1, lastRetryAt: before, resolutionStatus: 'unresolved',
      })
      mockPrisma.jobFailure.update.mockResolvedValue({ id: 'fail-1', retryCount: 2, lastRetryAt: new Date() })

      await tracker.updateRetry('job-1', 2)

      expect(mockPrisma.jobFailure.update).toHaveBeenCalledWith({
        where: { id: 'fail-1' },
        data: { retryCount: 2, lastRetryAt: expect.any(Date) },
      })
    })

    it('should not update if no unresolved failure exists', async () => {
      mockPrisma.jobFailure.findFirst.mockResolvedValue(null)
      await tracker.updateRetry('job-1', 2)
      expect(mockPrisma.jobFailure.update).not.toHaveBeenCalled()
    })
  })

  describe('resolveFailure', () => {
    it('should resolve the latest unresolved failure', async () => {
      mockPrisma.jobFailure.findFirst.mockResolvedValue({
        id: 'fail-1', jobId: 'job-1', resolutionStatus: 'unresolved',
      })
      mockPrisma.jobFailure.update.mockResolvedValue({
        id: 'fail-1', jobId: 'job-1', errorType: 'TIMEOUT', errorMessage: 'timeout',
        retryCount: 1, lastRetryAt: null, stackTrace: null, resolutionStatus: 'resolved',
        resolvedAt: new Date(), resolvedBy: 'user-1', createdAt: new Date(),
      })

      const result = await tracker.resolveFailure('job-1', 'resolved', 'user-1')
      expect(result).not.toBeNull()
      expect(result!.resolutionStatus).toBe('resolved')
    })

    it('should return null if no unresolved failure', async () => {
      mockPrisma.jobFailure.findFirst.mockResolvedValue(null)
      const result = await tracker.resolveFailure('job-1', 'resolved')
      expect(result).toBeNull()
    })
  })

  describe('getUnresolvedFailures', () => {
    it('should return paginated unresolved failures', async () => {
      mockPrisma.jobFailure.findMany.mockResolvedValue([
        { id: 'f1', jobId: 'j1', errorType: 'TIMEOUT', errorMessage: 'timeout', retryCount: 2, lastRetryAt: null, stackTrace: null, resolutionStatus: 'unresolved', resolvedAt: null, resolvedBy: null, createdAt: new Date() },
      ])
      mockPrisma.jobFailure.count.mockResolvedValue(5)

      const result = await tracker.getUnresolvedFailures(10, 0)
      expect(result.failures).toHaveLength(1)
      expect(result.total).toBe(5)
    })
  })

  describe('getFailureStats', () => {
    it('should return aggregated failure statistics', async () => {
      mockPrisma.jobFailure.findMany.mockResolvedValue([
        { errorType: 'TIMEOUT', resolutionStatus: 'unresolved' },
        { errorType: 'TIMEOUT', resolutionStatus: 'resolved' },
        { errorType: 'RATE_LIMIT', resolutionStatus: 'unresolved' },
        { errorType: 'NETWORK', resolutionStatus: 'unresolved' },
      ])
      mockPrisma.jobFailure.count.mockResolvedValue(3)

      const stats = await tracker.getFailureStats()
      expect(stats.total).toBe(4)
      expect(stats.unresolved).toBe(3)
      expect(stats.resolved).toBe(1)
      expect(stats.byType).toEqual({ TIMEOUT: 2, RATE_LIMIT: 1, NETWORK: 1 })
    })
  })
})
