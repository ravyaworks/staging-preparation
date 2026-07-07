import { Router, type Request, type Response } from 'express';
import { getPrismaClient, TenantRepository } from '@conversation-platform/database';
import { NotFoundError } from '@conversation-platform/shared';

export function createTenantRoutes() {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const prisma = getPrismaClient();
    const tenantRepo = new TenantRepository(prisma);
    const tenants = await tenantRepo.findMany();
    res.json({ success: true, data: tenants });
  });

  router.get('/:id', async (req: Request, res: Response) => {
    const prisma = getPrismaClient();
    const tenantRepo = new TenantRepository(prisma);
    const tenant = await tenantRepo.findById(req.params.id as string);

    if (!tenant) {
      throw new NotFoundError('Tenant', req.params.id);
    }

    res.json({ success: true, data: tenant });
  });

  return router;
}
