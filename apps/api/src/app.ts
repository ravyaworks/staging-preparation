import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { errorHandler, notFoundHandler } from './middleware/error';
import { tenantResolve } from './middleware/tenant';
import { requestLogger } from './middleware/logging';
import { requestId } from './middleware/request-id';
import { metricsMiddleware } from './middleware/metrics';
import { csrfProtection } from './middleware/csrf';
import { apiLimiter, authLimiter } from './middleware/rate-limit';
import swaggerUi from 'swagger-ui-express';
import { spec } from './routes/docs.routes';

import { healthRoutes } from './routes/health.routes';
import { docsRoutes } from './routes/docs.routes';
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
import { eventsRoutes } from './routes/events.routes';
import { widgetRoutes } from './routes/widget.routes';
import { createOutreachRoutes } from './routes/outreach.routes';
import { createOutreachService } from './services/outreach.service';
import { createCampaignRoutes } from './routes/campaign.routes';
import { createCampaignExecutionRoutes } from './modules/campaign-execution/routes';
import { createDeliveryTrackingRoutes } from './modules/delivery-tracking/routes';
import { createWhatsAppRoutes } from './routes/whatsapp.routes';
import { createInboxRoutes } from './routes/inbox.routes';

export function createApp(config: AppConfig, logger: Logger): express.Express {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(cors({ origin: config.cors.origins, methods: config.cors.methods }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(requestId);
  app.use(metricsMiddleware);
  app.use('/api/v1', apiLimiter);
  app.use('/api/v1/auth', authLimiter);

  app.use(requestLogger(logger));
  app.use(tenantResolve(config));
  app.use(csrfProtection);

  app.use('/api/v1/health', healthRoutes);

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    app.use('/api/v1/docs', docsRoutes);
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'Conversation Platform API Docs' }));
  }

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
  app.use('/api/v1/events', eventsRoutes);
  app.use('/api/v1/widgets', widgetRoutes);

  const outreachService = createOutreachService(logger);
  app.use('/api/v1/outreach', createOutreachRoutes(logger, outreachService));

  outreachService.start();

  app.use('/api/v1/campaigns', createCampaignRoutes(config, logger));

  const campaignExecRoutes = createCampaignExecutionRoutes(config, logger);
  app.use('/api/v1/execution', campaignExecRoutes.router);

  campaignExecRoutes.start();

  app.use('/api/v1/delivery', createDeliveryTrackingRoutes(config, logger));

  app.use('/api/v1/whatsapp', createWhatsAppRoutes(config, logger));
  app.use('/api/v1/inbox', createInboxRoutes(config, logger));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
