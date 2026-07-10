import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { ApiKeyRepository } from '../repositories/api-key.repository';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository';
import { IntegrationRepository } from '../repositories/integration.repository';
import { IntegrationLogRepository } from '../repositories/integration-log.repository';
import { IntegrationUsageRepository } from '../repositories/integration-usage.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { WebhookRepository } from '../repositories/webhook.repository';
import { BaseRepository } from '../repositories/base';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

const mockPrisma = {} as PrismaClient;

function mockModel(methods: Record<string, unknown>) {
  return methods;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BaseRepository', () => {
  it('should construct with prisma client', () => {
    class TestRepo extends BaseRepository {
      getPrisma() { return this.prisma; }
    }
    const repo = new TestRepo(mockPrisma);
    expect(repo.getPrisma()).toBe(mockPrisma);
  });

  it('execute should return operation result', async () => {
    class TestRepo extends BaseRepository {
      async test() { return this.execute(() => Promise.resolve('ok')); }
    }
    const repo = new TestRepo(mockPrisma);
    await expect(repo.test()).resolves.toBe('ok');
  });

  it('execute should throw operation error', async () => {
    class TestRepo extends BaseRepository {
      async test() { return this.execute(() => Promise.reject(new Error('fail'))); }
    }
    const repo = new TestRepo(mockPrisma);
    await expect(repo.test()).rejects.toThrow('fail');
  });
});

describe('TenantRepository', () => {
  let repo: TenantRepository;
  const mockDb = {
    tenant: mockModel({
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new TenantRepository(mockDb as unknown as PrismaClient);
  });

  it('findById calls findUnique with id and deletedAt filter', async () => {
    mockDb.tenant.findUnique.mockResolvedValue({ id: 't1' });
    const result = await repo.findById('t1');
    expect(mockDb.tenant.findUnique).toHaveBeenCalledWith({ where: { id: 't1', deletedAt: null } });
    expect(result).toEqual({ id: 't1' });
  });

  it('findBySlug calls findUnique with slug and deletedAt filter', async () => {
    mockDb.tenant.findUnique.mockResolvedValue({ id: 't1', slug: 'acme' });
    const result = await repo.findBySlug('acme');
    expect(mockDb.tenant.findUnique).toHaveBeenCalledWith({ where: { slug: 'acme', deletedAt: null } });
    expect(result).toEqual({ id: 't1', slug: 'acme' });
  });

  it('findMany calls findMany with deletedAt filter', async () => {
    mockDb.tenant.findMany.mockResolvedValue([{ id: 't1' }]);
    const result = await repo.findMany({ skip: 0, take: 10 });
    expect(mockDb.tenant.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('create delegates to prisma', async () => {
    const data = { name: 'Acme', slug: 'acme' };
    mockDb.tenant.create.mockResolvedValue({ id: 't1', ...data });
    const result = await repo.create(data as any);
    expect(mockDb.tenant.create).toHaveBeenCalledWith({ data });
    expect(result).toEqual({ id: 't1', ...data });
  });

  it('update delegates to prisma', async () => {
    const data = { name: 'Acme Corp' };
    mockDb.tenant.update.mockResolvedValue({ id: 't1', ...data });
    const result = await repo.update('t1', data as any);
    expect(mockDb.tenant.update).toHaveBeenCalledWith({ where: { id: 't1' }, data });
    expect(result).toEqual({ id: 't1', ...data });
  });

  it('softDelete sets deletedAt', async () => {
    mockDb.tenant.update.mockResolvedValue({ id: 't1', deletedAt: new Date() });
    const result = await repo.softDelete('t1');
    expect(mockDb.tenant.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(result.deletedAt).toBeDefined();
  });
});

describe('UserRepository', () => {
  let repo: UserRepository;
  const mockDb = {
    user: mockModel({
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new UserRepository(mockDb as unknown as PrismaClient);
  });

  it('findById calls findUnique with deletedAt filter', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'u1' });
    await repo.findById('u1');
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1', deletedAt: null } });
  });

  it('findByEmail calls findUnique with deletedAt filter', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    await repo.findByEmail('a@b.com');
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com', deletedAt: null } });
  });

  it('findByTenant calls findMany with tenantId and deletedAt filter', async () => {
    mockDb.user.findMany.mockResolvedValue([]);
    await repo.findByTenant('t1', { skip: 0, take: 10 });
    expect(mockDb.user.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', deletedAt: null },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updateLastLogin sets lastLoginAt', async () => {
    mockDb.user.update.mockResolvedValue({ id: 'u1', lastLoginAt: new Date() });
    const result = await repo.updateLastLogin('u1');
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { lastLoginAt: expect.any(Date) },
    });
    expect(result.lastLoginAt).toBeDefined();
  });

  it('softDelete sets deletedAt', async () => {
    mockDb.user.update.mockResolvedValue({ id: 'u1', deletedAt: new Date() });
    await repo.softDelete('u1');
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { deletedAt: expect.any(Date) },
    });
  });
});

