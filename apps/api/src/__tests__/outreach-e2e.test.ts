import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';

class MockRepo {
  constructor(_prisma: any) {}
  create(..._args: any[]) { return Promise.resolve({}); }
  findMany(..._args: any[]) { return Promise.resolve([]); }
  findUnique(..._args: any[]) { return Promise.resolve(null); }
  findFirst(..._args: any[]) { return Promise.resolve(null); }
  update(..._args: any[]) { return Promise.resolve({}); }
  delete(..._args: any[]) { return Promise.resolve({}); }
  remove(..._args: any[]) { return Promise.resolve({}); }
  count(..._args: any[]) { return Promise.resolve(0); }
}

class MockOutreachRepo extends MockRepo {
  private jobs: Record<string, any> = {};
  private counter = 0;

  override create(data: any) {
    this.counter++;
    const id = `job_${this.counter}`;
    const job = { id, ...data, status: 'pending', attempts: 0, maxAttempts: 3, createdAt: new Date(), updatedAt: new Date() };
    this.jobs[id] = job;
    return Promise.resolve(job);
  }
  findById(id: string) {
    return Promise.resolve(this.jobs[id] ?? null);
  }
  findByTenant() {
    return Promise.resolve(Object.values(this.jobs));
  }
  countByTenant() {
    return Promise.resolve(Object.keys(this.jobs).length);
  }
}

vi.mock('@conversation-platform/database', () => {
  const jobs: Record<string, any> = {};
  let counter = 0;

  return {
    getPrismaClient: () => ({
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      $disconnect: vi.fn(),
      outreachJob: {
        findUnique: vi.fn().mockImplementation(({ where: { id } }: any) => jobs[id] ?? null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation((data: any) => {
          counter++;
          const id = `job_${counter}`;
          const job = {
            id,
            ...data.data,
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          jobs[id] = job;
          return job;
        }),
        update: vi.fn().mockImplementation(({ where: { id }, data }: any) => {
          if (jobs[id]) {
            jobs[id] = { ...jobs[id], ...data, updatedAt: new Date() };
          }
          return jobs[id] ?? null;
        }),
        count: vi.fn().mockResolvedValue(0),
      },
    }),
    PrismaClient: vi.fn(),
    OutreachJobRepository: MockOutreachRepo,
    BaseRepository: class {
      constructor(_prisma: any) {}
    },
    TenantRepository: MockRepo,
    UserRepository: MockRepo,
    SessionRepository: MockRepo,
    AuditLogRepository: MockRepo,
    ApiKeyRepository: MockRepo,
    ChannelConnectionRepository: MockRepo,
    IntegrationRepository: MockRepo,
    IntegrationLogRepository: MockRepo,
    IntegrationUsageRepository: MockRepo,
    ConversationRepository: MockRepo,
    MessageRepository: MockRepo,
    WebhookRepository: MockRepo,
  };
});

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  fatal: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnValue({} as Logger),
  setLevel: vi.fn(),
  getLevel: vi.fn().mockReturnValue('info'),
};

const mockConfig: AppConfig = {
  env: 'test',
  name: 'test',
  version: '0.1.0',
  port: 0,
  host: 'localhost',
  log: { level: 'info', pretty: false },
  database: { url: 'postgresql://localhost:5432/test', maxConnections: 5 },
  redis: { url: 'redis://localhost:6379', prefix: 'cp:' },
  cors: { origins: ['*'], methods: ['*'] },
  auth: { jwtSecret: 'test-secret', jwtExpiresIn: '1h', refreshSecret: 'test-refresh-secret', refreshExpiresIn: '7d', bcryptRounds: 10, issuer: 'test' },
  rateLimit: { windowMs: 60000, maxRequests: 1000 },
  storage: { provider: 'local', localPath: '/tmp/test' },
  ai: {
    defaultProvider: 'openai', defaultModel: 'gpt-4o-mini', maxRetries: 3, retryDelayMs: 1000,
    timeout: 60000, maxTokensPerRequest: 4096, trackCost: false,
    ollamaBaseUrl: 'http://localhost:11434',
  },
};

describe('Outreach API E2E', () => {
  let app: any;

  beforeAll(async () => {
    const { createApp } = await import('../app');
    app = createApp(mockConfig, mockLogger);
  });

  it('POST /api/v1/outreach/send creates an outreach job', async () => {
    const res = await request(app)
      .post('/api/v1/outreach/send')
      .send({
        recipientName: 'John Doe',
        recipientPhone: '+1234567890',
        messageTemplate: 'Hi {{name}}, check out {{product}}!',
        personalizedMessage: 'Hi John, check out our new AI platform!',
        metadata: { campaign: 'product_launch', product: 'AI Platform' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBeDefined();
  });

  it('POST /api/v1/outreach/send rejects invalid phone', async () => {
    const res = await request(app)
      .post('/api/v1/outreach/send')
      .send({
        recipientName: 'John Doe',
        recipientPhone: 'not-a-phone',
        messageTemplate: 'Hi {{name}}',
        personalizedMessage: 'Hi John',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('phone');
  });

  it('POST /api/v1/outreach/send requires all mandatory fields', async () => {
    const res = await request(app)
      .post('/api/v1/outreach/send')
      .send({ recipientName: 'John' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/outreach/jobs returns job list', async () => {
    const res = await request(app).get('/api/v1/outreach/jobs');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
  });

  it('GET /api/v1/outreach/jobs/:id returns 404 for unknown job', async () => {
    const res = await request(app).get('/api/v1/outreach/jobs/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Outreach job not found');
  });
});
