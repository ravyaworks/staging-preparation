import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { errorHandler, notFoundHandler } from './middleware/error';
import { tenantResolve } from './middleware/tenant';
import { requestLogger } from './middleware/logging';
import { healthRoutes } from './routes/health.routes';
import { createAuthRoutes } from './routes/auth.routes';
import { createTenantRoutes } from './routes/tenant.routes';

export function createApp(config: AppConfig, logger: Logger) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origins, methods: config.cors.methods }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use(requestLogger(logger));
  app.use(tenantResolve(config));

  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', createAuthRoutes(config, logger));
  app.use('/api/v1/tenants', createTenantRoutes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
