import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { createCampaignExecutionRoutes } from '../routes'
import { ExecutionError } from '@conversation-platform/campaign-executor'

vi.mock('@conversation-platform/auth', () => ({
  authenticate: () => (req: any, _res: any, next: any) => {
    req.auth = { userId: 'user-1', tenantId: 'org-1', role: 'admin' }
    next()
  },
}))

vi.mock('@conversation-platform/database', () => ({
  getPrismaClient: () => ({
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1', organizationId: 'org-1' }),
    },
    campaign: {
      findUnique: vi.fn().mockResolvedValue({ id: 'camp-1', organizationId: 'org-1' }),
    },
    outreachJob: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ id: 'job-1', organizationId: 'org-1' }),
      count: vi.fn().mockResolvedValue(0),
    },
    $disconnect: vi.fn(),
  }),
}))

vi.mock('../../services/outreach.service', () => ({
  MockWhatsAppSender: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
  })),
}))

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
  setLevel: vi.fn(),
  getLevel: vi.fn().mockReturnValue('info'),
}

function createMockConfig() {
  return {
    app: { port: 3000, host: '0.0.0.0', env: 'test', name: 'test', corsOrigins: ['*'], bodyLimit: '1mb' },
    database: { url: 'postgresql://localhost/test' },
    redis: { url: 'redis://localhost:6379', prefix: 'test', ttl: 3600 },
    auth: { jwtSecret: 'test-secret-that-is-long-enough-1234', jwtExpiresIn: 900, refreshSecret: 'test-refresh-secret-long-enough', refreshExpiresIn: 604800, issuer: 'test' },
    logging: { level: 'info', prettyPrint: false, dir: './logs' },
    services: {
      cache: { defaultTTL: 300, checkPeriod: 60 },
      rateLimit: { windowMs: 60000, max: 100 },
      queue: { concurrency: 5, timeout: 30000 },
      events: { maxListeners: 20 },
      s3: { region: 'us-east-1', bucket: 'test', accessKeyId: 'test', secretAccessKey: 'test', endpoint: 'http://localhost:9000' },
      email: { host: 'localhost', port: 1025, secure: false, user: 'test', pass: 'test', from: 'test@test.com' },
      channels: { pollingIntervalMs: 5000, reconnectDelayMs: 10000, healthCheckIntervalMs: 30000 },
      templates: { dir: './templates', cache: true, cacheTTL: 300 },
      outreach: { defaultSender: 'whatsapp', maxBatchSize: 50 },
      monitoring: { enabled: true, interval: 30000 },
    },
    config: { version: '0.1.0' },
  }
}

function createMockExecutor() {
  return {
    executeCampaign: vi.fn().mockResolvedValue({ campaignId: 'camp-1', jobsCreated: 2 }),
    pauseCampaign: vi.fn().mockResolvedValue(undefined),
    resumeCampaign: vi.fn().mockResolvedValue(undefined),
    cancelCampaign: vi.fn().mockResolvedValue(undefined),
    retryJob: vi.fn().mockResolvedValue(undefined),
    retryFailedJobs: vi.fn().mockResolvedValue(3),
    skipJob: vi.fn().mockResolvedValue(undefined),
    getCampaignProgress: vi.fn().mockResolvedValue({
      campaignId: 'camp-1', campaignName: 'Test', status: 'running',
      total: 10, pending: 2, queued: 3, processing: 1, completed: 3, failed: 1,
      retrying: 0, deadLetter: 0, cancelled: 0, progressPercent: 30,
      estimatedCompletionAt: null, averageProcessingTimeMs: 0,
    }),
    getQueueStatus: vi.fn().mockResolvedValue({
      pending: 2, queued: 3, processing: 1, completed: 3, failed: 1,
      retrying: 0, deadLetter: 0, cancelled: 0,
    }),
    getDeadLetterQueue: vi.fn().mockResolvedValue([]),
    getWorkers: vi.fn().mockReturnValue([]),
    getSchedulerState: vi.fn().mockReturnValue({ isRunning: true, isPaused: false, startedAt: null, pausedAt: null, completedJobs: 0, failedJobs: 0, totalJobs: 0, lastTickAt: null }),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  }
}

