import type { Request, Response, NextFunction } from 'express';
import type { AppConfig } from '@conversation-platform/config';

export function tenantResolve(config: AppConfig) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const headerTenant = req.headers['x-tenant-id'] as string | undefined;

    if (headerTenant) {
      (req as Request & { tenantId: string }).tenantId = headerTenant;
    } else if (config.env === 'development') {
      (req as Request & { tenantId: string }).tenantId = 'dev-tenant';
    }

    next();
  };
}
