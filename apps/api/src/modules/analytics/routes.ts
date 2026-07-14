import { Router } from 'express'
import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import { authenticate } from '@conversation-platform/auth'
import type { AuthContext } from '@conversation-platform/auth'
import { getPrismaClient } from '@conversation-platform/database'
import { AnalyticsService } from '@conversation-platform/analytics'

type AuthRequest = import('express').Request & { auth: AuthContext }

function getAuth(req: import('express').Request): AuthContext {
  return (req as AuthRequest).auth
}

async function getOrgId(userId: string): Promise<string> {
  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })
  if (!user?.organizationId) throw new Error('User has no organization')
  return user.organizationId
}

function getJwtConfig(config: AppConfig) {
  return {
    secret: config.auth.jwtSecret,
    expiresIn: 900,
    refreshSecret: config.auth.refreshSecret,
    refreshExpiresIn: 604800,
    issuer: config.auth.issuer,
  }
}

export function createAnalyticsRoutes(config: AppConfig, logger: Logger) {
  const router = Router()
  const prisma = getPrismaClient()
  const analyticsService = new AnalyticsService(prisma, logger)

  router.use(authenticate(getJwtConfig(config)))

  router.get('/overview', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const result = await analyticsService.getOverview(orgId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/campaigns', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const { startDate, endDate, channel } = req.query as Record<string, string | undefined>
      const result = await analyticsService.getCampaignAnalytics(orgId, startDate, endDate, channel)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/conversations', async (req, res) => {
    try {
      const auth = getAuth(req)
      const { channel, startDate, endDate, organizationId } = req.query as Record<string, string | undefined>
      const result = await analyticsService.getConversationAnalytics(auth.tenantId, organizationId, channel, startDate, endDate)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/delivery', async (req, res) => {
    try {
      const { campaignId, startDate, endDate } = req.query as Record<string, string | undefined>
      const result = await analyticsService.getDeliveryAnalytics(campaignId, startDate, endDate)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/queue', async (_req, res) => {
    try {
      const result = await analyticsService.getQueueAnalytics()
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/agents', async (req, res) => {
    try {
      const auth = getAuth(req)
      const result = await analyticsService.getAgentAnalytics(auth.tenantId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/workflows', async (_req, res) => {
    try {
      const result = await analyticsService.getWorkflowAnalytics()
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/channels', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const result = await analyticsService.getChannelAnalytics(orgId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/ai', async (req, res) => {
    try {
      const auth = getAuth(req)
      const result = await analyticsService.getAIAnalytics(auth.tenantId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/contacts', async (req, res) => {
    try {
      const auth = getAuth(req)
      const result = await analyticsService.getContactAnalytics(auth.tenantId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/organizations', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const result = await analyticsService.getOrganizationAnalytics(orgId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/reports', async (req, res) => {
    try {
      const auth = getAuth(req)
      const orgId = await getOrgId(auth.userId)
      const { type, format, startDate, endDate } = req.query as Record<string, string | undefined>
      const reportFormat = (format ?? 'csv') as 'csv' | 'xlsx' | 'pdf'

      let result
      switch (type) {
        case 'campaign':
          result = await analyticsService.reportGenerator.generateCampaignReport(orgId, startDate, endDate, reportFormat)
          break
        case 'conversation':
          result = await analyticsService.reportGenerator.generateConversationReport(auth.tenantId, startDate, endDate, reportFormat)
          break
        case 'delivery':
          result = await analyticsService.reportGenerator.generateDeliveryReport(undefined, startDate, endDate, reportFormat)
          break
        case 'organization':
          result = await analyticsService.reportGenerator.generateOrganizationReport(orgId, reportFormat)
          break
        default:
          res.status(400).json({ success: false, error: `Invalid report type: ${type}` })
          return
      }

      res.set('Content-Type', result.mimeType)
      res.set('Content-Disposition', `attachment; filename="${result.filename}"`)
      res.send(result.buffer)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/cache/invalidate', async (_req, res) => {
    try {
      analyticsService.invalidateCache()
      res.json({ success: true, data: { message: 'Cache invalidated' } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  return router
}
