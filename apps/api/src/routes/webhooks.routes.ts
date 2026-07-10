import { Router, type Request, type Response } from 'express';
import { WebhookRegistry, WebhookDispatcher, WebhookMonitor, generateSecret } from '@conversation-platform/webhook-service';
import type { WebhookConfig, WebhookEvent } from '@conversation-platform/webhook-service';
import { getPrismaClient, WebhookRepository } from '@conversation-platform/database';
import { webhookLimiter } from '../middleware/rate-limit';

const router: import('express').Router = Router();
const prisma = getPrismaClient();
const webhookRepo = new WebhookRepository(prisma);
const registry = new WebhookRegistry(webhookRepo);
const dispatcher = new WebhookDispatcher(registry);
const monitor = new WebhookMonitor();

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.get('/', (req: Request, res: Response) => {
  const webhooks = registry.list(tenantId(req));
  res.json({ success: true, data: webhooks });
});

router.post('/', webhookLimiter, (req: Request, res: Response) => {
  try {
    const config: WebhookConfig = {
      id: crypto.randomUUID(),
      tenantId: tenantId(req),
      name: req.body.name,
      url: req.body.url,
      secret: generateSecret(),
      events: req.body.events || ['*'],
      enabled: req.body.enabled !== false,
      retryMaxAttempts: req.body.retryMaxAttempts || 3,
      retryBackoffBaseMs: req.body.retryBackoffBaseMs || 1000,
      timeoutMs: req.body.timeoutMs || 5000,
      headers: req.body.headers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const registration = registry.register(config);
    res.status(201).json({ success: true, data: registration });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/test', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      type: req.body.type || 'test.event',
      tenantId: tenantId(req),
      payload: req.body.payload || { test: true },
      timestamp: new Date().toISOString(),
    };
    const results = await dispatcher.dispatch(event);
    res.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.get('/stats', (req: Request, res: Response) => {
  const webhooks = registry.list(tenantId(req));
  const stats = monitor.getStats(webhooks.map(w => w.config));
  res.json({ success: true, data: stats });
});

router.get('/failures', (req: Request, res: Response) => {
  const failures = monitor.getRecentFailures(Number(req.query.limit) || 20);
  res.json({ success: true, data: failures });
});

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook ID' });
  const webhook = registry.get(id);
  if (!webhook) {
    return res.status(404).json({ success: false, error: 'Webhook not found' });
  }
  res.json({ success: true, data: webhook });
});

router.patch('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook ID' });
  const existing = registry.get(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Webhook not found' });
  }
  const updated: WebhookConfig = {
    ...existing.config,
    name: req.body.name ?? existing.config.name,
    url: req.body.url ?? existing.config.url,
    events: req.body.events ?? existing.config.events,
    enabled: req.body.enabled ?? existing.config.enabled,
    retryMaxAttempts: req.body.retryMaxAttempts ?? existing.config.retryMaxAttempts,
    retryBackoffBaseMs: req.body.retryBackoffBaseMs ?? existing.config.retryBackoffBaseMs,
    timeoutMs: req.body.timeoutMs ?? existing.config.timeoutMs,
    headers: req.body.headers ?? existing.config.headers,
    updatedAt: new Date().toISOString(),
  };
  registry.unregister(id);
  registry.register(updated);
  res.json({ success: true, data: registry.get(id) });
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook ID' });
  const deleted = registry.unregister(id);
  res.json({ success: true, data: { deleted } });
});

router.post('/:id/regenerate-secret', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook ID' });
  const existing = registry.get(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Webhook not found' });
  }
  const newSecret = generateSecret();
  const updated: WebhookConfig = {
    ...existing.config,
    secret: newSecret,
    updatedAt: new Date().toISOString(),
  };
  registry.unregister(id);
  registry.register(updated);
  res.json({ success: true, data: { secret: newSecret } });
});

router.get('/:id/deliveries', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook ID' });
  const log = dispatcher.getDeliveryLog(id, Number(req.query.limit) || 50);
  res.json({ success: true, data: log });
});

export { router as webhooksRoutes };
