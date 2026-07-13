import { Router } from 'express';
import type { Request } from 'express';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { authenticate } from '@conversation-platform/auth';
import type { AuthContext } from '@conversation-platform/auth';
import { getPrismaClient } from '@conversation-platform/database';
import { CampaignService } from '@conversation-platform/campaign';
import { CampaignImportService } from '@conversation-platform/campaign';
import { CampaignStatisticsService } from '@conversation-platform/campaign';
import { CampaignValidationService } from '@conversation-platform/campaign';
import {
  createCampaignSchema,
  updateCampaignSchema,
  importBusinessSchema,
  campaignQuerySchema,
  businessQuerySchema,
} from '@conversation-platform/campaign';
import { CampaignError } from '@conversation-platform/campaign';

type AuthRequest = Request & { auth: AuthContext };
function getAuth(req: Request): AuthContext {
  return (req as AuthRequest).auth;
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

async function getUserOrgId(userId: string): Promise<string> {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  if (!user?.organizationId) {
    throw new CampaignError('User has no organization', 'NO_ORGANIZATION', 403);
  }
  return user.organizationId;
}

export function createCampaignRoutes(config: AppConfig, logger: Logger) {
  const router = Router();
  const jwtConfig = getJwtConfig(config);
  const prisma = getPrismaClient();

  const campaignService = new CampaignService(prisma, logger);
  const importService = new CampaignImportService(prisma, logger);
  const statsService = new CampaignStatisticsService(prisma, logger);
  const validationService = new CampaignValidationService();

  router.use(authenticate(jwtConfig));

  router.get('/', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const query = campaignQuerySchema.parse(req.query);
      const result = await campaignService.findAll(orgId, query);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await campaignService.findById(req.params.id, orgId);
      res.json({ success: true, data: campaign });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const input = createCampaignSchema.parse(req.body);
      const campaign = await campaignService.create(input, orgId, getAuth(req).userId);
      res.status(201).json({ success: true, data: campaign });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const input = updateCampaignSchema.parse(req.body);
      const campaign = await campaignService.update(req.params.id, input, orgId, getAuth(req).userId);
      res.json({ success: true, data: campaign });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      await campaignService.delete(req.params.id, orgId, getAuth(req).userId);
      res.json({ success: true, data: null });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/:id/duplicate', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await campaignService.duplicate(req.params.id, orgId, getAuth(req).userId);
      res.status(201).json({ success: true, data: campaign });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/:id/transition', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        res.status(400).json({ success: false, error: 'Status is required' });
        return;
      }
      const result = await campaignService.transitionStatus(req.params.id, status as any, orgId, getAuth(req).userId);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });

  router.post('/:id/import', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      const campaign = await campaignService.findById(req.params.id, orgId);
      if (!campaign) {
        res.status(404).json({ success: false, error: 'Campaign not found' });
        return;
      }
      const input = importBusinessSchema.parse(req.body);
      const result = await importService.importBusinesses(req.params.id, input.businesses.map(b => ({
        businessName: b.businessName,
        phone: b.phone,
        email: b.email || undefined,
        industry: b.industry || undefined,
        previewUrl: b.previewUrl || undefined,
        personalizedMessage: b.personalizedMessage,
      })));
      res.status(201).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  });

  router.get('/:id/businesses', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      await campaignService.findById(req.params.id, orgId);
      const query = businessQuerySchema.parse(req.query);
      const businesses = await prisma.campaignBusiness.findMany({
        where: { campaignId: req.params.id, ...(query.status ? { status: query.status } : {}) },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      });
      const total = await prisma.campaignBusiness.count({
        where: { campaignId: req.params.id, ...(query.status ? { status: query.status } : {}) },
      });
      res.json({
        success: true,
        data: { items: businesses, total, page: query.page, limit: query.limit },
      });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/:id/statistics', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      await campaignService.findById(req.params.id, orgId);
      const stats = await statsService.getStatistics(req.params.id);
      res.json({ success: true, data: stats });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/:id/statistics/recalculate', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      await campaignService.findById(req.params.id, orgId);
      const stats = await statsService.recalculate(req.params.id);
      res.json({ success: true, data: stats });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/:id/logs', async (req, res) => {
    try {
      const orgId = await getUserOrgId(getAuth(req).userId);
      await campaignService.findById(req.params.id, orgId);
      const logs = await prisma.campaignLog.findMany({
        where: { campaignId: req.params.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: logs });
    } catch (error: unknown) {
      if (error instanceof CampaignError) {
        res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
