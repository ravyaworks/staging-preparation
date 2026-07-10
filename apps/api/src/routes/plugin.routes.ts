import { Router, type Request, type Response } from 'express';
import { PluginFramework } from '@conversation-platform/plugin-framework';

const router = Router();
const framework = new PluginFramework();

router.get('/', (_req: Request, res: Response) => {
  const plugins = framework.list();
  res.json({ success: true, data: plugins });
});

router.get('/enabled', (_req: Request, res: Response) => {
  const plugins = framework.listEnabled();
  res.json({ success: true, data: plugins });
});

router.get('/:id', (req: Request, res: Response) => {
  const plugin = framework.get(req.params.id as string);
  if (!plugin) {
    return res.status(404).json({ success: false, error: 'Plugin not found' });
  }
  res.json({ success: true, data: plugin });
});

router.post('/install', async (req: Request, res: Response) => {
  try {
    const meta = await framework.install(req.body.manifest, req.body.lifecycle || {}, req.body.config);
    res.status(201).json({ success: true, data: meta });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/:id/enable', async (req: Request, res: Response) => {
  try {
    await framework.enable(req.params.id as string);
    res.json({ success: true, data: { enabled: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/:id/disable', async (req: Request, res: Response) => {
  try {
    await framework.disable(req.params.id as string);
    res.json({ success: true, data: { disabled: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await framework.uninstall(req.params.id as string);
    res.json({ success: true, data: { uninstalled: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.patch('/:id/config', async (req: Request, res: Response) => {
  try {
    await framework.updateConfig(req.params.id as string, req.body.config || {});
    res.json({ success: true, data: { updated: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

export { router as pluginRoutes };
