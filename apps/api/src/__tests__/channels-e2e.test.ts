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
  remove() { return Promise.resolve({}); }
  upsert() { return Promise.resolve({}); }
  save() { return Promise.resolve({}); }
  count() { return Promise.resolve(0); }
}

vi.mock('@conversation-platform/database', () => ({
  getPrismaClient: () => ({
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    $disconnect: vi.fn(),
    channelConnection: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data: any) => ({ id: 'mock-id', ...data.data, createdAt: new Date(), updatedAt: new Date() })),
      update: vi.fn().mockImplementation((data: any) => ({ ...data.data, id: data.where.id })),
      delete: vi.fn().mockResolvedValue({}),
    },
    integration: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data: any) => ({ id: 'int-id', ...data.data, createdAt: new Date(), updatedAt: new Date() })),
      update: vi.fn().mockImplementation((data: any) => ({ ...data.data, id: data.where.id })),
      delete: vi.fn().mockResolvedValue({}),
    },
    integrationLog: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((data: any) => ({ id: 'log-id', ...data.data })),
    },
    integrationUsage: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockImplementation((data: any) => ({ id: 'usage-id', ...data.create })),
    },
    webhook: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data: any) => ({ id: 'wh-id', ...data.data, createdAt: new Date(), updatedAt: new Date() })),
      update: vi.fn().mockImplementation((data: any) => ({ ...data.data, id: data.where.id })),
      delete: vi.fn().mockResolvedValue({}),
    },
    conversation: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data: any) => ({ id: 'conv-id', ...data.data, createdAt: new Date(), updatedAt: new Date() })),
      update: vi.fn().mockImplementation((data: any) => ({ ...data.data, id: data.where.id })),
    },
    message: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((data: any) => ({ id: 'msg-id', ...data.data, createdAt: new Date() })),
    },
    apiKey: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((data: any) => ({ id: 'ak-id', ...data.data })),
      update: vi.fn().mockImplementation((data: any) => ({ ...data.data, id: data.where.id })),
    },
  }),
  PrismaClient: vi.fn(),
  BaseRepository: MockRepository,
  ChannelConnectionRepository: MockRepository,
  IntegrationRepository: MockRepository,
  IntegrationLogRepository: MockRepository,
  IntegrationUsageRepository: MockRepository,
  WebhookRepository: MockRepository,
  ConversationRepository: MockRepository,
  MessageRepository: MockRepository,
  ApiKeyRepository: MockRepository,
  OutreachJobRepository: MockRepository,
}));

