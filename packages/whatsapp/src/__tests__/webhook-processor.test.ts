import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WhatsAppWebhookProcessor } from '../webhooks/webhook-processor'
import type { WhatsAppWebhookPayload } from '../types'

function createMockDeliveryTracker() {
  return {
    recordEvent: vi.fn().mockResolvedValue({ id: 'evt-1' }),
    recordTransition: vi.fn(),
    getJobTimeline: vi.fn(),
    getJobEvents: vi.fn(),
    getJobLatestEvent: vi.fn(),
  }
}

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
    setLevel: vi.fn(),
    getLevel: vi.fn().mockReturnValue('debug'),
  }
}

describe('WhatsAppWebhookProcessor', () => {
  let processor: WhatsAppWebhookProcessor
  let deliveryTracker: ReturnType<typeof createMockDeliveryTracker>
  const logger = createMockLogger()

  beforeEach(() => {
    deliveryTracker = createMockDeliveryTracker()
    processor = new WhatsAppWebhookProcessor(deliveryTracker as any, logger)
  })

  it('should process sent status updates', async () => {
    const payload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '15551234567', phone_number_id: '123' },
            statuses: [{
              id: 'wamid-1',
              status: 'sent',
              timestamp: '1714000000',
              recipient_id: '15559876543',
              type: 'message',
            }],
          },
        }],
      }],
    }

    const result = await processor.process(payload)
    expect(result.recordedEvents).toBe(1)
    expect(result.acknowledgedStatuses).toHaveLength(1)
    expect(result.acknowledgedStatuses[0]).toEqual({ messageId: 'wamid-1', status: 'sent' })
    expect(deliveryTracker.recordEvent).toHaveBeenCalledWith(
      'wamid-1',
      'job.sent',
      'sent',
      null,
      expect.objectContaining({ channel: 'whatsapp' }),
    )
  })

  it('should process delivered status updates', async () => {
    const payload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '15551234567', phone_number_id: '123' },
            statuses: [{
              id: 'wamid-2',
              status: 'delivered',
              timestamp: '1714000001',
              recipient_id: '15559876543',
              type: 'message',
            }],
          },
        }],
      }],
    }

    const result = await processor.process(payload)
    expect(result.recordedEvents).toBe(1)
    expect(deliveryTracker.recordEvent).toHaveBeenCalledWith(
      'wamid-2',
      'job.completed',
      'completed',
      null,
      expect.any(Object),
    )
  })

  it('should process failed status with errors', async () => {
    const payload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '15551234567', phone_number_id: '123' },
            statuses: [{
              id: 'wamid-3',
              status: 'failed',
              timestamp: '1714000002',
              recipient_id: '15559876543',
              type: 'message',
              errors: [{ code: 130429, title: 'Message failed to deliver', message: 'Message failed to deliver' }],
            }],
          },
        }],
      }],
    }

    const result = await processor.process(payload)
    expect(result.recordedEvents).toBe(1)
    expect(deliveryTracker.recordEvent).toHaveBeenCalledWith(
      'wamid-3',
      'job.failed',
      'failed',
      null,
      expect.objectContaining({
        metadata: expect.objectContaining({
          error: { code: 130429, title: 'Message failed to deliver' },
        }),
      }),
    )
  })

  it('should process incoming messages', async () => {
    const payload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '15551234567', phone_number_id: '123' },
            messages: [{
              id: 'wamid-incoming',
              from: '15559876543',
              type: 'text',
              text: { body: 'Hello from customer' },
              timestamp: '1714000003',
            }],
          },
        }],
      }],
    }

    const result = await processor.process(payload)
    expect(result.incomingMessages).toHaveLength(1)
    expect(result.incomingMessages[0]).toEqual({ from: '15559876543', text: 'Hello from customer' })
  })

  it('should handle multiple changes in one payload', async () => {
    const payload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123' },
              statuses: [{
                id: 'wamid-s1', status: 'sent', timestamp: '1714000000', recipient_id: '15559876543', type: 'message',
              }],
            },
          },
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '123' },
              statuses: [{
                id: 'wamid-s2', status: 'delivered', timestamp: '1714000001', recipient_id: '15559876543', type: 'message',
              }],
            },
          },
        ],
      }],
    }

    const result = await processor.process(payload)
    expect(result.recordedEvents).toBe(2)
    expect(deliveryTracker.recordEvent).toHaveBeenCalledTimes(2)
  })
})
