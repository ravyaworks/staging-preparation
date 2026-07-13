import { Router, type Request, type Response } from 'express';
import type { Logger } from '@conversation-platform/logger';
import { outreachSendSchema } from '../validators';
import type { OutreachService } from '../services/outreach.service';

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

export function createOutreachRoutes(logger: Logger, service: OutreachService) {
  const router: import('express').Router = Router();

  router.post('/send', async (req: Request, res: Response) => {
    try {
      const parsed = outreachSendSchema.parse(req.body);
      const result = await service.enqueue(tenantId(req), parsed);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });

  router.get('/jobs', async (req: Request, res: Response) => {
    try {
      const result = await service.listJobs(tenantId(req));
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'Missing job ID' });
        return;
      }
      const job = await service.getJob(id);
      if (!job) {
        res.status(404).json({ success: false, error: 'Outreach job not found' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
