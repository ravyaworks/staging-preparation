import { Router, type Request, type Response } from 'express';
import { AnalyticsEngine } from '@conversation-platform/analytics-engine';

const router: import('express').Router = Router();
const engine = new AnalyticsEngine();

router.post('/track', (req: Request, res: Response) => {
  engine.track({ ...req.body, tenantId: (req as any).tenantId || 'default' });
  res.status(201).json({ success: true, data: { tracked: true } });
});

router.get('/events', (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId || 'default';
  const events = engine.query({ tenantId, ...req.query as any });
  res.json({ success: true, data: events });
});

router.get('/metrics', (req: Request, res: Response) => {
  const name = req.query.name as string | undefined;
  const metrics = engine.getMetrics(name);
  res.json({ success: true, data: metrics });
});

router.get('/aggregate/:eventType', (req: Request, res: Response) => {
  const period = (req.query.period as 'hour' | 'day' | 'week' | 'month') || 'day';
  const agg = engine.aggregate(req.params.eventType as any, period);
  res.json({ success: true, data: agg });
});

router.get('/conversations', (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId || 'default';
  const stats = engine.getConversationStats(tenantId);
  res.json({ success: true, data: stats });
});

router.get('/tokens', (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId || 'default';
  const usage = engine.getTokenUsage(tenantId);
  res.json({ success: true, data: usage });
});

router.get('/errors', (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId || 'default';
  const rate = engine.getErrorRate(tenantId);
  res.json({ success: true, data: rate });
});

export { router as analyticsRoutes };
