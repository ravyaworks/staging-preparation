import { Router, type Request, type Response } from 'express';
import { NotificationEngine, createStubChannelProvider } from '@conversation-platform/notification-engine';

const router = Router();
const engine = new NotificationEngine();

engine.registerChannel('email', createStubChannelProvider(true));
engine.registerChannel('sms', createStubChannelProvider(true));
engine.registerChannel('push', createStubChannelProvider(true));
engine.registerChannel('in_app', createStubChannelProvider(true));

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.post('/send', async (req: Request, res: Response) => {
  try {
    const notif = await engine.send({ ...req.body, tenantId: tenantId(req) });
    res.status(201).json({ success: true, data: notif });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.get('/', (req: Request, res: Response) => {
  const status = req.query.status as any;
  const notifications = engine.list(tenantId(req), status);
  res.json({ success: true, data: notifications });
});

router.get('/:id', (req: Request, res: Response) => {
  const notif = engine.get(req.params.id as string);
  if (!notif) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  res.json({ success: true, data: notif });
});

router.post('/:id/cancel', async (req: Request, res: Response) => {
  const cancelled = await engine.cancel(req.params.id as string);
  res.json({ success: true, data: { cancelled } });
});

router.post('/templates', (req: Request, res: Response) => {
  const template = engine.registerTemplate({ ...req.body, tenantId: tenantId(req) });
  res.status(201).json({ success: true, data: template });
});

router.get('/templates', (req: Request, res: Response) => {
  const channel = req.query.channel as any;
  const templates = engine.listTemplates(tenantId(req), channel);
  res.json({ success: true, data: templates });
});

router.get('/templates/:id', (req: Request, res: Response) => {
  const template = engine.getTemplate(req.params.id as string);
  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  res.json({ success: true, data: template });
});

router.patch('/templates/:id', (req: Request, res: Response) => {
  const updated = engine.updateTemplate(req.params.id as string, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  res.json({ success: true, data: updated });
});

router.post('/send-template', async (req: Request, res: Response) => {
  try {
    const notif = await engine.sendFromTemplate(
      req.body.templateId, tenantId(req), req.body.recipient,
      req.body.data || {}, req.body.channel, req.body.priority,
    );
    res.status(201).json({ success: true, data: notif });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

export { router as notificationRoutes };
