import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkerTracker } from '../worker-tracker'

const mockPrisma = {
  workerMetric: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
}

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('WorkerTracker', () => {
  let tracker: WorkerTracker

  beforeEach(() => {
    vi.clearAllMocks()
    tracker = new WorkerTracker(mockPrisma as any, mockLogger as any)
  })

  describe('registerHeartbeat', () => {
    it('should create new worker if not exists', async () => {
      mockPrisma.workerMetric.findUnique.mockResolvedValue(null)
      mockPrisma.workerMetric.create.mockResolvedValue({
        workerId: 'w1', currentJobId: null, jobsProcessed: 0, successCount: 0,
        failureCount: 0, averageProcessingMs: 0, lastHeartbeatAt: new Date(),
        status: 'active', startedAt: new Date(),
      })

      const result = await tracker.registerHeartbeat('w1', 'active')
      expect(result.workerId).toBe('w1')
      expect(result.status).toBe('active')
      expect(mockPrisma.workerMetric.create).toHaveBeenCalled()
    })

    it('should update existing worker heartbeat', async () => {
      mockPrisma.workerMetric.findUnique.mockResolvedValue({
        workerId: 'w1', currentJobId: null, jobsProcessed: 10, successCount: 8,
        failureCount: 2, averageProcessingMs: 500, lastHeartbeatAt: new Date(),
        status: 'active', startedAt: new Date(),
      })
      mockPrisma.workerMetric.update.mockResolvedValue({
        workerId: 'w1', currentJobId: 'job-1', jobsProcessed: 10, successCount: 8,
        failureCount: 2, averageProcessingMs: 500, lastHeartbeatAt: new Date(),
        status: 'active', startedAt: new Date(),
      })

      const result = await tracker.registerHeartbeat('w1', 'active', 'job-1')
      expect(result.status).toBe('active')
      expect(mockPrisma.workerMetric.update).toHaveBeenCalled()
    })
  })

  describe('recordJobProcessed', () => {
    it('should increment counters correctly on success', async () => {
      mockPrisma.workerMetric.findUnique.mockResolvedValue({
        workerId: 'w1', currentJobId: null, jobsProcessed: 10, successCount: 7,
        failureCount: 3, averageProcessingMs: 500, lastHeartbeatAt: new Date(),
        status: 'active', startedAt: new Date(),
      })
      mockPrisma.workerMetric.update.mockResolvedValue({
        workerId: 'w1', currentJobId: null, jobsProcessed: 11, successCount: 8,
        failureCount: 3, averageProcessingMs: 545, lastHeartbeatAt: new Date(),
        status: 'idle', startedAt: new Date(),
      })

      const result = await tracker.recordJobProcessed('w1', true, 1000)
      expect(result.jobsProcessed).toBe(11)
      expect(result.successCount).toBe(8)
      expect(result.failureCount).toBe(3)
    })

    it('should increment failure count on failure', async () => {
      mockPrisma.workerMetric.findUnique.mockResolvedValue({
        workerId: 'w1', currentJobId: null, jobsProcessed: 10, successCount: 7,
        failureCount: 3, averageProcessingMs: 500, lastHeartbeatAt: new Date(),
        status: 'active', startedAt: new Date(),
      })
      mockPrisma.workerMetric.update.mockResolvedValue({
        workerId: 'w1', currentJobId: null, jobsProcessed: 11, successCount: 7,
        failureCount: 4, averageProcessingMs: 545, lastHeartbeatAt: new Date(),
        status: 'idle', startedAt: new Date(),
      })

      const result = await tracker.recordJobProcessed('w1', false, 1000)
      expect(result.failureCount).toBe(4)
    })
  })

  describe('getAllWorkers', () => {
    it('should return all workers with uptime', async () => {
      const startedAt = new Date(Date.now() - 3600000)
      mockPrisma.workerMetric.findMany.mockResolvedValue([
        { workerId: 'w1', status: 'active', currentJobId: 'j1', jobsProcessed: 50,
          successCount: 45, failureCount: 5, averageProcessingMs: 300,
          lastHeartbeatAt: new Date(), startedAt },
      ])

      const result = await tracker.getAllWorkers()
      expect(result).toHaveLength(1)
      expect(result[0].uptimeMs).toBeGreaterThanOrEqual(3600000)
    })
  })

  describe('cleanupStaleWorkers', () => {
    it('should mark stale workers as stopped', async () => {
      mockPrisma.workerMetric.updateMany.mockResolvedValue({ count: 2 })

      const count = await tracker.cleanupStaleWorkers(60000)
      expect(count).toBe(2)
    })
  })
})
