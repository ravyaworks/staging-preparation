import { Router } from 'express';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { authenticate } from '@conversation-platform/auth';
import type { AuthContext } from '@conversation-platform/auth';
import { getPrismaClient } from '@conversation-platform/database';
import { CampaignExecutor, loadExecutorConfig, ExecutionError } from '@conversation-platform/campaign-executor';
import type { IOutreachSender } from '@conversation-platform/campaign-executor';
import { MockWhatsAppSender } from '../../services/outreach.service';

type AuthRequest = import('express').Request & { auth: AuthContext };
function getAuth(req: import('express').Request): AuthContext {
  return (req as AuthRequest).auth;
}

async function getUserOrgId(userId: string): Promise<string> {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  if (!user?.organizationId) {
    throw new ExecutionError('User has no organization', 'NO_ORGANIZATION', 403);
  }
  return user.organizationId;
}

function getJwtConfig(config: AppConfig) {
  return {
    secret: config.auth.jwtSecret,
    expiresIn: 900,
    refreshSecret: config.auth.refreshSecret,
    refreshExpiresIn: 604800,
    issuer: config.auth.issuer,
  };
}

export function createCampaignExecutionRoutes(
  config: AppConfig,
  logger: Logger,
  externalExecutor?: CampaignExecutor,
) {
  const router = Router();
  const jwtConfig = getJwtConfig(config);
  const prisma = getPrismaClient();
  const executorConfig = loadExecutorConfig();

  const sender: IOutreachSender = new MockWhatsAppSender(logger);
  const executor = externalExecutor ?? new CampaignExecutor(prisma, sender, executorConfig, logger);

  router.use(authenticate(jwtConfig));

  router.post('/campaigns/:id/execute', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
      if (!campaign || campaign.organizationId !== orgId) {
        res.status(404).json({ success: false, error: 'Campaign not found' });
        return;
      }
      const result = await executor.executeCampaign(req.params.id, req.body.config);
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof ExecutionError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });

  router.post('/campaigns/:id/pause', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
      if (!campaign || campaign.organizationId !== orgId) {
        res.status(404).json({ success: false, error: 'Campaign not found' });
        return;
      }
      await executor.pauseCampaign(req.params.id);
      res.json({ success: true, data: { message: 'Campaign paused' } });
    } catch (error: unknown) {
      if (error instanceof ExecutionError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/campaigns/:id/resume', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
      if (!campaign || campaign.organizationId !== orgId) {
        res.status(404).json({ success: false, error: 'Campaign not found' });
        return;
      }
      await executor.resumeCampaign(req.params.id);
      res.json({ success: true, data: { message: 'Campaign resumed' } });
    } catch (error: unknown) {
      if (error instanceof ExecutionError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/campaigns/:id/cancel', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
      if (!campaign || campaign.organizationId !== orgId) {
        res.status(404).json({ success: false, error: 'Campaign not found' });
        return;
      }
      await executor.cancelCampaign(req.params.id);
      res.json({ success: true, data: { message: 'Campaign cancelled' } });
    } catch (error: unknown) {
      if (error instanceof ExecutionError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/jobs/:id/retry', async (req, res) => {
    try {
      await executor.retryJob(req.params.id);
      res.json({ success: true, data: { message: 'Job queued for retry' } });
    } catch (error: unknown) {
      if (error instanceof ExecutionError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/jobs/:id/skip', async (req, res) => {
    try {
      await executor.skipJob(req.params.id);
      res.json({ success: true, data: { message: 'Job skipped' } });
    } catch (error: unknown) {
      if (error instanceof ExecutionError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/jobs/retry-failed', async (req, res) => {
    try {
      const { campaignId } = req.body;
      if (!campaignId) {
        res.status(400).json({ success: false, error: 'campaignId is required' });
        return;
      }
      const count = await executor.retryFailedJobs(campaignId);
      res.json({ success: true, data: { count, message: `${count} jobs requeued for retry` } });
    } catch (error: unknown) {
      if (error instanceof ExecutionError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/campaigns/:id/progress', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
      if (!campaign || campaign.organizationId !== orgId) {
        res.status(404).json({ success: false, error: 'Campaign not found' });
        return;
      }
      const progress = await executor.getCampaignProgress(req.params.id);
      res.json({ success: true, data: progress });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/jobs', async (req, res) => {
    try {
      const query = req.query as Record<string, string | undefined>;
      const page = parseInt(query['page'] ?? '1', 10);
      const limit = parseInt(query['limit'] ?? '20', 10);
      const status = query['status'];
      const campaignId = query['campaignId'];

      const where: Record<string, unknown> = {};
      if (status) where['status'] = status;
      if (campaignId) where['campaignId'] = campaignId;

      const [items, total] = await Promise.all([
        prisma.outreachJob.findMany({
          where: where as any,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.outreachJob.count({ where: where as any }),
      ]);

      res.json({
        success: true,
        data: { items, total, page, limit },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/jobs/:id', async (req, res) => {
    try {
      const job = await prisma.outreachJob.findUnique({ where: { id: req.params.id } });
      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/queue/status', async (_req, res) => {
    try {
      const status = await executor.getQueueStatus();
      res.json({ success: true, data: status });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/queue/dead-letter', async (req, res) => {
    try {
      const campaignId = req.query['campaignId'] as string | undefined;
      const entries = await executor.getDeadLetterQueue(campaignId);
      res.json({ success: true, data: entries });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/workers', async (_req, res) => {
    try {
      const workers = executor.getWorkers();
      res.json({ success: true, data: workers });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/scheduler/status', async (_req, res) => {
    try {
      const state = executor.getSchedulerState();
      res.json({ success: true, data: state });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  return { router, executor, start: async () => executor.start(), stop: async () => executor.stop() };
}
