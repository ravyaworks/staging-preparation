import { Router } from 'express';
import type { AppConfig } from '@conversation-platform/config';
import { authenticate } from '@conversation-platform/auth';
import { createTenantController } from '../controllers/tenant.controller';

export function createTenantRoutes(config: AppConfig) {
  const router: import('express').Router = Router();
  const controller = createTenantController();

  const jwtConfig = {
    secret: config.auth.jwtSecret,
    expiresIn: 900,
    refreshSecret: config.auth.refreshSecret,
    refreshExpiresIn: 604800,
    issuer: config.auth.issuer,
  };

  router.get('/', controller.list.bind(controller));
  router.get('/:id', controller.getById.bind(controller));
  router.post('/', authenticate(jwtConfig), controller.create.bind(controller));
  router.patch('/:id', authenticate(jwtConfig), controller.update.bind(controller));
  router.delete('/:id', authenticate(jwtConfig), controller.deactivate.bind(controller));

  return router;
}
