import { Router, type Request, type Response } from 'express';
import { getPrismaClient } from '@conversation-platform/database';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
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

router.get('/health/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

router.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

export { router as healthRoutes };
