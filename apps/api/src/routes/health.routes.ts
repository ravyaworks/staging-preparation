import { Router, type Request, type Response } from 'express';
import { getPrismaClient } from '@conversation-platform/database';
import { getMetrics, resetMetrics } from '../middleware/metrics';

const router: Router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: number }> = {};
  const start = Date.now();

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy', latency: Date.now() - start };
  } catch {
    checks.database = { status: 'unhealthy' };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: true,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      version: process.env.APP_VERSION || '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    },
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ready', database: 'connected' }, meta: { timestamp: new Date().toISOString() } });
});

router.get('/live', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'alive' }, meta: { timestamp: new Date().toISOString() } });
});

router.get('/metrics', (_req: Request, res: Response) => {
  const metrics = getMetrics();
  res.json({ success: true, data: { metrics, uptime: process.uptime(), memory: process.memoryUsage() } });
});

router.post('/metrics/reset', (_req: Request, res: Response) => {
  resetMetrics();
  res.json({ success: true, data: { reset: true } });
});

export { router as healthRoutes };
