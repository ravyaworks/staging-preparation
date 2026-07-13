import { PrismaClient } from '@prisma/client';
import { createPrismaClient, getPrismaClient, disconnectPrisma } from './client';

import { BaseRepository } from './repositories/base';
import { TenantRepository } from './repositories/tenant.repository';
import { UserRepository } from './repositories/user.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { ChannelConnectionRepository } from './repositories/channel-connection.repository';
import { IntegrationRepository } from './repositories/integration.repository';
import { IntegrationLogRepository } from './repositories/integration-log.repository';
import { IntegrationUsageRepository } from './repositories/integration-usage.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';
import { WebhookRepository } from './repositories/webhook.repository';
import { OutreachJobRepository } from './repositories/outreach-job.repository';
import { ContactRepository } from './repositories/contact.repository';

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
  ChannelConnectionRepository,
  IntegrationRepository,
  IntegrationLogRepository,
  IntegrationUsageRepository,
  ConversationRepository,
  MessageRepository,
  WebhookRepository,
  OutreachJobRepository,
  ContactRepository,
};
