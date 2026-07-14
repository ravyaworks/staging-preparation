import { PrismaClient } from '@prisma/client';
import { createPrismaClient } from '@conversation-platform/database';

let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

export async function teardownTestPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined as unknown as PrismaClient;
  }
}

export async function cleanupDatabase(): Promise<void> {
  const client = getTestPrisma();
  const tables = [
    'analytics_metrics', 'analytics_events', 'import_records', 'import_jobs',
    'campaign_tags', 'campaign_logs', 'campaign_statistics', 'campaign_businesses',
    'delivery_events', 'delivery_notifications', 'job_failures', 'outreach_jobs',
    'worker_metrics', 'outreach_api_keys', 'integration_usages', 'integration_logs',
    'integrations', 'channel_connections', 'webhooks', 'messages', 'conversations',
    'contacts', 'campaigns', 'organizations', 'sessions', 'api_keys', 'audit_logs',
    'notifications', 'events', 'files', 'settings', 'role_permissions', 'user_roles',
    'users', 'roles', 'permissions', 'feature_flags', 'maintenance_windows', 'tenants',
  ];

  for (const table of tables) {
    try { await client.$executeRawUnsafe(`DELETE FROM "${table}"`); } catch {}
  }
}

export async function createTestTenant(prisma: PrismaClient, overrides?: { name?: string; slug?: string }) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.tenant.create({
    data: { name: overrides?.name ?? `Test Tenant ${suffix}`, slug: overrides?.slug ?? `test-tenant-${suffix}`, isActive: true },
  });
}

export async function createTestUser(prisma: PrismaClient, tenantId: string, overrides?: { email?: string }) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.user.create({
    data: { email: overrides?.email ?? `test-${suffix}@example.com`, passwordHash: 'hashed_password_for_testing', firstName: 'Test', lastName: 'User', tenantId, isActive: true },
  });
}

export async function createTestOrganization(prisma: PrismaClient, tenantId: string, overrides?: { name?: string; slug?: string }) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.organization.create({
    data: { name: overrides?.name ?? `Test Org ${suffix}`, slug: overrides?.slug ?? `test-org-${suffix}`, tenantId },
  });
}

export async function createTestCampaign(prisma: PrismaClient, organizationId: string, overrides?: { name?: string; channel?: string; status?: string }) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.campaign.create({
    data: { name: overrides?.name ?? `Test Campaign ${suffix}`, channel: overrides?.channel ?? 'whatsapp', status: overrides?.status ?? 'draft', organizationId },
  });
}

export async function createTestConversation(prisma: PrismaClient, tenantId: string, overrides?: { channel?: string; status?: string }) {
  return prisma.conversation.create({
    data: { channel: overrides?.channel ?? 'whatsapp', status: overrides?.status ?? 'active', tenantId },
  });
}

export function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), trace: vi.fn(), fatal: vi.fn(), child: vi.fn().mockReturnThis() };
}

export function createMockEventBus() {
  return { publish: vi.fn().mockResolvedValue(undefined), subscribe: vi.fn().mockResolvedValue(undefined), unsubscribe: vi.fn().mockResolvedValue(undefined) };
}
