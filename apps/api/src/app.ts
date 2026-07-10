import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { errorHandler, notFoundHandler } from './middleware/error';
import { tenantResolve } from './middleware/tenant';
import { requestLogger } from './middleware/logging';
import { apiLimiter, authLimiter } from './middleware/rate-limit';
import { healthRoutes } from './routes/health.routes';
import { createAuthRoutes } from './routes/auth.routes';
import { createTenantRoutes } from './routes/tenant.routes';
import { knowledgeRoutes } from './routes/knowledge.routes';
import { workflowRoutes } from './routes/workflow.routes';
import { toolRoutes } from './routes/tool.routes';
import { pluginRoutes } from './routes/plugin.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { notificationRoutes } from './routes/notification.routes';
import { auditRoutes } from './routes/audit.routes';
import { channelsRoutes } from './routes/channels.routes';
import { webhooksRoutes } from './routes/webhooks.routes';
import { integrationsRoutes } from './routes/integrations.routes';
import { messagesRoutes } from './routes/messages.routes';

export function createApp(config: AppConfig, logger: Logger) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origins, methods: config.cors.methods }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1/auth', authLimiter);

  app.use(requestLogger(logger));
  app.use(tenantResolve(config));

  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', createAuthRoutes(config, logger));
  app.use('/api/v1/tenants', createTenantRoutes(config));

  app.use('/api/v1/knowledge', knowledgeRoutes);
  app.use('/api/v1/workflows', workflowRoutes);
  app.use('/api/v1/tools', toolRoutes);
  app.use('/api/v1/plugins', pluginRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/audit', auditRoutes);
  app.use('/api/v1/channels', channelsRoutes);
  app.use('/api/v1/webhooks', webhooksRoutes);
  app.use('/api/v1/integrations', integrationsRoutes);
  app.use('/api/v1/messages', messagesRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
