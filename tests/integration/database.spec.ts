import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestPrisma, teardownTestPrisma, cleanupDatabase, createTestTenant, createTestUser, createTestOrganization, createTestCampaign, createTestConversation } from './setup';

describe('Database Integration', () => {
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeAll(async () => { prisma = getTestPrisma(); await prisma.$connect(); });
  afterAll(async () => { await teardownTestPrisma(); });
  beforeEach(async () => { await cleanupDatabase(); });

  describe('Connection', () => {
    it('should connect to the database successfully', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as value`;
      expect(result).toBeDefined();
    });

    it('should support transactions', async () => {
      const tenant = await prisma.$transaction(async (tx) => tx.tenant.create({ data: { name: 'Tx Tenant', slug: `tx-tenant-${Date.now()}` } }));
      expect(tenant.id).toBeDefined();
    });
  });

  describe('Tenant CRUD', () => {
    it('should create a tenant', async () => {
      const tenant = await createTestTenant(prisma, { name: 'Acme Corp', slug: 'acme-corp' });
      expect(tenant.name).toBe('Acme Corp');
      expect(tenant.isActive).toBe(true);
    });

    it('should read a tenant by slug', async () => {
      await createTestTenant(prisma, { slug: 'unique-slug-123' });
      const found = await prisma.tenant.findUnique({ where: { slug: 'unique-slug-123' } });
      expect(found).not.toBeNull();
    });

    it('should update a tenant', async () => {
      const created = await createTestTenant(prisma);
      const updated = await prisma.tenant.update({ where: { id: created.id }, data: { name: 'Updated Name' } });
      expect(updated.name).toBe('Updated Name');
    });

    it('should enforce unique slug constraint', async () => {
      await createTestTenant(prisma, { slug: 'duplicate-slug' });
      await expect(createTestTenant(prisma, { slug: 'duplicate-slug' })).rejects.toThrow();
    });
  });

  describe('User CRUD', () => {
    let tenantId: string;
    beforeEach(async () => { const tenant = await createTestTenant(prisma); tenantId = tenant.id; });

    it('should create a user with tenant relation', async () => {
      const user = await createTestUser(prisma, tenantId, { email: 'alice@test.com' });
      expect(user.email).toBe('alice@test.com');
      expect(user.tenantId).toBe(tenantId);
    });

    it('should enforce unique email constraint', async () => {
      await createTestUser(prisma, tenantId, { email: 'dup@test.com' });
      await expect(createTestUser(prisma, tenantId, { email: 'dup@test.com' })).rejects.toThrow();
    });

    it('should read users by tenant', async () => {
      await createTestUser(prisma, tenantId, { email: 'u1@test.com' });
      await createTestUser(prisma, tenantId, { email: 'u2@test.com' });
      const users = await prisma.user.findMany({ where: { tenantId } });
      expect(users.length).toBe(2);
    });
  });

  describe('Conversation CRUD', () => {
    let tenantId: string;
    beforeEach(async () => { const tenant = await createTestTenant(prisma); tenantId = tenant.id; });

    it('should create a conversation', async () => {
      const conv = await createTestConversation(prisma, tenantId, { channel: 'whatsapp' });
      expect(conv.channel).toBe('whatsapp');
      expect(conv.tenantId).toBe(tenantId);
    });

    it('should create a conversation with messages', async () => {
      const conv = await createTestConversation(prisma, tenantId);
      const message = await prisma.message.create({ data: { role: 'user', content: 'Hello!', direction: 'inbound', conversationId: conv.id } });
      expect(message.content).toBe('Hello!');
    });

    it('should filter conversations by status', async () => {
      await createTestConversation(prisma, tenantId, { status: 'active' });
      await createTestConversation(prisma, tenantId, { status: 'closed' });
      const active = await prisma.conversation.findMany({ where: { tenantId, status: 'active' } });
      expect(active.length).toBe(1);
    });

    it('should paginate conversations', async () => {
      for (let i = 0; i < 5; i++) await createTestConversation(prisma, tenantId);
      const page1 = await prisma.conversation.findMany({ where: { tenantId }, skip: 0, take: 2, orderBy: { createdAt: 'desc' } });
      expect(page1.length).toBe(2);
    });
  });

  describe('Transactions and Rollbacks', () => {
    it('should commit a transaction with multiple operations', async () => {
      const tenant = await createTestTenant(prisma);
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { email: 'tx-user@test.com', passwordHash: 'hash', firstName: 'Tx', lastName: 'User', tenantId: tenant.id } });
        await tx.conversation.create({ data: { tenantId: tenant.id, userId: user.id, channel: 'whatsapp' } });
      });
      const user = await prisma.user.findUnique({ where: { email: 'tx-user@test.com' } });
      expect(user).not.toBeNull();
    });

    it('should rollback a transaction on error', async () => {
      const tenant = await createTestTenant(prisma);
      await expect(prisma.$transaction(async (tx) => {
        await tx.user.create({ data: { email: 'rollback-user@test.com', passwordHash: 'hash', firstName: 'Rollback', lastName: 'User', tenantId: tenant.id } });
        throw new Error('Simulated failure');
      })).rejects.toThrow('Simulated failure');
      const user = await prisma.user.findUnique({ where: { email: 'rollback-user@test.com' } });
      expect(user).toBeNull();
    });
  });

  describe('Indexes and Constraints', () => {
    it('should enforce foreign key constraints', async () => {
      await expect(prisma.user.create({ data: { email: 'orphan@test.com', passwordHash: 'hash', firstName: 'Orphan', lastName: 'User', tenantId: '00000000-0000-0000-0000-000000000000' } })).rejects.toThrow();
    });

    it('should enforce required fields', async () => {
      await expect(prisma.tenant.create({ data: {} as any })).rejects.toThrow();
    });
  });
});
