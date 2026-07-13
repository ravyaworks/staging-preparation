import { Router } from 'express'
import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import { authenticate } from '@conversation-platform/auth'
import type { AuthContext } from '@conversation-platform/auth'
import { getPrismaClient } from '@conversation-platform/database'
import { DeliveryTracker } from '@conversation-platform/delivery-tracking'
import { loadWhatsAppConfig, WhatsAppBusinessSender, WhatsAppApiClient, TemplateService, MediaService, createWebhookRouter } from '@conversation-platform/whatsapp'
import { webhookLimiter } from '../middleware/rate-limit'

type AuthRequest = import('express').Request & { auth: AuthContext }

function getAuth(req: import('express').Request): AuthContext {
  return (req as AuthRequest).auth
}

export function createWhatsAppRoutes(config: AppConfig, logger: Logger): Router {
  const router = Router()
  const jwtConfig = {
    secret: config.auth.jwtSecret,
    expiresIn: 900,
    refreshSecret: config.auth.refreshSecret,
    refreshExpiresIn: 604800,
    issuer: config.auth.issuer,
  }
  const prisma = getPrismaClient()

  const whatsappConfig = loadWhatsAppConfig()
  const sender = new WhatsAppBusinessSender(whatsappConfig, logger)
  const client = sender.getClient()
  const deliveryTracker = new DeliveryTracker(prisma, logger)
  const templateService = new TemplateService(client, whatsappConfig, logger)
  const mediaService = new MediaService(client, whatsappConfig, logger)
  const webhookRouter = createWebhookRouter(whatsappConfig, deliveryTracker, client, logger)

  // === Webhook endpoints (no auth - called by Meta) ===

  router.get('/webhook', (req, res) => webhookRouter.handleVerification(req, res))
  router.post('/webhook', webhookLimiter, (req, res) => webhookRouter.handleNotification(req, res))
  router.get('/webhook/test', (req, res) => webhookRouter.handleTest(req, res))

  // === Authenticated endpoints ===

  router.use(authenticate(jwtConfig))

  // Health / Config

  router.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        phoneNumberId: whatsappConfig.phoneNumberId,
        businessAccountId: whatsappConfig.businessAccountId,
        configured: true,
      },
    })
  })

  // Send messages

  router.post('/send', async (req, res) => {
    try {
      const { recipientPhone, message, metadata } = req.body
      if (!recipientPhone || !message) {
        res.status(400).json({ success: false, error: 'recipientPhone and message are required' })
        return
      }
      const result = await sender.send(recipientPhone, message, metadata)
      res.status(result.success ? 200 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/send/image', async (req, res) => {
    try {
      const { recipientPhone, mediaId, caption } = req.body
      if (!recipientPhone || !mediaId) {
        res.status(400).json({ success: false, error: 'recipientPhone and mediaId are required' })
        return
      }
      const result = await sender.sendImage(recipientPhone, mediaId, caption)
      res.status(result.success ? 200 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/send/document', async (req, res) => {
    try {
      const { recipientPhone, mediaId, filename, caption } = req.body
      if (!recipientPhone || !mediaId) {
        res.status(400).json({ success: false, error: 'recipientPhone and mediaId are required' })
        return
      }
      const result = await sender.sendDocument(recipientPhone, mediaId, filename, caption)
      res.status(result.success ? 200 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/send/video', async (req, res) => {
    try {
      const { recipientPhone, mediaId, caption } = req.body
      if (!recipientPhone || !mediaId) {
        res.status(400).json({ success: false, error: 'recipientPhone and mediaId are required' })
        return
      }
      const result = await sender.sendVideo(recipientPhone, mediaId, caption)
      res.status(result.success ? 200 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/send/audio', async (req, res) => {
    try {
      const { recipientPhone, mediaId } = req.body
      if (!recipientPhone || !mediaId) {
        res.status(400).json({ success: false, error: 'recipientPhone and mediaId are required' })
        return
      }
      const result = await sender.sendAudio(recipientPhone, mediaId)
      res.status(result.success ? 200 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/send/template', async (req, res) => {
    try {
      const { recipientPhone, templateName, templateLanguage, templateVariables } = req.body
      if (!recipientPhone || !templateName) {
        res.status(400).json({ success: false, error: 'recipientPhone and templateName are required' })
        return
      }
      const result = await sender.send(
        recipientPhone,
        '', // message body not used for templates
        { templateName, templateLanguage, templateVariables: templateVariables ?? {} },
      )
      res.status(result.success ? 200 : 422).json({ success: result.success, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // Templates

  router.get('/templates', async (req, res) => {
    try {
      const templates = await templateService.syncTemplates()
      res.json({ success: true, data: templates })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/templates/:name', async (req, res) => {
    try {
      const template = await templateService.getTemplate(req.params.name)
      if (!template) {
        res.status(404).json({ success: false, error: 'Template not found' })
        return
      }
      res.json({ success: true, data: template })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.post('/templates', async (req, res) => {
    try {
      const { name, language, category, components } = req.body
      if (!name || !language || !category || !components) {
        res.status(400).json({ success: false, error: 'name, language, category, and components are required' })
        return
      }
      const template = await templateService.createTemplate(name, language, category, components)
      res.status(201).json({ success: true, data: template })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.delete('/templates/:id', async (req, res) => {
    try {
      const deleted = await templateService.deleteTemplate(req.params.id)
      res.json({ success: true, data: { deleted } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // Media

  router.post('/media/upload', async (req, res) => {
    try {
      const { filePath, mimeType } = req.body
      if (!filePath || !mimeType) {
        res.status(400).json({ success: false, error: 'filePath and mimeType are required' })
        return
      }
      const result = await mediaService.uploadMedia(filePath, mimeType)
      res.status(201).json({ success: true, data: result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  router.get('/media/:id', async (req, res) => {
    try {
      const url = await mediaService.getMediaUrl(req.params.id)
      res.json({ success: true, data: { mediaId: req.params.id, url } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ success: false, error: message })
    }
  })

  // Phone validation

  router.post('/validate/phone', (req, res) => {
    try {
      const validator = sender.getValidator()
      const cleaned = validator.validatePhoneNumber(req.body.phone)
      res.json({ success: true, data: { valid: true, e164: cleaned } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.json({ success: false, data: { valid: false }, error: message })
    }
  })

  return router
}