describe('SessionRepository', () => {
  let repo: SessionRepository;
  const mockDb = {
    session: mockModel({
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new SessionRepository(mockDb as unknown as PrismaClient);
  });

  it('findById delegates to findUnique', async () => {
    mockDb.session.findUnique.mockResolvedValue({ id: 's1' });
    expect(await repo.findById('s1')).toEqual({ id: 's1' });
    expect(mockDb.session.findUnique).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('findByToken delegates to findUnique', async () => {
    mockDb.session.findUnique.mockResolvedValue({ token: 'tok' });
    expect(await repo.findByToken('tok')).toEqual({ token: 'tok' });
  });

  it('findByRefreshToken delegates to findUnique', async () => {
    mockDb.session.findUnique.mockResolvedValue({ refreshToken: 'rt' });
    expect(await repo.findByRefreshToken('rt')).toEqual({ refreshToken: 'rt' });
  });

  it('findActiveByUser filters active and non-expired', async () => {
    mockDb.session.findMany.mockResolvedValue([{ id: 's1' }]);
    const result = await repo.findActiveByUser('u1');
    expect(mockDb.session.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', isActive: true, expiresAt: { gt: expect.any(Date) } },
      orderBy: { lastActivity: 'desc' },
    });
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('deactivate sets isActive to false', async () => {
    mockDb.session.update.mockResolvedValue({ id: 's1', isActive: false });
    await repo.deactivate('s1');
    expect(mockDb.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isActive: false },
    });
  });

  it('deactivateAllForUser updates many', async () => {
    mockDb.session.updateMany.mockResolvedValue({ count: 3 });
    await repo.deactivateAllForUser('u1');
    expect(mockDb.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', isActive: true },
      data: { isActive: false },
    });
  });

  it('updateActivity sets lastActivity', async () => {
    mockDb.session.update.mockResolvedValue({ id: 's1', lastActivity: new Date() });
    await repo.updateActivity('s1');
    expect(mockDb.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { lastActivity: expect.any(Date) },
    });
  });

  it('cleanupExpired deletes expired sessions', async () => {
    mockDb.session.deleteMany.mockResolvedValue({ count: 5 });
    await repo.cleanupExpired();
    expect(mockDb.session.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: expect.any(Date) } },
    });
  });
});

