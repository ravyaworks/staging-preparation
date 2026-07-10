import { Router, type Request, type Response } from 'express';
import { IntegrationManager, ApiKeyManager, UsageTracker } from '@conversation-platform/integration-service';
import type { IntegrationConfig } from '@conversation-platform/integration-service';
import type { ChannelType } from '@conversation-platform/channel-core';

const router = Router();
const manager = new IntegrationManager();
const apiKeyManager = new ApiKeyManager();
const usageTracker = new UsageTracker();

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.get('/', (req: Request, res: Response) => {
  const integrations = manager.getIntegrationsByTenant(tenantId(req));
  res.json({ success: true, data: integrations });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const config: IntegrationConfig = {
      id: crypto.randomUUID(),
      tenantId: tenantId(req),
      channelType: req.body.channelType as ChannelType,
      name: req.body.name,
      enabled: req.body.enabled !== false,
      status: 'pending',
      settings: req.body.settings || {},
    };
    const created = manager.createIntegration(config);
    res.status(201).json({ success: true, data: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing integration ID' });
  const integration = manager.getIntegration(id);
  if (!integration) {
    return res.status(404).json({ success: false, error: 'Integration not found' });
  }
  res.json({ success: true, data: integration });
});

router.patch('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing integration ID' });
  try {
    const updated = manager.updateIntegration(id, req.body);
    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(404).json({ success: false, error: message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing integration ID' });
  const deleted = manager.removeIntegration(id);
  res.json({ success: true, data: { deleted } });
});

router.get('/:id/logs', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing integration ID' });
  const logs = manager.getLogs(id, Number(req.query.limit) || 50);
  res.json({ success: true, data: logs });
});

router.get('/:id/usage', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing integration ID' });
  const usage = usageTracker.getUsage(id, Number(req.query.days) || 7);
  res.json({ success: true, data: usage });
});

router.get('/stats', (req: Request, res: Response) => {
  const integrations = manager.getIntegrationsByTenant(tenantId(req));
  const stats = usageTracker.getStats(integrations.map(i => ({ id: i.id, channelType: i.channelType })));
  res.json({ success: true, data: stats });
});

router.post('/api-keys', (req: Request, res: Response) => {
  const result = apiKeyManager.createKey({
    tenantId: tenantId(req),
    name: req.body.name,
    scopes: req.body.scopes || ['*'],
    expiresAt: req.body.expiresAt,
  });
  res.status(201).json({ success: true, data: { key: result.key, rawKey: result.rawKey } });
});

router.get('/api-keys', (req: Request, res: Response) => {
  const keys = apiKeyManager.getKeysByTenant(tenantId(req));
  res.json({ success: true, data: keys });
});

router.post('/api-keys/:id/revoke', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing API key ID' });
  const revoked = apiKeyManager.revokeKey(id);
  res.json({ success: true, data: { revoked } });
});

router.delete('/api-keys/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, error: 'Missing API key ID' });
  const deleted = apiKeyManager.deleteKey(id);
  res.json({ success: true, data: { deleted } });
});

export { router as integrationsRoutes };
