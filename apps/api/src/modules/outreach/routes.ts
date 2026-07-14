import { Router } from 'express'
import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import { authenticate } from '@conversation-platform/auth'
import type { AuthContext } from '@conversation-platform/auth'
import { getPrismaClient } from '@conversation-platform/database'
import { OutreachApiService, outreachQuerySchema, createApiKeySchema } from '@conversation-platform/outreach-integration'

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

export function createOutreachModuleRoutes(config: AppConfig, logger: Logger) {
  const router = Router()
  const prisma = getPrismaClient()
  const outreachService = new OutreachApiService(prisma, logger)

  router.use(authenticate(getJwtConfig(config)))

  router.post('/', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const result = await outreachService.submitSingle(req.body, orgId, getAuth(req).userId)
      res.status(result.success ? 201 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/bulk', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const { businesses } = req.body
      if (!Array.isArray(businesses)) {
        res.status(400).json({ success: false, error: 'businesses array is required' })
        return
      }
      const result = await outreachService.submitBulk(businesses, orgId, getAuth(req).userId)
      res.status(result.success ? 201 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/import', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const { type, data, campaignName, campaignId } = req.body
      if (!type || !data) {
        res.status(400).json({ success: false, error: 'type and data are required' })
        return
      }
      const result = await outreachService.submitImport(type, data, orgId, campaignName, campaignId, getAuth(req).userId)
      res.status(result.success ? 201 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/jobs', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await outreachService.listImportJobs(orgId, page, limit)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/jobs/:id', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const result = await outreachService.getImportJobStatus(req.params.id, orgId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/jobs/:id/records', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      const result = await outreachService.getImportJobRecords(req.params.id, orgId, page, limit)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/businesses', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const params = outreachQuerySchema.parse(req.query)
      const result = await outreachService.listBusinesses(orgId, params)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      if (error instanceof Error && 'issues' in error) {
        res.status(400).json({ success: false, error: 'Invalid query parameters', details: error })
        return
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/businesses/:id', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const result = await outreachService.getBusiness(req.params.id, orgId)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      if (error instanceof Error && 'statusCode' in error) {
        const status = (error as any).statusCode
        res.status(status).json({ success: false, error: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/businesses/:id/traceability', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const trace = await outreachService.getTraceability(req.params.id)
      res.json({ success: true, data: trace })
    } catch (error: unknown) {
      if (error instanceof Error && 'statusCode' in error) {
        const status = (error as any).statusCode
        res.status(status).json({ success: false, error: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/campaigns/:id/outreach', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const { businesses } = req.body
      if (!Array.isArray(businesses)) {
        res.status(400).json({ success: false, error: 'businesses array is required' })
        return
      }
      const result = await outreachService.submitToCampaign(req.params.id, businesses, orgId, getAuth(req).userId)
      res.status(result.success ? 201 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/api-keys', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const keys = await outreachService.apiKeyService.list(orgId)
      res.json({ success: true, data: keys })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/api-keys', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      const parsed = createApiKeySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.issues })
        return
      }
      const key = await outreachService.apiKeyService.create(parsed.data, orgId, getAuth(req).userId)
      res.status(201).json({ success: true, data: key })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.delete('/api-keys/:id', async (req, res) => {
    try {
      const orgId = await getOrgId(getAuth(req).userId)
      await outreachService.apiKeyService.revoke(req.params.id, orgId)
      res.json({ success: true, data: { revoked: true } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  return router
}
