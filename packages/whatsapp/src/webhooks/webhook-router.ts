import type { Request, Response } from 'express'
import type { Logger } from '@conversation-platform/logger'
import type { DeliveryTracker } from '@conversation-platform/delivery-tracking'
import type { WhatsAppConfig, WhatsAppWebhookPayload } from '../types'
import { WhatsAppApiClient } from '../client/whatsapp-api-client'
import { WhatsAppAuth } from '../auth/whatsapp-auth'
import { WhatsAppValidator } from '../validation/whatsapp-validator'
import { WhatsAppWebhookProcessor } from './webhook-processor'

export function createWebhookRouter(
  config: WhatsAppConfig,
  deliveryTracker: DeliveryTracker,
  client: WhatsAppApiClient,
  logger: Logger,
) {
  const auth = new WhatsAppAuth()
  const validator = new WhatsAppValidator()
  const processor = new WhatsAppWebhookProcessor(deliveryTracker, logger)

  return {
    handleVerification: async (req: Request, res: Response): Promise<void> => {
      const mode = req.query['hub.mode'] as string
      const token = req.query['hub.verify_token'] as string
      const challenge = req.query['hub.challenge'] as string

      if (!mode || !token || !challenge) {
        res.status(400).send('Missing verification parameters')
        return
      }

      const result = await client.verifyWebhook(mode, token, challenge)
      if (result) {
        logger.info('WhatsApp webhook verified')
        res.status(200).send(result)
      } else {
        logger.warn('WhatsApp webhook verification failed')
        res.status(403).send('Verification failed')
      }
    },

    handleNotification: async (req: Request, res: Response): Promise<void> => {
      if (!validator.validateWebhookPayload(req.body)) {
        logger.warn('Invalid webhook payload received')
        res.status(400).json({ error: 'Invalid payload' })
        return
      }

      try {
        const result = await processor.process(req.body as WhatsAppWebhookPayload)
        logger.info(
          {
            recordedEvents: result.recordedEvents,
            statusUpdates: result.acknowledgedStatuses.length,
            incomingMessages: result.incomingMessages.length,
          },
          'Webhook processed successfully',
        )
        res.status(200).json({ success: true })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error({ error: message }, 'Webhook processing failed')
        res.status(500).json({ error: message })
      }
    },

    handleTest: async (req: Request, res: Response): Promise<void> => {
      res.status(200).json({
        status: 'ok',
        message: 'WhatsApp webhook endpoint is active',
        timestamp: new Date().toISOString(),
        config: {
          phoneNumberId: config.phoneNumberId,
          businessAccountId: config.businessAccountId,
          webhookConfigured: !!config.webhookVerifyToken,
        },
      })
    },
  }
}
