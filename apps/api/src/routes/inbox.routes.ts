import { Router } from 'express'
import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import { authenticate } from '@conversation-platform/auth'
import type { AuthContext } from '@conversation-platform/auth'
import {
  createIncomingPipeline,
  createContactService,
  createConversationService,
  createHumanHandoffService,
} from '@conversation-platform/inbox-engine'
import { createWhatsAppAdapter } from '@conversation-platform/whatsapp'
import type { IncomingChannelAdapter } from '@conversation-platform/inbox-engine'
import { metricsCounter, metricsHistogram } from '../middleware/metrics'

type AuthRequest = import('express').Request & { auth: AuthContext }

function getAuth(req: import('express').Request): AuthContext {
  return (req as AuthRequest).auth
}

const channelAdapters = new Map<string, IncomingChannelAdapter>()

export function createInboxRoutes(config: AppConfig, logger: Logger): Router {
  const router = Router()

  const pipeline = createIncomingPipeline({
    aiEngine: null,
    workflowEngine: null,
    knowledgeEngine: null,
    conversationEngine: null,
    queueService: null,
    logger,
  })

  const contactService = createContactService(logger)
  const conversationService = createConversationService(logger)
  const handoffService = createHumanHandoffService(logger)

  // Register WhatsApp adapter by default
  const whatsappAdapter = createWhatsAppAdapter(logger)
  channelAdapters.set('whatsapp', whatsappAdapter)

  // ===== Webhook ingestion (no auth, called by external channels) =====

  router.post('/webhook/:channel', async (req, res) => {
    const channel = req.params.channel
    const tenantId = req.headers['x-tenant-id'] as string
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'x-tenant-id header required' })
      return
    }

    const adapter = channelAdapters.get(channel)
    if (!adapter) {
      res.status(400).json({ success: false, error: `Unknown channel: ${channel}` })
      return
    }

    const metricsStart = Date.now()
    try {
      const result = await pipeline.process({ tenantId, adapter, payload: req.body })
      const duration = Date.now() - metricsStart
      metricsCounter?.('inbox_messages_processed', 1, { channel, status: result.success ? 'success' : 'failed' })
      metricsHistogram?.('inbox_processing_duration_ms', duration, { channel })

      if (result.success) {
        res.status(200).json({ success: true, data: { conversationId: result.context?.conversation.conversationId } })
      } else {
        res.status(422).json({ success: false, error: result.error })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error({ error: message, channel }, 'Inbox webhook processing failed')
      metricsCounter?.('inbox_messages_processed', 1, { channel, status: 'error' })
      res.status(500).json({ success: false, error: message })
    }
  })

  // ===== Authenticated routes =====

  router.use(authenticate({ secret: config.auth.jwtSecret, expiresIn: 900, refreshSecret: config.auth.refreshSecret, refreshExpiresIn: 604800, issuer: config.auth.issuer }))

  // ----- Contacts -----

  router.get('/contacts', async (req, res) => {
    try {
      const auth = getAuth(req)
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = req.query.search as string | undefined
      const result = await contactService.list(auth.tenantId, { page, limit, search })
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/contacts/:id', async (req, res) => {
    try {
      const contact = await contactService.getById(req.params.id)
      if (!contact) {
        res.status(404).json({ success: false, error: 'Contact not found' })
        return
      }
      res.json({ success: true, data: contact })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.patch('/contacts/:id', async (req, res) => {
    try {
      const contact = await contactService.update(req.params.id, req.body)
      res.json({ success: true, data: contact })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/contacts/:id/block', async (req, res) => {
    try {
      const contact = await contactService.block(req.params.id)
      res.json({ success: true, data: contact })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/contacts/:id/unblock', async (req, res) => {
    try {
      const contact = await contactService.unblock(req.params.id)
      res.json({ success: true, data: contact })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // ----- Conversations -----

  router.get('/conversations', async (req, res) => {
    try {
      const auth = getAuth(req)
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await conversationService.list({
        tenantId: auth.tenantId,
        status: req.query.status as string | undefined,
        channel: req.query.channel as string | undefined,
        priority: req.query.priority as string | undefined,
        assignedToId: req.query.assignedToId as string | undefined,
        contactId: req.query.contactId as string | undefined,
        search: req.query.search as string | undefined,
        page,
        limit,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      })
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/conversations/:id', async (req, res) => {
    try {
      const conversation = await conversationService.getById(req.params.id)
      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' })
        return
      }
      res.json({ success: true, data: conversation })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.patch('/conversations/:id/status', async (req, res) => {
    try {
      const { status } = req.body
      if (!status) {
        res.status(400).json({ success: false, error: 'status is required' })
        return
      }
      const conversation = await conversationService.updateStatus(req.params.id, status)
      res.json({ success: true, data: conversation })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.patch('/conversations/:id/priority', async (req, res) => {
    try {
      const { priority } = req.body
      if (!priority) {
        res.status(400).json({ success: false, error: 'priority is required' })
        return
      }
      const conversation = await conversationService.updatePriority(req.params.id, priority)
      res.json({ success: true, data: conversation })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/conversations/:id/close', async (req, res) => {
    try {
      const conversation = await conversationService.close(req.params.id)
      res.json({ success: true, data: conversation })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/conversations/:id/reopen', async (req, res) => {
    try {
      const conversation = await conversationService.reopen(req.params.id)
      res.json({ success: true, data: conversation })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // ----- Messages -----

  router.get('/conversations/:id/messages', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      const result = await conversationService.getMessages(req.params.id, page, limit)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // ----- Human Handoff -----

  router.post('/conversations/:id/assign', async (req, res) => {
    try {
      const { assignedToId, assignedByName, reason } = req.body
      if (!assignedToId || !assignedByName) {
        res.status(400).json({ success: false, error: 'assignedToId and assignedByName are required' })
        return
      }
      const success = await handoffService.assign({
        conversationId: req.params.id,
        assignedToId,
        assignedByName,
        reason,
      })
      res.json({ success, data: { assigned: success } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/conversations/:id/release', async (req, res) => {
    try {
      const success = await handoffService.release(req.params.id)
      res.json({ success, data: { released: success } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/conversations/:id/notes', async (req, res) => {
    try {
      const auth = getAuth(req)
      const { content } = req.body
      if (!content) {
        res.status(400).json({ success: false, error: 'content is required' })
        return
      }
      const note = await handoffService.addNote({
        conversationId: req.params.id,
        authorId: auth.userId,
        authorName: auth.email || auth.userId,
        content,
      })
      res.status(201).json({ success: true, data: note })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/conversations/:id/notes', async (req, res) => {
    try {
      const notes = await handoffService.getNotes(req.params.id)
      res.json({ success: true, data: notes })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // ----- Channel adapters -----

  router.post('/adapters/:channel/register', async (req, res) => {
    try {
      const channel = req.params.channel
      if (channelAdapters.has(channel)) {
        res.status(409).json({ success: false, error: `Adapter already registered for channel: ${channel}` })
        return
      }
      res.status(201).json({ success: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/adapters', (_req, res) => {
    const adapters = Array.from(channelAdapters.keys()).map(key => ({
      channel: key,
      info: channelAdapters.get(key)?.channelInfo,
    }))
    res.json({ success: true, data: adapters })
  })

  return router
}
