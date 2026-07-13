import { Router } from 'express'
import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import { authenticate } from '@conversation-platform/auth'
import type { AuthContext } from '@conversation-platform/auth'
import { getPrismaClient } from '@conversation-platform/database'
import {
  DeliveryTracker,
  FailureTracker,
  JobDetailsService,
  AnalyticsService,
  WorkerTracker,
  NotificationGenerator,
  DeliveryTrackingError,
} from '@conversation-platform/delivery-tracking'

type AuthRequest = import('express').Request & { auth: AuthContext }

function getAuth(req: import('express').Request): AuthContext {
  return (req as AuthRequest).auth
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

export function createDeliveryTrackingRoutes(config: AppConfig, logger: Logger): Router {
  const router = Router()
  const jwtConfig = getJwtConfig(config)
  const prisma = getPrismaClient()

  const deliveryTracker = new DeliveryTracker(prisma, logger)
  const failureTracker = new FailureTracker(prisma, logger)
  const jobDetailsService = new JobDetailsService(prisma, deliveryTracker, failureTracker, logger)
  const analyticsService = new AnalyticsService(prisma, logger)
  const workerTracker = new WorkerTracker(prisma, logger)
  const notificationGenerator = new NotificationGenerator(prisma, logger)

  router.use(authenticate(jwtConfig))

  // === Job Details ===

  router.get('/jobs', async (req, res) => {
    try {
      const { campaignId, status, search, page, limit, sortBy, sortOrder } = req.query
      const result = await jobDetailsService.listJobs({
        campaignId: campaignId as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: (sortOrder as 'asc' | 'desc') ?? undefined,
      })
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/jobs/:id', async (req, res) => {
    try {
      const details = await jobDetailsService.getJobDetails(req.params.id)
      if (!details) {
        res.status(404).json({ success: false, error: 'Job not found' })
        return
      }
      res.json({ success: true, data: details })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/jobs/:id/timeline', async (req, res) => {
    try {
      const timeline = await deliveryTracker.getJobTimeline(req.params.id)
      res.json({ success: true, data: timeline })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/jobs/:id/events', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      const result = await deliveryTracker.getJobEvents(req.params.id, limit, offset)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // === Job Failures ===

  router.get('/jobs/:id/failures', async (req, res) => {
    try {
      const failures = await failureTracker.getJobFailures(req.params.id)
      res.json({ success: true, data: failures })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/failures', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      const result = await failureTracker.getUnresolvedFailures(limit, offset)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/failures/stats', async (req, res) => {
    try {
      const stats = await failureTracker.getFailureStats()
      res.json({ success: true, data: stats })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/failures/:id/resolve', async (req, res) => {
    try {
      const { jobId, resolutionStatus, resolvedBy } = req.body
      const result = await failureTracker.resolveFailure(jobId, resolutionStatus, resolvedBy)
      if (!result) {
        res.status(404).json({ success: false, error: 'No unresolved failure found for this job' })
        return
      }
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // === Analytics ===

  router.get('/analytics/delivery', async (req, res) => {
    try {
      const { periodStart, periodEnd, campaignId } = req.query
      const result = await analyticsService.getDeliveryAnalytics(
        periodStart ? new Date(periodStart as string) : undefined,
        periodEnd ? new Date(periodEnd as string) : undefined,
        campaignId as string | undefined,
      )
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/analytics/queue-health', async (req, res) => {
    try {
      const result = await analyticsService.getQueueHealth()
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // === Workers ===

  router.get('/workers', async (req, res) => {
    try {
      const workers = await workerTracker.getAllWorkers()
      res.json({ success: true, data: workers })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/workers/:id', async (req, res) => {
    try {
      const worker = await workerTracker.getWorkerStatus(req.params.id)
      if (!worker) {
        res.status(404).json({ success: false, error: 'Worker not found' })
        return
      }
      res.json({ success: true, data: worker })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // === Notifications ===

  router.get('/notifications', async (req, res) => {
    try {
      const { unreadOnly, severity, type, limit, offset } = req.query
      const result = await notificationGenerator.getNotifications({
        unreadOnly: unreadOnly === 'true',
        severity: severity as string | undefined,
        type: type as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      })
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/notifications/:id/acknowledge', async (req, res) => {
    try {
      const result = await notificationGenerator.acknowledge(req.params.id, getAuth(req).userId)
      if (!result) {
        res.status(404).json({ success: false, error: 'Notification not found' })
        return
      }
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // === Events (raw event recording for internal use) ===

  router.post('/events', async (req, res) => {
    try {
      const { jobId, eventType, currentStatus, previousStatus, workerId, channel, metadata } = req.body
      if (!jobId || !eventType || !currentStatus) {
        res.status(400).json({ success: false, error: 'jobId, eventType, and currentStatus are required' })
        return
      }
      const event = await deliveryTracker.recordEvent(jobId, eventType, currentStatus, previousStatus ?? null, {
        workerId: workerId ?? null,
        channel: channel ?? null,
        metadata: metadata ?? {},
      })
      res.status(201).json({ success: true, data: event })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  return router
}
