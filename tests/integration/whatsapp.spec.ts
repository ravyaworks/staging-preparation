import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhatsAppService, extractWebhookEvent, validateWebhookRequest } from '@conversation-platform/whatsapp';
import type { WhatsAppConfig, WebhookMessage, WebhookStatusUpdate } from '@conversation-platform/whatsapp';

function createTestConfig(overrides?: Partial<WhatsAppConfig>): WhatsAppConfig {
  return { phoneNumberId: overrides?.phoneNumberId ?? '123456789', businessAccountId: overrides?.businessAccountId ?? '987654321', apiVersion: overrides?.apiVersion ?? 'v18.0', accessToken: overrides?.accessToken ?? 'test-access-token', webhookVerifyToken: overrides?.webhookVerifyToken ?? 'test-verify-token', appSecret: overrides?.appSecret ?? 'test-app-secret', baseUrl: overrides?.baseUrl ?? 'https://graph.facebook.com' };
}

describe('WhatsApp Service Integration', () => {
  let service: WhatsAppService;

  beforeEach(() => { service = new WhatsAppService(createTestConfig()); });

  describe('Webhook Validation', () => {
    it('should validate a webhook request with correct token', () => {
      expect(validateWebhookRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-verify-token', 'hub.challenge': '123456789' }, createTestConfig())).toBe('123456789');
    });

    it('should reject a webhook request with wrong token', () => {
      expect(() => validateWebhookRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong-token', 'hub.challenge': '123456789' }, createTestConfig())).toThrow();
    });

    it('should reject a webhook request without mode', () => {
      expect(() => validateWebhookRequest({ 'hub.verify_token': 'test-verify-token', 'hub.challenge': '123456789' }, createTestConfig())).toThrow();
    });
  });

  describe('Webhook Event Extraction', () => {
    it('should extract a text message from webhook payload', () => {
      const event = extractWebhookEvent(createTextPayload());
      expect(event.type).toBe('message');
      expect(event.from).toBe('15551234567');
      expect(event.content).toBe('Hello!');
    });

    it('should extract a status update from webhook payload', () => {
      const event = extractWebhookEvent(createStatusPayload());
      expect(event.type).toBe('status');
      expect(event.status).toBe('delivered');
      expect(event.messageId).toBe('wamid.test123');
    });

    it('should extract reaction from message', () => {
      const payload = createTextPayload();
      payload.entry![0].changes[0].value.messages![0].reaction = { emoji: '\u2764\uFE0F', message_id: 'wamid.react-to' };
      const event = extractWebhookEvent(payload);
      expect(event.messageType).toBe('reaction');
    });

    it('should extract interactive button reply', () => {
      const payload = createTextPayload();
      payload.entry![0].changes[0].value.messages![0].interactive = { button_reply: { id: 'btn_1', title: 'Yes' } };
      payload.entry![0].changes[0].value.messages![0].text = undefined;
      const event = extractWebhookEvent(payload);
      expect(event.messageType).toBe('interactive');
      expect(event.content).toBe('Yes');
    });

    it('should extract interactive list reply', () => {
      const payload = createTextPayload();
      payload.entry![0].changes[0].value.messages![0].interactive = { list_reply: { id: 'list_1', title: 'Option A', description: 'Description of A' } };
      payload.entry![0].changes[0].value.messages![0].text = undefined;
      const event = extractWebhookEvent(payload);
      expect(event.messageType).toBe('interactive');
    });

    it('should return null for invalid payload', () => {
      expect(extractWebhookEvent({})).toBeNull();
    });
  });

  describe('Message Sending', () => {
    it('should send a text message', async () => {
      const result = await service.sendText('15551234567', 'Hello World');
      expect(result.success).toBe(true);
    });

    it('should send a template message', async () => {
      const result = await service.sendTemplate('15551234567', 'hello_world', [{ type: 'body', parameters: [{ type: 'text', text: 'John' }] }]);
      expect(result.success).toBe(true);
    });

    it('should handle send errors gracefully', async () => {
      const result = await service.sendText('', '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      const promises = Array.from({ length: 250 }, (_, i) => service.sendText('15551234567', `Message ${i}`));
      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Media Handling', () => {
    it('should upload media', async () => {
      const result = await service.uploadMedia(Buffer.from('test'), 'image/jpeg', 'test.jpg');
      expect(result.success).toBe(true);
    });

    it('should retrieve media URL', async () => {
      const result = await service.getMediaUrl('media-id-123');
      expect(result.success).toBe(true);
    });

    it('should download media', async () => {
      const result = await service.downloadMedia('media-id-123');
      expect(result.success).toBe(true);
    });
  });
});

function createTextPayload() {
  return { object: 'whatsapp_business_account', entry: [{ id: '987654321', changes: [{ value: { messaging_product: 'whatsapp', metadata: { phone_number_id: '123456789', display_phone_number: '15551234567' }, contacts: [{ profile: { name: 'John' }, wa_id: '15551234567' }], messages: [{ from: '15551234567', id: 'wamid.test123', timestamp: String(Math.floor(Date.now() / 1000)), text: { body: 'Hello!' }, type: 'text' }] }, field: 'messages' }] }] };
}

function createStatusPayload() {
  return { object: 'whatsapp_business_account', entry: [{ id: '987654321', changes: [{ value: { messaging_product: 'whatsapp', metadata: { phone_number_id: '123456789', display_phone_number: '15551234567' }, statuses: [{ id: 'wamid.status123', recipient_id: '15551234567', status: 'delivered', timestamp: String(Math.floor(Date.now() / 1000)), type: 'message' }] }, field: 'messages' }] }] };
}
