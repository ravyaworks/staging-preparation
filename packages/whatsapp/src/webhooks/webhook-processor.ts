import type { Logger } from '@conversation-platform/logger'
import type { DeliveryTracker } from '@conversation-platform/delivery-tracking'
import type { IncomingPipeline } from '@conversation-platform/inbox-engine'
import type { WhatsAppWebhookPayload, WebhookChange } from '../types'

function isMessageStatus(entry: WebhookChange): boolean {
  return !!entry.value?.statuses?.[0]
}

function isIncomingMessage(entry: WebhookChange): boolean {
  return !!entry.value?.messages?.[0]
}

function extractStatusInfo(entry: WebhookChange): {
  messageId: string
  status: string
  timestamp: string
  recipientPhone: string
  error?: { code: number; title: string }
} | null {
  const statuses = entry.value?.statuses
  if (!statuses?.length) return null
  const s = statuses[0]!
  return {
    messageId: s.id,
    status: s.status,
    timestamp: s.timestamp,
    recipientPhone: s.recipient_id,
    error: s.errors?.[0]
      ? { code: s.errors[0].code, title: s.errors[0].title }
      : undefined,
  }
}

function extractIncomingMessage(entry: WebhookChange): {
  messageId: string
  from: string
  text?: string
  timestamp: string
  messageType: string
} | null {
  const messages = entry.value?.messages
  if (!messages?.length) return null
  const m = messages[0]!
  return {
    messageId: m.id,
    from: m.from,
    text: m.text?.body,
    timestamp: m.timestamp,
    messageType: m.type,
  }
}

function mapWhatsAppStatusToDeliveryStatus(whatsappStatus: string): string {
  switch (whatsappStatus) {
    case 'sent': return 'sent'
    case 'delivered': return 'completed'
    case 'read': return 'completed'
    case 'failed': return 'failed'
    default: return whatsappStatus
  }
}

function mapWhatsAppStatusToEventType(whatsappStatus: string): string {
  switch (whatsappStatus) {
    case 'sent': return 'job.sent'
    case 'delivered': return 'job.completed'
    case 'read': return 'job.completed'
    case 'failed': return 'job.failed'
    default: return `job.${whatsappStatus}`
  }
}

interface WebhookResult {
  recordedEvents: number
  acknowledgedStatuses: Array<{ messageId: string; status: string }>
  incomingMessages: Array<{ from: string; text?: string }>
}

export class WhatsAppWebhookProcessor {
  constructor(
    private readonly deliveryTracker: DeliveryTracker,
    private readonly logger: Logger,
    private readonly inboxPipeline?: IncomingPipeline,
  ) {}

  async process(payload: WhatsAppWebhookPayload, tenantId?: string): Promise<WebhookResult> {
    const result: WebhookResult = {
      recordedEvents: 0,
      acknowledgedStatuses: [],
      incomingMessages: [],
    }

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (isMessageStatus(change)) {
          const info = extractStatusInfo(change)
          if (info) {
            const deliveryStatus = mapWhatsAppStatusToDeliveryStatus(info.status)
            const eventType = mapWhatsAppStatusToEventType(info.status)

            await this.deliveryTracker.recordEvent(
              info.messageId,
              eventType,
              deliveryStatus,
              null,
              {
                channel: 'whatsapp',
                metadata: {
                  waMessageId: info.messageId,
                  recipientPhone: info.recipientPhone,
                  timestamp: info.timestamp,
                  error: info.error
                    ? { code: info.error.code, title: info.error.title }
                    : undefined,
                  provider: 'whatsapp-business-platform',
                },
              },
            )

            const trackedEvent: { messageId: string; status: string } = {
              messageId: info.messageId,
              status: info.status,
            }
            result.acknowledgedStatuses.push(trackedEvent)
            result.recordedEvents++

            this.logger.info(
              {
                messageId: info.messageId,
                status: info.status,
                deliveryStatus,
                recipient: info.recipientPhone,
              },
              'WhatsApp status update recorded',
            )
          }
        }

        if (isIncomingMessage(change)) {
          const msg = extractIncomingMessage(change)
          if (msg) {
            result.incomingMessages.push({ from: msg.from, text: msg.text })

            this.logger.info(
              {
                from: msg.from,
                messageType: msg.messageType,
                messageId: msg.messageId,
              },
              'WhatsApp incoming message received',
            )

            if (this.inboxPipeline && tenantId) {
              try {
                const { createWhatsAppAdapter } = await import('../adapter/whatsapp-adapter')
                const adapter = createWhatsAppAdapter(this.logger)
                const pipelineResult = await this.inboxPipeline.process({
                  tenantId,
                  adapter,
                  payload: payload as unknown as Record<string, unknown>,
                })
                if (pipelineResult.success) {
                  this.logger.info(
                    { conversationId: pipelineResult.context?.conversation.conversationId },
                    'Incoming message processed by inbox pipeline',
                  )
                } else {
                  this.logger.warn(
                    { error: pipelineResult.error },
                    'Inbox pipeline processing failed',
                  )
                }
              } catch (pipelineError) {
                this.logger.error(
                  { error: pipelineError },
                  'Failed to process incoming message through inbox pipeline',
                )
              }
            }
          }
        }
      }
    }

    return result
  }
}
