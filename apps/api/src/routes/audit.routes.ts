import { Router, type Request, type Response } from 'express';
import { AuditSystem } from '@conversation-platform/audit';

const router: import('express').Router = Router();
const audit = new AuditSystem();

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.post('/record', (req: Request, res: Response) => {
  const entry = audit.record({ ...req.body, tenantId: tenantId(req) });
  res.status(201).json({ success: true, data: entry });
});

router.get('/', (req: Request, res: Response) => {
  const entries = audit.query({ tenantId: tenantId(req), ...req.query as any });
  res.json({ success: true, data: entries });
});

router.get('/resource/:resourceType/:resourceId', (req: Request, res: Response) => {
  const entries = audit.getByResource(req.params.resourceType as any, req.params.resourceId as string);
  res.json({ success: true, data: entries });
});

router.get('/tenant/:tenantId', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const entries = audit.getByTenant(req.params.tenantId as string, limit);
  res.json({ success: true, data: entries });
});

router.get('/user/:userId', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const entries = audit.getByUser(req.params.userId as string, limit);
  res.json({ success: true, data: entries });
});

router.get('/stats', (req: Request, res: Response) => {
  const stats = audit.getStats(tenantId(req));
  res.json({ success: true, data: stats });
});

export { router as auditRoutes };
