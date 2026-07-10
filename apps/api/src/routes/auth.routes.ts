import { Router } from 'express';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { authenticate } from '@conversation-platform/auth';
import { createAuthService } from '../services/auth.service';
import { createAuthController } from '../controllers/auth.controller';

export function createAuthRoutes(config: AppConfig, logger: Logger) {
  const router: import('express').Router = Router();
  const authService = createAuthService(config, logger);
  const controller = createAuthController(authService);

  router.post('/register', controller.register.bind(controller));
  router.post('/login', controller.login.bind(controller));
  router.post('/refresh', controller.refresh.bind(controller));
  router.post('/logout', controller.logout.bind(controller));
  router.post('/forgot-password', controller.forgotPassword.bind(controller));
  router.post('/reset-password', controller.resetPassword.bind(controller));

  const jwtConfig = {
    secret: config.auth.jwtSecret,
    expiresIn: parseDuration(config.auth.jwtExpiresIn),
    refreshSecret: config.auth.refreshSecret,
    refreshExpiresIn: parseDuration(config.auth.refreshExpiresIn),
    issuer: config.auth.issuer,
  };

  router.get('/me', authenticate(jwtConfig), controller.me.bind(controller));
  router.post('/change-password', authenticate(jwtConfig), controller.changePassword.bind(controller));

  return router;
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900;
  }

  const value = parseInt(match[1] as string, 10);
  const unit = match[2] as string;

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return value;
  }
}
