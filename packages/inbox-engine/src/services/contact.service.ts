import type { Logger } from '@conversation-platform/logger';
import { getPrismaClient, ContactRepository } from '@conversation-platform/database';

export function createContactService(logger: Logger) {
  function getRepo(): ContactRepository {
    const prisma = getPrismaClient();
    return new ContactRepository(prisma);
  }

  async function list(tenantId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return getRepo().findByTenant(tenantId, params.page ?? 1, params.limit ?? 20, params.search);
  }

  async function getById(id: string) {
    return getRepo().findById(id);
  }

  async function update(id: string, data: Record<string, unknown>) {
    return getRepo().update(id, data as any);
  }

  async function block(id: string) {
    return getRepo().update(id, { isBlocked: true } as any);
  }

  async function unblock(id: string) {
    return getRepo().update(id, { isBlocked: false } as any);
  }

  return { list, getById, update, block, unblock };
}

export type ContactService = ReturnType<typeof createContactService>;
