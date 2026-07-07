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
  app.use('/api/v1/tenants', createTenantRoutes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
