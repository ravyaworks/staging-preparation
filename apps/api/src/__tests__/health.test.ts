import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';

class MockRepository {
  constructor(_prisma: any) {}
  create() { return Promise.resolve({}); }
  findMany() { return Promise.resolve([]); }
  findUnique() { return Promise.resolve(null); }
  findFirst() { return Promise.resolve(null); }
  update() { return Promise.resolve({}); }
  delete() { return Promise.resolve({}); }
}

vi.mock('@conversation-platform/database', () => ({
  getPrismaClient: () => ({
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    $disconnect: vi.fn(),
  }),
  PrismaClient: vi.fn(),
  ChannelConnectionRepository: MockRepository,
  IntegrationRepository: MockRepository,
  IntegrationLogRepository: MockRepository,
  IntegrationUsageRepository: MockRepository,
  WebhookRepository: MockRepository,
  ConversationRepository: MockRepository,
  MessageRepository: MockRepository,
  ApiKeyRepository: MockRepository,
}));

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
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
  redis: { url: 'redis://localhost:6379', prefix: 'test:' },
  auth: {
    jwtSecret: 'test-secret-that-is-at-least-32-characters-long!!',
    jwtExpiresIn: '15m',
    refreshSecret: 'test-refresh-secret-at-least-32-characters!!',
    refreshExpiresIn: '7d',
    bcryptRounds: 10,
    issuer: 'test',
  },
  cors: { origins: ['*'], methods: ['GET', 'POST'] },
  rateLimit: { windowMs: 60000, maxRequests: 1000 },
  storage: { provider: 'local', localPath: './uploads' },
  ai: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    maxRetries: 3,
    retryDelayMs: 1000,
    timeout: 60000,
    maxTokensPerRequest: 4096,
    trackCost: true,
    ollamaBaseUrl: 'http://localhost:11434',
  },
};

describe('Health API', () => {
  let app: ReturnType<typeof import('express')>;

  beforeAll(async () => {
    const mod = await import('../app');
    app = mod.createApp(mockConfig, mockLogger);
  });

  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/health/ready returns db status', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data.database).toBe('connected');
  });

  it('GET /api/v1/health/live returns ok', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
