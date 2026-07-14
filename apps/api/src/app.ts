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
import { authenticate } from '@conversation-platform/auth';
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
import { createOutreachModuleRoutes } from './modules/outreach/routes';
import { createCampaignRoutes } from './routes/campaign.routes';
import { createCampaignExecutionRoutes } from './modules/campaign-execution/routes';
import { createDeliveryTrackingRoutes } from './modules/delivery-tracking/routes';
import { createWhatsAppRoutes } from './routes/whatsapp.routes';
import { createInboxRoutes } from './routes/inbox.routes';
import { createAnalyticsRoutes } from './modules/analytics/routes';
import { createAdminRoutes } from './modules/admin/routes';

export function createApp(config: AppConfig, logger: Logger): express.Express {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(cors({ origin: config.cors.origins, methods: config.cors.methods }));
  app.use(express.json({
    limit: '1mb',
    verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
      (req as any).rawBody = buf.toString('utf8');
    },
  }));
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

  const requireAuth = authenticate({
    secret: config.auth.jwtSecret,
    expiresIn: 900,
    refreshSecret: config.auth.refreshSecret,
    refreshExpiresIn: 604800,
    issuer: config.auth.issuer,
  });

  app.use('/api/v1/knowledge', requireAuth, knowledgeRoutes);
  app.use('/api/v1/workflows', requireAuth, workflowRoutes);
  app.use('/api/v1/tools', requireAuth, toolRoutes);
  app.use('/api/v1/plugins', requireAuth, pluginRoutes);
  app.use('/api/v1/analytics', requireAuth, analyticsRoutes);
  app.use('/api/v1/notifications', requireAuth, notificationRoutes);
  app.use('/api/v1/audit', requireAuth, auditRoutes);
  app.use('/api/v1/channels', requireAuth, channelsRoutes);
  app.use('/api/v1/webhooks', webhooksRoutes);
  app.use('/api/v1/integrations', requireAuth, integrationsRoutes);
  app.use('/api/v1/messages', requireAuth, messagesRoutes);
  app.use('/api/v1/events', requireAuth, eventsRoutes);
  app.use('/api/v1/widgets', widgetRoutes);

  app.use('/api/v1/outreach', createOutreachModuleRoutes(config, logger));

  app.use('/api/v1/campaigns', createCampaignRoutes(config, logger));

  const campaignExecRoutes = createCampaignExecutionRoutes(config, logger);
  app.use('/api/v1/execution', campaignExecRoutes.router);

  campaignExecRoutes.start();

  app.use('/api/v1/delivery', createDeliveryTrackingRoutes(config, logger));

  app.use('/api/v1/whatsapp', createWhatsAppRoutes(config, logger));
  app.use('/api/v1/inbox', createInboxRoutes(config, logger));
  app.use('/api/v1/analytics', createAnalyticsRoutes(config, logger));
  app.use('/api/v1/admin', createAdminRoutes(config, logger));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
