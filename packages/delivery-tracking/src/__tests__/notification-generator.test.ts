import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationGenerator } from '../notification-generator'

const mockPrisma = {
  deliveryNotification: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('NotificationGenerator', () => {
  let generator: NotificationGenerator

  beforeEach(() => {
    vi.clearAllMocks()
    generator = new NotificationGenerator(mockPrisma as any, mockLogger as any)
  })

  it('should create a notification', async () => {
    mockPrisma.deliveryNotification.create.mockResolvedValue({
      id: 'notif-1', type: 'test', severity: 'info', title: 'Test', message: 'Test message',
      metadata: {}, acknowledged: false, acknowledgedAt: null, acknowledgedBy: null,
      createdAt: new Date(),
    })

    const result = await generator.notify('test', 'info', 'Test', 'Test message')
    expect(result.title).toBe('Test')
    expect(result.severity).toBe('info')
  })

  it('should create high failure rate notification', async () => {
    mockPrisma.deliveryNotification.create.mockResolvedValue({
      id: 'n1', type: 'high_failure_rate', severity: 'warning',
      title: 'High failure rate for job job-1234', message: 'Job has failed 3 times. Latest error: timeout',
      metadata: { jobId: 'job-12345678', failureCount: 3 }, acknowledged: false,
      acknowledgedAt: null, acknowledgedBy: null, createdAt: new Date(),
    })

    const result = await generator.notifyHighFailureRate('job-12345678', 3, 'timeout')
    expect(result.type).toBe('high_failure_rate')
    expect(result.severity).toBe('warning')
  })

  it('should create dead letter notification', async () => {
    mockPrisma.deliveryNotification.create.mockResolvedValue({
      id: 'n2', type: 'dead_letter', severity: 'error',
      title: 'Job moved to dead letter queue',
      message: 'Job job-1234 has exhausted retries. Reason: max retries',
      metadata: { jobId: 'job-12345678', reason: 'max retries' },
      acknowledged: false, acknowledgedAt: null, acknowledgedBy: null, createdAt: new Date(),
    })

    const result = await generator.notifyDeadLetter('job-12345678', 'max retries')
    expect(result.type).toBe('dead_letter')
    expect(result.severity).toBe('error')
  })

  it('should create queue overflow notification', async () => {
    mockPrisma.deliveryNotification.create.mockResolvedValue({
      id: 'n3', type: 'queue_overflow', severity: 'warning',
      title: 'Queue near capacity', message: 'Queue has 1500 pending jobs, approaching limit.',
      metadata: { jobCount: 1500 }, acknowledged: false,
      acknowledgedAt: null, acknowledgedBy: null, createdAt: new Date(),
    })

    const result = await generator.notifyQueueOverflow(1500)
    expect(result.type).toBe('queue_overflow')
    expect(result.metadata.jobCount).toBe(1500)
  })

  it('should acknowledge a notification', async () => {
    mockPrisma.deliveryNotification.findUnique.mockResolvedValue({
      id: 'notif-1', acknowledged: false,
    })
    mockPrisma.deliveryNotification.update.mockResolvedValue({
      id: 'notif-1', type: 'test', severity: 'info', title: 'Test', message: 'Msg',
      metadata: {}, acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy: 'user-1',
      createdAt: new Date(),
    })

    const result = await generator.acknowledge('notif-1', 'user-1')
    expect(result).not.toBeNull()
    expect(result!.acknowledged).toBe(true)
  })

  it('should return null when acknowledging non-existent notification', async () => {
    mockPrisma.deliveryNotification.findUnique.mockResolvedValue(null)
    const result = await generator.acknowledge('nonexistent', 'user-1')
    expect(result).toBeNull()
  })

  it('should list notifications with filters', async () => {
    mockPrisma.deliveryNotification.findMany.mockResolvedValue([
      { id: 'n1', type: 'high_failure_rate', severity: 'warning', title: 'Test', message: 'Msg',
        metadata: {}, acknowledged: false, acknowledgedAt: null, acknowledgedBy: null, createdAt: new Date() },
    ])
    mockPrisma.deliveryNotification.count.mockResolvedValue(10)

    const result = await generator.getNotifications({ unreadOnly: true, severity: 'warning' })
    expect(result.notifications).toHaveLength(1)
    expect(result.total).toBe(10)
  })
})
