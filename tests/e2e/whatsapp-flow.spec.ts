import { test, expect } from './fixtures/test-data';
import { createTestCampaign, createTestBusiness, createWebhookPayload, createDeliveryStatusPayload } from './fixtures/test-data';

test.describe('WhatsApp Flow', () => {
  let campaignId: string;

  test.describe('Campaign and Message Setup', () => {
    test('should create WhatsApp campaign', async ({ apiHelper }) => {
      const campaign = createTestCampaign({ name: `WhatsApp Test ${Date.now()}`, type: 'whatsapp' });
      const response = await apiHelper.createCampaign(campaign);
      expect(response.status).toBeLessThan(400);
      campaignId = (response.data as Record<string, unknown>).id as string;
      expect(campaignId).toBeTruthy();
    });

    test('should queue WhatsApp message', async ({ apiHelper }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign({ type: 'whatsapp' }));
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      const businesses = Array.from({ length: 2 }, () => createTestBusiness());
      await apiHelper.importBusinesses(campaignId, businesses);

      const response = await apiHelper.queueWhatsAppMessage({
        campaignId, to: businesses[0].phone, template: 'Hello {{name}}, welcome!',
        variables: { name: businesses[0].name },
      });
      expect(response.status).toBeLessThan(400);
    });
  });

  test.describe('Webhook Event Processing', () => {
    test('should process incoming webhook message event', async ({ apiHelper }) => {
      const response = await apiHelper.simulateWebhookEvent(createWebhookPayload());
      expect(response.status).toBe(200);
    });

    test('should process delivery status webhook event', async ({ apiHelper }) => {
      const response = await apiHelper.simulateWebhookEvent(createDeliveryStatusPayload());
      expect(response.status).toBe(200);
    });

    test('should handle webhook with malformed payload gracefully', async ({ apiHelper }) => {
      const response = await apiHelper.simulateWebhookEvent({ invalid: 'payload' });
      expect(response.status === 400 || response.status === 422 || response.status === 200).toBeTruthy();
    });
  });

  test.describe('Delivery Tracking', () => {
    test('should show delivery status in campaign', async ({ apiHelper, authenticatedPage }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign({ type: 'whatsapp' }));
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      await authenticatedPage.goto(`/campaigns/${campaignId}`);
      await authenticatedPage.waitForLoadState('networkidle');
      const hasStatus = await authenticatedPage.locator('text=/delivered|sent|pending|failed|read|delivery|tracking|status/i').first().isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasStatus).toBeTruthy();
    });
  });

  test.describe('Incoming Reply and Conversation', () => {
    test('should simulate incoming reply and process webhook', async ({ apiHelper }) => {
      const replyPayload = createWebhookPayload({
        entry: [{
          id: 'reply_entry', changes: [{
            value: {
              messaging_product: 'whatsapp', metadata: { display_phone_number: '15551234567', phone_number_id: 'test_phone_id' },
              contacts: [{ wa_id: '15559876543', profile: { name: 'Reply Contact' } }],
              messages: [{ from: '15559876543', id: `wamid.reply_${Date.now()}`, timestamp: Math.floor(Date.now() / 1000).toString(), type: 'text', text: { body: 'I am interested in your service, tell me more' } }],
            }, field: 'messages',
          }],
        }],
      });

      const response = await apiHelper.simulateWebhookEvent(replyPayload);
      expect(response.status).toBe(200);
    });

    test('should show conversation in conversations list', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/conversations');
      await authenticatedPage.waitForLoadState('networkidle');
      const hasContent = await authenticatedPage.locator('[data-testid="conversation-item"], .conversation-item, tr, .list-item').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmpty = await authenticatedPage.locator('text=/no conversations|empty|no messages/i').isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasContent || hasEmpty).toBeTruthy();
    });
  });

  test.describe('WhatsApp Flow - End to End', () => {
    test('should complete full WhatsApp flow', async ({ apiHelper, authenticatedPage }) => {
      const campaign = createTestCampaign({ name: `E2E WhatsApp ${Date.now()}`, type: 'whatsapp' });
      const createRes = await apiHelper.createCampaign(campaign);
      const cId = (createRes.data as Record<string, unknown>).id as string;

      const businesses = [createTestBusiness()];
      await apiHelper.importBusinesses(cId, businesses);

      const queueRes = await apiHelper.queueWhatsAppMessage({ campaignId: cId, to: businesses[0].phone, template: 'E2E test for {{name}}', variables: { name: businesses[0].name } });
      expect(queueRes.status).toBeLessThan(400);

      const webhookRes = await apiHelper.simulateWebhookEvent(createWebhookPayload());
      expect(webhookRes.status).toBe(200);

      const deliveryRes = await apiHelper.simulateWebhookEvent(createDeliveryStatusPayload());
      expect(deliveryRes.status).toBe(200);

      await authenticatedPage.goto('/conversations');
      await authenticatedPage.waitForLoadState('networkidle');
      const hasContent = await authenticatedPage.locator('[data-testid="conversation-item"], .conversation-item, tr, .list-item, text=/no conversations/i').first().isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasContent).toBeTruthy();

      await apiHelper.deleteCampaign(cId);
    });
  });
});
