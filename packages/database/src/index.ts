import { PrismaClient } from '@prisma/client';
import { createPrismaClient, getPrismaClient, disconnectPrisma } from './client';

import { BaseRepository } from './repositories/base';
import { TenantRepository } from './repositories/tenant.repository';
import { UserRepository } from './repositories/user.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { ApiKeyRepository } from './repositories/api-key.repository';

export {
  createPrismaClient,
  getPrismaClient,
  disconnectPrisma,
  PrismaClient,
  BaseRepository,
  TenantRepository,
  UserRepository,
  SessionRepository,
  AuditLogRepository,
  ApiKeyRepository,
};
