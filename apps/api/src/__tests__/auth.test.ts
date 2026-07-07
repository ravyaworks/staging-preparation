import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  passwordHash: '',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  isVerified: false,
  tenantId: 'tenant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTenant = {
  id: 'tenant-1',
  name: 'Test Tenant',
  slug: 'test-tenant',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSession = {
  id: 'session-1',
  token: 'session-token',
  refreshToken: 'refresh-token-value',
  isActive: true,
  expiresAt: new Date(Date.now() + 86400000),
  userId: 'user-1',
  createdAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockUser),
    update: vi.fn().mockResolvedValue(mockUser),
    count: vi.fn().mockResolvedValue(0),
  },
  tenant: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockTenant),
  },
  session: {
    create: vi.fn().mockResolvedValue(mockSession),
    findUnique: vi.fn().mockResolvedValue(mockSession),
    update: vi.fn().mockResolvedValue(mockSession),
  },
  role: { findFirst: vi.fn().mockResolvedValue(null) },
  userRole: { create: vi.fn().mockResolvedValue({}) },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
  $disconnect: vi.fn(),
  $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
};

vi.mock('@conversation-platform/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@conversation-platform/database')>();
  return {
    ...actual,
    getPrismaClient: () => mockPrisma,
  };
});

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
};

describe('Auth API', () => {
  let app: ReturnType<typeof import('express')>;

  beforeAll(async () => {
    const mod = await import('../app');
    app = mod.createApp(mockConfig, mockLogger);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/v1/auth/register - valid registration', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    mockPrisma.tenant.create.mockResolvedValue(mockTenant);
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.session.create.mockResolvedValue(mockSession);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'new@test.com',
        password: 'StrongPass1',
        firstName: 'New',
        lastName: 'User',
        tenantName: 'New Tenant',
        tenantSlug: 'new-tenant',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('POST /api/v1/auth/register - duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'existing@test.com',
        password: 'StrongPass1',
        firstName: 'New',
        lastName: 'User',
        tenantName: 'New Tenant',
        tenantSlug: 'new-tenant',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login - valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      passwordHash: '$2b$12$5kfZ22tBO4RTDmuvs3npmOwKErKgUjMsuGm9LkDNp.9Y3zBQL8BGC',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'StrongPass1' });

    expect(res.status).toBe(200);
  });

  it('POST /api/v1/auth/login - wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      passwordHash: '$2b$12$5kfZ22tBO4RTDmuvs3npmOwKErKgUjMsuGm9LkDNp.9Y3zBQL8BGC',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/forgot-password - returns generic message', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('If the email exists');
  });
});
