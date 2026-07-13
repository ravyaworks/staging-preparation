import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeliveryTracker } from '../delivery-tracker'

const mockPrisma = {
  deliveryEvent: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
}

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('DeliveryTracker', () => {
  let tracker: DeliveryTracker

  beforeEach(() => {
    vi.clearAllMocks()
    tracker = new DeliveryTracker(mockPrisma as any, mockLogger as any)
  })

  describe('recordEvent', () => {
    it('should create a delivery event', async () => {
      const mockEvent = {
        id: 'evt-1',
        jobId: 'job-1',
        type: 'job.queued',
        previousStatus: 'pending',
        currentStatus: 'queued',
        timestamp: new Date(),
        workerId: null,
        channel: null,
        metadata: {},
      }
      mockPrisma.deliveryEvent.create.mockResolvedValue(mockEvent)

      const result = await tracker.recordEvent('job-1', 'job.queued', 'queued', 'pending')

      expect(result).toMatchObject({
        id: 'evt-1',
        jobId: 'job-1',
        type: 'job.queued',
        currentStatus: 'queued',
      })
      expect(mockPrisma.deliveryEvent.create).toHaveBeenCalledWith({
        data: {
          jobId: 'job-1',
          type: 'job.queued',
          previousStatus: 'pending',
          currentStatus: 'queued',
          workerId: null,
          channel: null,
          metadata: {},
        },
      })
    })

    it('should record event with metadata', async () => {
      mockPrisma.deliveryEvent.create.mockResolvedValue({
        id: 'evt-2', jobId: 'job-1', type: 'job.sent', previousStatus: 'processing',
        currentStatus: 'sent', timestamp: new Date(), workerId: 'w1', channel: 'whatsapp',
        metadata: { messageId: 'msg-1' },
      })

      const result = await tracker.recordEvent('job-1', 'job.sent', 'sent', 'processing', {
        workerId: 'w1',
        channel: 'whatsapp',
        metadata: { messageId: 'msg-1' },
      })

      expect(result.workerId).toBe('w1')
      expect(result.channel).toBe('whatsapp')
    })
  })

  describe('recordTransition', () => {
    it('should map pending->queued to job.queued', async () => {
      mockPrisma.deliveryEvent.create.mockResolvedValue({
        id: 'evt-3', jobId: 'job-1', type: 'job.queued', previousStatus: 'pending',
        currentStatus: 'queued', timestamp: new Date(), workerId: null, channel: null, metadata: {},
      })

      const result = await tracker.recordTransition('job-1', 'pending', 'queued')
      expect(result.type).toBe('job.queued')
    })

    it('should map processing->failed to job.failed', async () => {
      mockPrisma.deliveryEvent.create.mockResolvedValue({
        id: 'evt-4', jobId: 'job-1', type: 'job.failed', previousStatus: 'processing',
        currentStatus: 'failed', timestamp: new Date(), workerId: null, channel: null, metadata: {},
      })

      const result = await tracker.recordTransition('job-1', 'processing', 'failed')
      expect(result.type).toBe('job.failed')
    })

    it('should map failed->retrying to job.retrying', async () => {
      mockPrisma.deliveryEvent.create.mockResolvedValue({
        id: 'evt-5', jobId: 'job-1', type: 'job.retrying', previousStatus: 'failed',
        currentStatus: 'retrying', timestamp: new Date(), workerId: null, channel: null, metadata: {},
      })

      const result = await tracker.recordTransition('job-1', 'failed', 'retrying')
      expect(result.type).toBe('job.retrying')
    })

    it('should map retrying->dead_letter to job.dead_letter', async () => {
      mockPrisma.deliveryEvent.create.mockResolvedValue({
        id: 'evt-6', jobId: 'job-1', type: 'job.dead_letter', previousStatus: 'retrying',
        currentStatus: 'dead_letter', timestamp: new Date(), workerId: null, channel: null, metadata: {},
      })

      const result = await tracker.recordTransition('job-1', 'retrying', 'dead_letter')
      expect(result.type).toBe('job.dead_letter')
    })
  })

  describe('getJobTimeline', () => {
    it('should return ordered timeline with durations', async () => {
      const t1 = new Date('2026-01-01T00:00:00Z')
      const t2 = new Date('2026-01-01T00:00:05Z')
      const t3 = new Date('2026-01-01T00:00:10Z')

      mockPrisma.deliveryEvent.findMany.mockResolvedValue([
        { id: 'e1', jobId: 'job-1', type: 'job.queued', previousStatus: 'pending', currentStatus: 'queued', timestamp: t1, workerId: null },
        { id: 'e2', jobId: 'job-1', type: 'job.processing', previousStatus: 'queued', currentStatus: 'processing', timestamp: t2, workerId: 'w1' },
        { id: 'e3', jobId: 'job-1', type: 'job.completed', previousStatus: 'processing', currentStatus: 'completed', timestamp: t3, workerId: 'w1' },
      ])

      const timeline = await tracker.getJobTimeline('job-1')

      expect(timeline).toHaveLength(3)
      expect(timeline[0].durationFromPreviousMs).toBeNull()
      expect(timeline[1].durationFromPreviousMs).toBe(5000)
      expect(timeline[2].durationFromPreviousMs).toBe(5000)
      expect(timeline[1].workerId).toBe('w1')
    })

    it('should return empty array for job with no events', async () => {
      mockPrisma.deliveryEvent.findMany.mockResolvedValue([])
      const timeline = await tracker.getJobTimeline('job-1')
      expect(timeline).toEqual([])
    })
  })

  describe('getJobEvents', () => {
    it('should return paginated events', async () => {
      mockPrisma.deliveryEvent.findMany.mockResolvedValue([
        { id: 'e1', jobId: 'job-1', type: 'job.queued', previousStatus: null, currentStatus: 'queued', timestamp: new Date(), workerId: null, channel: null, metadata: {} },
      ])
      mockPrisma.deliveryEvent.count.mockResolvedValue(10)

      const result = await tracker.getJobEvents('job-1', 1, 0)
      expect(result.events).toHaveLength(1)
      expect(result.total).toBe(10)
    })
  })

  describe('getJobLatestEvent', () => {
    it('should return most recent event', async () => {
      mockPrisma.deliveryEvent.findFirst.mockResolvedValue({
        id: 'e3', jobId: 'job-1', type: 'job.completed', previousStatus: 'processing',
        currentStatus: 'completed', timestamp: new Date(), workerId: 'w1', channel: null, metadata: {},
      })

      const result = await tracker.getJobLatestEvent('job-1')
      expect(result?.type).toBe('job.completed')
    })

    it('should return null if no events', async () => {
      mockPrisma.deliveryEvent.findFirst.mockResolvedValue(null)
      const result = await tracker.getJobLatestEvent('job-1')
      expect(result).toBeNull()
    })
  })
})
