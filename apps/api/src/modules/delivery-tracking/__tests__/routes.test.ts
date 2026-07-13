import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { createDeliveryTrackingRoutes } from '../routes'

vi.mock('@conversation-platform/auth', () => ({
  authenticate: () => (req: any, _res: any, next: any) => {
    req.auth = { userId: 'user-1', tenantId: 'org-1', role: 'admin' }
    next()
  },
}))

vi.mock('@conversation-platform/database', () => ({
  getPrismaClient: () => ({
    deliveryEvent: {
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({
        id: 'evt-1', ...data, timestamp: new Date(),
      })),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
    },
    jobFailure: {
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({
        id: 'fail-1', ...data, createdAt: new Date(),
      })),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'fail-1', ...data })),
      count: vi.fn().mockResolvedValue(0),
    },
    workerMetric: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({
        ...data, lastHeartbeatAt: new Date(), startedAt: new Date(),
      })),
      update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ workerId: 'w1', ...data })),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    deliveryNotification: {
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({
        id: 'notif-1', ...data, createdAt: new Date(),
      })),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'notif-1', ...data })),
      count: vi.fn().mockResolvedValue(0),
    },
    outreachJob: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
    },
    campaign: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $disconnect: vi.fn(),
  }),
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
    },
    organization: { maxTenants: 50, defaultRole: 'member', maxUsersPerTenant: 100 },
    security: { bcryptRounds: 10, sessionMaxAge: 86400, mfaEnabled: false, maxLoginAttempts: 5, lockoutDuration: 900 },
    features: { enableSignup: true, enablePasswordReset: true, enableApiKeys: true },
  }
}

describe('Delivery Tracking API Routes', () => {
  let app: express.Express

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    const router = createDeliveryTrackingRoutes(createMockConfig() as any, mockLogger as any)
    app.use('/api/v1/delivery', router)
  })

  describe('GET /api/v1/delivery/jobs', () => {
    it('should return empty job list', async () => {
      const res = await request(app).get('/api/v1/delivery/jobs')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.items).toEqual([])
    })
  })

  describe('GET /api/v1/delivery/jobs/:id', () => {
    it('should return 404 for unknown job', async () => {
      const res = await request(app).get('/api/v1/delivery/jobs/unknown-job')
      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('Job not found')
    })
  })

  describe('GET /api/v1/delivery/jobs/:id/timeline', () => {
    it('should return empty timeline for unknown job', async () => {
      const res = await request(app).get('/api/v1/delivery/jobs/unknown-job/timeline')
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })
  })

  describe('GET /api/v1/delivery/failures', () => {
    it('should return unresolved failures', async () => {
      const res = await request(app).get('/api/v1/delivery/failures')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/delivery/failures/stats', () => {
    it('should return failure stats', async () => {
      const res = await request(app).get('/api/v1/delivery/failures/stats')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/delivery/analytics/delivery', () => {
    it('should return delivery analytics', async () => {
      const res = await request(app).get('/api/v1/delivery/analytics/delivery')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/delivery/analytics/queue-health', () => {
    it('should return queue health', async () => {
      const res = await request(app).get('/api/v1/delivery/analytics/queue-health')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/delivery/workers', () => {
    it('should return worker list', async () => {
      const res = await request(app).get('/api/v1/delivery/workers')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/delivery/notifications', () => {
    it('should return notifications', async () => {
      const res = await request(app).get('/api/v1/delivery/notifications')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('POST /api/v1/delivery/events', () => {
    it('should record a delivery event', async () => {
      const res = await request(app)
        .post('/api/v1/delivery/events')
        .send({ jobId: 'job-1', eventType: 'job.queued', currentStatus: 'queued' })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
    })

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/delivery/events')
        .send({ jobId: 'job-1' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/delivery/notifications/:id/acknowledge', () => {
    it('should return 404 for unknown notification', async () => {
      const res = await request(app).post('/api/v1/delivery/notifications/unknown/acknowledge')
      expect(res.status).toBe(404)
    })
  })
})
