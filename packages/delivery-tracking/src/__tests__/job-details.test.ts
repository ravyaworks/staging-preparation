import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JobDetailsService } from '../job-details'
import { DeliveryTracker } from '../delivery-tracker'
import { FailureTracker } from '../failure-tracker'

const mockPrisma = {
  outreachJob: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  deliveryEvent: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  jobFailure: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('JobDetailsService', () => {
  let service: JobDetailsService
  let tracker: DeliveryTracker
  let failureTracker: FailureTracker

  beforeEach(() => {
    vi.clearAllMocks()
    tracker = new DeliveryTracker(mockPrisma as any, mockLogger as any)
    failureTracker = new FailureTracker(mockPrisma as any, mockLogger as any)
    service = new JobDetailsService(mockPrisma as any, tracker, failureTracker, mockLogger as any)
  })

  describe('getJobDetails', () => {
    it('should return null for non-existent job', async () => {
      mockPrisma.outreachJob.findUnique.mockResolvedValue(null)
      const result = await service.getJobDetails('nonexistent')
      expect(result).toBeNull()
    })

    it('should return full job details with timeline and failures', async () => {
      const t1 = new Date('2026-01-01T00:00:00Z')
      const t2 = new Date('2026-01-01T00:01:00Z')
      const t3 = new Date('2026-01-01T00:02:00Z')

      mockPrisma.outreachJob.findUnique.mockResolvedValue({
        id: 'job-1', recipientName: 'Alice', recipientPhone: '+1234567890',
        messageTemplate: 'Hello {{name}}', personalizedMessage: 'Hello Alice',
        status: 'completed', attempts: 1, maxAttempts: 3, lastError: null,
        senderResult: { messageId: 'msg-1' }, scheduledAt: null,
        processedAt: t3, createdAt: t1, updatedAt: t3,
        campaignId: 'camp-1', campaign: { name: 'Summer Sale', channel: 'whatsapp' },
      })

      mockPrisma.deliveryEvent.findMany.mockResolvedValue([
        { id: 'e1', jobId: 'job-1', type: 'job.queued', previousStatus: 'pending', currentStatus: 'queued', timestamp: t1, workerId: null },
        { id: 'e2', jobId: 'job-1', type: 'job.processing', previousStatus: 'queued', currentStatus: 'processing', timestamp: t2, workerId: 'w1' },
        { id: 'e3', jobId: 'job-1', type: 'job.completed', previousStatus: 'processing', currentStatus: 'completed', timestamp: t3, workerId: 'w1' },
      ])

      mockPrisma.jobFailure.findMany.mockResolvedValue([])

      const result = await service.getJobDetails('job-1')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('job-1')
      expect(result!.status).toBe('completed')
      expect(result!.campaignName).toBe('Summer Sale')
      expect(result!.channel).toBe('whatsapp')
      expect(result!.timeline).toHaveLength(3)
      expect(result!.failures).toHaveLength(0)
      expect(result!.processingDurationMs).toBe(120000)
      expect(result!.queueWaitTimeMs).toBe(60000)
      expect(result!.currentWorkerId).toBe('w1')
    })
  })

  describe('listJobs', () => {
    it('should return paginated job list', async () => {
      const t = new Date()
      mockPrisma.outreachJob.findMany.mockResolvedValue([
        { id: 'job-1', recipientName: 'Alice', recipientPhone: '+123', messageTemplate: 'Hi', personalizedMessage: 'Hi A', status: 'completed', attempts: 1, maxAttempts: 3, lastError: null, senderResult: {}, scheduledAt: null, processedAt: t, createdAt: t, updatedAt: t, campaignId: null, campaign: null },
      ])
      mockPrisma.outreachJob.count.mockResolvedValue(10)
      mockPrisma.deliveryEvent.findMany.mockResolvedValue([])
      mockPrisma.jobFailure.findMany.mockResolvedValue([])

      const result = await service.listJobs({ page: 1, limit: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
    })

    it('should filter by status', async () => {
      mockPrisma.outreachJob.findMany.mockResolvedValue([])
      mockPrisma.outreachJob.count.mockResolvedValue(0)

      await service.listJobs({ status: 'failed' })

      expect(mockPrisma.outreachJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'failed' }),
        }),
      )
    })
  })
})