describe('AuditLogRepository', () => {
  let repo: AuditLogRepository;
  const mockDb = {
    auditLog: mockModel({
      create: vi.fn(),
      findMany: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new AuditLogRepository(mockDb as unknown as PrismaClient);
  });

  it('create delegates to prisma', async () => {
    const data = { action: 'test', tenantId: 't1' };
    mockDb.auditLog.create.mockResolvedValue({ id: 'a1', ...data });
    const result = await repo.create(data as any);
    expect(mockDb.auditLog.create).toHaveBeenCalledWith({ data });
    expect(result).toEqual({ id: 'a1', ...data });
  });

  it('findByTenant queries with pagination', async () => {
    mockDb.auditLog.findMany.mockResolvedValue([{ id: 'a1' }]);
    const result = await repo.findByTenant('t1', { skip: 0, take: 20 });
    expect(mockDb.auditLog.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('findByTenant works without pagination params', async () => {
    mockDb.auditLog.findMany.mockResolvedValue([]);
    await repo.findByTenant('t1');
    expect(mockDb.auditLog.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1' },
      skip: undefined,
      take: undefined,
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('ApiKeyRepository', () => {
  let repo: ApiKeyRepository;
  const mockDb = {
    apiKey: mockModel({
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new ApiKeyRepository(mockDb as unknown as PrismaClient);
  });

  it('findByKeyPrefix calls findFirst', async () => {
    mockDb.apiKey.findFirst.mockResolvedValue({ id: 'k1', keyPrefix: 'abc' });
    const result = await repo.findByKeyPrefix('abc');
    expect(mockDb.apiKey.findFirst).toHaveBeenCalledWith({ where: { keyPrefix: 'abc' } });
    expect(result).toEqual({ id: 'k1', keyPrefix: 'abc' });
  });

  it('findByTenant queries active keys', async () => {
    mockDb.apiKey.findMany.mockResolvedValue([{ id: 'k1' }]);
    await repo.findByTenant('t1');
    expect(mockDb.apiKey.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('deactivate sets isActive to false', async () => {
    mockDb.apiKey.update.mockResolvedValue({ id: 'k1', isActive: false });
    await repo.deactivate('k1');
    expect(mockDb.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'k1' },
      data: { isActive: false },
    });
  });
});

describe('ChannelConnectionRepository', () => {
  let repo: ChannelConnectionRepository;
  const mockDb = {
    channelConnection: mockModel({
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new ChannelConnectionRepository(mockDb as unknown as PrismaClient);
  });

  it('findByTenant queries by tenant', async () => {
    mockDb.channelConnection.findMany.mockResolvedValue([{ id: 'c1' }]);
    await repo.findByTenant('t1');
    expect(mockDb.channelConnection.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findByTenantAndType uses compound unique', async () => {
    mockDb.channelConnection.findUnique.mockResolvedValue({ id: 'c1', channelType: 'whatsapp' });
    const result = await repo.findByTenantAndType('t1', 'whatsapp');
    expect(mockDb.channelConnection.findUnique).toHaveBeenCalledWith({
      where: { tenantId_channelType: { tenantId: 't1', channelType: 'whatsapp' } },
    });
    expect(result).toEqual({ id: 'c1', channelType: 'whatsapp' });
  });

  it('remove calls delete', async () => {
    mockDb.channelConnection.delete.mockResolvedValue({ id: 'c1' });
    await repo.remove('c1');
    expect(mockDb.channelConnection.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});

describe('IntegrationRepository', () => {
  let repo: IntegrationRepository;
  const mockDb = {
    integration: mockModel({
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new IntegrationRepository(mockDb as unknown as PrismaClient);
  });

  it('findByTenantAndChannel filters by both', async () => {
    mockDb.integration.findMany.mockResolvedValue([{ id: 'i1' }]);
    await repo.findByTenantAndChannel('t1', 'slack');
    expect(mockDb.integration.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', channelType: 'slack' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('remove calls delete', async () => {
    mockDb.integration.delete.mockResolvedValue({ id: 'i1' });
    await repo.remove('i1');
    expect(mockDb.integration.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
  });
});

describe('IntegrationLogRepository', () => {
  let repo: IntegrationLogRepository;
  const mockDb = {
    integrationLog: mockModel({
      findMany: vi.fn(),
      create: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new IntegrationLogRepository(mockDb as unknown as PrismaClient);
  });

  it('findByIntegration queries with limit', async () => {
    mockDb.integrationLog.findMany.mockResolvedValue([{ id: 'l1' }]);
    const result = await repo.findByIntegration('i1', 10);
    expect(mockDb.integrationLog.findMany).toHaveBeenCalledWith({
      where: { integrationId: 'i1' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    expect(result).toEqual([{ id: 'l1' }]);
  });

  it('findByIntegration defaults limit to 50', async () => {
    mockDb.integrationLog.findMany.mockResolvedValue([]);
    await repo.findByIntegration('i1');
    expect(mockDb.integrationLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });
});

describe('IntegrationUsageRepository', () => {
  let repo: IntegrationUsageRepository;
  const mockDb = {
    integrationUsage: mockModel({
      findMany: vi.fn(),
      upsert: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new IntegrationUsageRepository(mockDb as unknown as PrismaClient);
  });

  it('findByIntegration queries with date cutoff', async () => {
    mockDb.integrationUsage.findMany.mockResolvedValue([{ id: 'u1' }]);
    const result = await repo.findByIntegration('i1', 7);
    expect(mockDb.integrationUsage.findMany).toHaveBeenCalledWith({
      where: {
        integrationId: 'i1',
        periodStart: { gte: expect.any(Date) },
      },
      orderBy: { periodStart: 'desc' },
    });
    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('upsert creates when no existing record', async () => {
    const data = {
      integrationId: 'i1',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-02'),
      messagesSent: 10,
      messagesReceived: 5,
      errors: 1,
      totalLatencyMs: 1000,
    };
    mockDb.integrationUsage.upsert.mockResolvedValue({ id: 'u1', ...data });
    const result = await repo.upsert(data);
    expect(mockDb.integrationUsage.upsert).toHaveBeenCalledWith({
      where: {
        integrationId_periodStart: {
          integrationId: 'i1',
          periodStart: data.periodStart,
        },
      },
      create: data,
      update: {
        periodEnd: data.periodEnd,
        messagesSent: { increment: 10 },
        messagesReceived: { increment: 5 },
        errors: { increment: 1 },
        totalLatencyMs: { increment: 1000 },
      },
    });
    expect(result).toEqual({ id: 'u1', ...data });
  });
});

describe('ConversationRepository', () => {
  let repo: ConversationRepository;
  const mockDb = {
    conversation: mockModel({
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new ConversationRepository(mockDb as unknown as PrismaClient);
  });

  it('findByTenant returns paginated results', async () => {
    mockDb.conversation.findMany.mockResolvedValue([{ id: 'c1' }]);
    mockDb.conversation.count.mockResolvedValue(1);
    const result = await repo.findByTenant('t1', 1, 20);
    expect(mockDb.conversation.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(result).toEqual({ items: [{ id: 'c1' }], total: 1, page: 1, limit: 20 });
  });

  it('findById delegates to findUnique', async () => {
    mockDb.conversation.findUnique.mockResolvedValue({ id: 'c1' });
    expect(await repo.findById('c1')).toEqual({ id: 'c1' });
  });
});

describe('MessageRepository', () => {
  let repo: MessageRepository;
  const mockDb = {
    message: mockModel({
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new MessageRepository(mockDb as unknown as PrismaClient);
  });

  it('findByConversation returns paginated results with ascending order', async () => {
    mockDb.message.findMany.mockResolvedValue([{ id: 'm1', conversationId: 'c1' }]);
    mockDb.message.count.mockResolvedValue(1);
    const result = await repo.findByConversation('c1', 1, 50);
    expect(mockDb.message.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'c1' },
      orderBy: { createdAt: 'asc' },
      skip: 0,
      take: 50,
    });
    expect(result).toEqual({ items: [{ id: 'm1', conversationId: 'c1' }], total: 1, page: 1, limit: 50 });
  });
});

describe('WebhookRepository', () => {
  let repo: WebhookRepository;
  const mockDb = {
    webhook: mockModel({
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }),
  };

  beforeEach(() => {
    repo = new WebhookRepository(mockDb as unknown as PrismaClient);
  });

  it('remove calls delete', async () => {
    mockDb.webhook.delete.mockResolvedValue({ id: 'w1' });
    await repo.remove('w1');
    expect(mockDb.webhook.delete).toHaveBeenCalledWith({ where: { id: 'w1' } });
  });

  it('findById delegates to findUnique', async () => {
    mockDb.webhook.findUnique.mockResolvedValue({ id: 'w1' });
    expect(await repo.findById('w1')).toEqual({ id: 'w1' });
  });
});