const mockChannelImpl = {
  sendMessage: vi.fn().mockResolvedValue('mock-msg-id'),
  processIncoming: vi.fn().mockResolvedValue([{ id: 'mock-msg-1', type: 'text', content: 'Hello', from: '123', channelType: 'whatsapp', channelId: 'ch-1', tenantId: 'default', timestamp: new Date().toISOString(), metadata: {} }]),
  displayName: 'Mock Channel',
  validateConfig: vi.fn().mockReturnValue([]),
  connect: vi.fn().mockResolvedValue({ status: 'connected', config: {} }),
  disconnect: vi.fn().mockResolvedValue(undefined),
  healthCheck: vi.fn().mockResolvedValue({ status: 'healthy', uptimeMs: 1000 }),
  sendTypingIndicator: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@conversation-platform/channel-service', () => ({
  ChannelOrchestrator: vi.fn().mockImplementation(() => ({
    registry: {
      register: vi.fn(),
      getImplementation: vi.fn().mockReturnValue(mockChannelImpl),
      listImplementations: vi.fn().mockReturnValue(['whatsapp', 'website']),
      get: vi.fn().mockReturnValue({ status: 'connected', channel: { sendTypingIndicator: vi.fn().mockResolvedValue(undefined) } }),
    },
    manager: {
      connect: vi.fn().mockResolvedValue({ status: 'connected' }),
      disconnect: vi.fn().mockResolvedValue(undefined),
      reconnect: vi.fn().mockResolvedValue(undefined),
      listChannels: vi.fn().mockReturnValue([]),
      getHealth: vi.fn().mockResolvedValue({ status: 'healthy', uptimeMs: 1000 }),
      updateConfig: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn(),
    },
    configLoader: { set: vi.fn(), get: vi.fn().mockReturnValue({}), remove: vi.fn(), clear: vi.fn() },
    registerChannelImplementation: vi.fn(),
    connectChannel: vi.fn().mockResolvedValue({ status: 'connected' }),
    disconnectChannel: vi.fn().mockResolvedValue(undefined),
    reconnectChannel: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue('mock-msg-id'),
    sendTypingIndicator: vi.fn().mockResolvedValue(undefined),
    processIncomingPayload: vi.fn().mockResolvedValue([{ id: 'mock-msg-1', content: 'Hello', from: '123', channelType: 'whatsapp', timestamp: new Date().toISOString() }]),
    getConnectedChannels: vi.fn().mockReturnValue([]),
    getConnectedChannelsFromDb: vi.fn().mockResolvedValue(undefined),
    getChannelHealth: vi.fn().mockResolvedValue(null),
    getChannelStatus: vi.fn().mockReturnValue(null),
    updateChannelConfig: vi.fn().mockResolvedValue(undefined),
    listRegisteredImplementations: vi.fn().mockReturnValue(['whatsapp', 'website']),
    dispose: vi.fn(),
  })),
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

describe('Channels E2E', () => {
  let app: any;

  beforeAll(async () => {
    const { createApp } = await import('../app');
    app = createApp(mockConfig, mockLogger);
  });

  it('GET /api/v1/channels returns channel list', async () => {
    const res = await request(app).get('/api/v1/channels');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/channels/implementations returns available channel types', async () => {
    const res = await request(app).get('/api/v1/channels/implementations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/channels/:type/webhook processes incoming webhook payload', async () => {
    const payload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '123',
              text: { body: 'Hello' },
              id: 'msg-1',
              timestamp: Date.now().toString(),
            }],
          },
        }],
      }],
    };
    const res = await request(app)
      .post('/api/v1/channels/whatsapp/webhook')
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/messages/send sends a message', async () => {
    const res = await request(app)
      .post('/api/v1/messages/send')
      .send({ channelType: 'website', message: { conversationId: 'conv-1', content: 'Hello world', type: 'text', role: 'user' } });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messageId).toBeDefined();
  });

  it('POST /api/v1/messages/broadcast sends to multiple channels', async () => {
    const res = await request(app)
      .post('/api/v1/messages/broadcast')
      .send({ message: { conversationId: 'conv-1', content: 'Broadcast', type: 'text', role: 'user' }, channelTypes: ['website', 'whatsapp'] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('POST /api/v1/messages/incoming processes incoming message', async () => {
    const res = await request(app)
      .post('/api/v1/messages/incoming')
      .send({ channelType: 'website', payload: { text: 'Hello', userId: 'user-1' } });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('Webhooks E2E', () => {
  let app: any;

  beforeAll(async () => {
    const { createApp } = await import('../app');
    app = createApp(mockConfig, mockLogger);
  });

  it('GET /api/v1/webhooks returns webhook list', async () => {
    const res = await request(app).get('/api/v1/webhooks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/webhooks registers a new webhook', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .send({ name: 'Test Webhook', url: 'https://example.com/webhook', events: ['message.received'] });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.config.url).toBe('https://example.com/webhook');
  });

  it('POST /api/v1/webhooks/test dispatches a test event', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/test')
      .send({ type: 'test.event', payload: { test: true } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/webhooks/stats returns webhook stats', async () => {
    const res = await request(app).get('/api/v1/webhooks/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Integrations E2E', () => {
  let app: any;

  beforeAll(async () => {
    const { createApp } = await import('../app');
    app = createApp(mockConfig, mockLogger);
  });

  it('GET /api/v1/integrations returns integration list', async () => {
    const res = await request(app).get('/api/v1/integrations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/integrations creates a new integration', async () => {
    const res = await request(app)
      .post('/api/v1/integrations')
      .send({ channelType: 'whatsapp', name: 'WhatsApp Prod', settings: { phoneNumberId: '123' } });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.channelType).toBe('whatsapp');
  });

  it('POST /api/v1/integrations/api-keys creates an API key', async () => {
    const res = await request(app)
      .post('/api/v1/integrations/api-keys')
      .send({ name: 'Test Key', scopes: ['messages:send'] });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.key).toBeDefined();
    expect(res.body.data.rawKey).toBeDefined();
  });

  it('GET /api/v1/integrations/api-keys lists API keys', async () => {
    const res = await request(app).get('/api/v1/integrations/api-keys');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/integrations/stats returns integration stats', async () => {
    const res = await request(app).get('/api/v1/integrations/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/webhooks/failures returns recent failures', async () => {
    const res = await request(app).get('/api/v1/webhooks/failures');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