function createTestApp(mockExecutor: ReturnType<typeof createMockExecutor>) {
  const config = createMockConfig()
  const { router } = createCampaignExecutionRoutes(config as any, mockLogger as any, mockExecutor as any)
  const app = express()
  app.use(express.json())
  app.use('/api/v1/execution', router)
  return app
}

describe('Campaign Execution Routes', () => {
  let mockExecutor: ReturnType<typeof createMockExecutor>

  beforeEach(() => {
    vi.clearAllMocks()
    mockExecutor = createMockExecutor()
  })

  describe('POST /api/v1/execution/campaigns/:id/execute', () => {
    it('should execute a campaign', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app)
        .post('/api/v1/execution/campaigns/camp-1/execute')
        .send({ config: {} })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(mockExecutor.executeCampaign).toHaveBeenCalledWith('camp-1', {})
    })
  })

  describe('POST /api/v1/execution/campaigns/:id/pause', () => {
    it('should pause a campaign', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).post('/api/v1/execution/campaigns/camp-1/pause')
      expect(res.status).toBe(200)
      expect(mockExecutor.pauseCampaign).toHaveBeenCalledWith('camp-1')
    })
  })

  describe('POST /api/v1/execution/campaigns/:id/resume', () => {
    it('should resume a campaign', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).post('/api/v1/execution/campaigns/camp-1/resume')
      expect(res.status).toBe(200)
      expect(mockExecutor.resumeCampaign).toHaveBeenCalledWith('camp-1')
    })
  })

  describe('POST /api/v1/execution/campaigns/:id/cancel', () => {
    it('should cancel a campaign', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).post('/api/v1/execution/campaigns/camp-1/cancel')
      expect(res.status).toBe(200)
      expect(mockExecutor.cancelCampaign).toHaveBeenCalledWith('camp-1')
    })
  })

  describe('GET /api/v1/execution/campaigns/:id/progress', () => {
    it('should get campaign progress', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).get('/api/v1/execution/campaigns/camp-1/progress')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(mockExecutor.getCampaignProgress).toHaveBeenCalledWith('camp-1')
    })
  })

  describe('GET /api/v1/execution/queue/status', () => {
    it('should get queue status', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).get('/api/v1/execution/queue/status')
      expect(res.status).toBe(200)
      expect(res.body.data.queued).toBe(3)
    })
  })

  describe('GET /api/v1/execution/workers', () => {
    it('should get workers', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).get('/api/v1/execution/workers')
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })
  })

  describe('GET /api/v1/execution/scheduler/status', () => {
    it('should get scheduler state', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).get('/api/v1/execution/scheduler/status')
      expect(res.status).toBe(200)
      expect(res.body.data.isRunning).toBe(true)
    })
  })

  describe('POST /api/v1/execution/jobs/:id/retry', () => {
    it('should retry a job', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).post('/api/v1/execution/jobs/job-1/retry')
      expect(res.status).toBe(200)
      expect(mockExecutor.retryJob).toHaveBeenCalledWith('job-1')
    })
  })

  describe('POST /api/v1/execution/jobs/:id/skip', () => {
    it('should skip a job', async () => {
      const app = createTestApp(mockExecutor)
      const res = await request(app).post('/api/v1/execution/jobs/job-1/skip')
      expect(res.status).toBe(200)
      expect(mockExecutor.skipJob).toHaveBeenCalledWith('job-1')
    })
  })

  describe('POST /api/v1/execution/jobs/retry-failed', () => {
    it('should retry all failed jobs', async () => {
      const res = await request(createTestApp(mockExecutor))
        .post('/api/v1/execution/jobs/retry-failed')
        .send({ campaignId: 'camp-1' })
      expect(res.status).toBe(200)
      expect(res.body.data.count).toBe(3)
    })

    it('should require campaignId', async () => {
      const res = await request(createTestApp(mockExecutor))
        .post('/api/v1/execution/jobs/retry-failed')
        .send({})
      expect(res.status).toBe(400)
    })
  })

  describe('error handling', () => {
    it('should return ExecutionError with correct status', async () => {
      mockExecutor.executeCampaign.mockRejectedValue(new ExecutionError('Campaign not found', 'NOT_FOUND', 404))
      const res = await request(createTestApp(mockExecutor))
        .post('/api/v1/execution/campaigns/nonexistent/execute')
        .send({ config: {} })
      expect(res.status).toBe(404)
      expect(res.body.code).toBe('NOT_FOUND')
    })
  })
})
