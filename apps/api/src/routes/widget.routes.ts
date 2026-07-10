import { Router, type Request, type Response } from 'express';
import type { Logger } from '@conversation-platform/logger';
import { widgetLimiter } from '../middleware/rate-limit';

const router: Router = Router();

const widgetConfigs = new Map<string, Record<string, unknown>>();

export function setWidgetLogger(_logger: Logger): void {}

router.get('/:id/config', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing widget ID' });
    return;
  }
  const config = widgetConfigs.get(id);
  if (!config) {
    res.status(200).json({
      success: true,
      data: {
        widgetId: id,
        themeColor: '#2563eb',
        position: 'right',
        greetingMessage: 'Hello! How can I help you?',
        primaryColor: '#2563eb',
        cornerRadius: 12,
        darkMode: false,
        showBrand: true,
        enableTypingIndicator: true,
        allowFileUpload: false,
      },
    });
    return;
  }
  res.json({ success: true, data: config });
});

router.post('/config', widgetLimiter, (req: Request, res: Response) => {
  const { widgetId, ...config } = req.body;
  if (!widgetId) {
    res.status(400).json({ success: false, error: 'Missing widgetId' });
    return;
  }
  widgetConfigs.set(widgetId, config);
  res.status(201).json({ success: true, data: { widgetId, ...config } });
});

router.put('/:id/config', widgetLimiter, (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing widget ID' });
    return;
  }
  const existing = widgetConfigs.get(id) || {};
  const updated = { ...existing, ...req.body };
  widgetConfigs.set(id, updated);
  res.json({ success: true, data: { widgetId: id, ...updated } });
});

router.get('/:id/script', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing widget ID' });
    return;
  }
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = `${req.protocol}://${host}`;
  const wsProtocol = req.protocol === 'https' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${host}`;

  const script = `
(function() {
  var s = document.createElement('script');
  s.src = '${baseUrl}/api/v1/widgets/${id}/widget.js';
  s.onload = function() {
    ConversationWidget.init({
      widgetId: '${id}',
      apiUrl: '${baseUrl}',
      wsUrl: '${wsUrl}',
      tenantId: 'default'
    });
  };
  document.head.appendChild(s);
})();
  `.trim();

  res.type('application/javascript').send(script);
});

router.get('/:id/widget.js', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Widget JS not bundled. Serve the compiled apps/website-widget/dist/index.js at this path.',
  });
});

export { router as widgetRoutes };
