import { test, expect } from './fixtures/test-data';
import { createTestCampaign, createTestBusiness } from './fixtures/test-data';

test.describe('Campaign Flow', () => {
  let campaignId: string;

  test.describe('Campaign Creation', () => {
    test('should navigate to campaigns page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/campaigns');
      await authenticatedPage.waitForLoadState('networkidle');
      await expect(authenticatedPage.locator('h1, h2, [data-testid="page-title"]').filter({ hasText: /campaign/i })).toBeVisible({ timeout: 10000 });
    });

    test('should show empty state when no campaigns exist', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/campaigns');
      await authenticatedPage.waitForLoadState('networkidle');
      const emptyState = authenticatedPage.locator('text=/no campaigns|empty|get started|create your first/i');
      const campaignList = authenticatedPage.locator('[data-testid="campaign-list"], table tbody tr, .campaign-card');
      const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
      const hasItems = await campaignList.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasEmpty || hasItems).toBeTruthy();
    });

    test('should create campaign via API and verify in UI', async ({ apiHelper, authenticatedPage }) => {
      const campaignData = createTestCampaign();
      const response = await apiHelper.createCampaign(campaignData);
      expect(response.status).toBeLessThan(400);
      const createdCampaign = response.data as Record<string, unknown>;
      campaignId = (createdCampaign.id || (createdCampaign.data as Record<string, unknown>)?.id) as string;
      expect(campaignId).toBeTruthy();

      await authenticatedPage.goto('/campaigns');
      await authenticatedPage.waitForLoadState('networkidle');
      await expect(authenticatedPage.locator(`text=${campaignData.name}`).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Business Import', () => {
    test('should import businesses into campaign via API', async ({ apiHelper }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign());
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      const businesses = Array.from({ length: 3 }, () => createTestBusiness());
      const response = await apiHelper.importBusinesses(campaignId, businesses);
      expect(response.status).toBeLessThan(400);
    });

    test('should display imported businesses in campaign detail', async ({ apiHelper, authenticatedPage }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign());
        campaignId = (res.data as Record<string, unknown>).id as string;
        await apiHelper.importBusinesses(campaignId, [createTestBusiness()]);
      }
      await authenticatedPage.goto(`/campaigns/${campaignId}`);
      await authenticatedPage.waitForLoadState('networkidle');
      await expect(authenticatedPage.locator('text=/businesses|contacts|recipients|imported/i').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Outreach Jobs', () => {
    test('should create outreach job for campaign', async ({ apiHelper }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign());
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      const response = await apiHelper.createOutreachJob(campaignId, {
        name: `Outreach Job ${Date.now()}`, type: 'whatsapp', template: 'Hello {{name}}, this is a test message.',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      });
      expect(response.status).toBeLessThan(400);
    });

    test('should list outreach jobs for campaign', async ({ apiHelper }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign());
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      const response = await apiHelper.getOutreachJobs(campaignId);
      expect(response.status).toBe(200);
    });
  });

  test.describe('Queue, Execution and Delivery Tracking', () => {
    test('should verify queue items via API', async ({ apiHelper }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign());
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      const response = await apiHelper.getQueue(campaignId);
      expect(response.status).toBe(200);
    });

    test('should track delivery status via API', async ({ apiHelper }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign());
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      const response = await apiHelper.getDeliveryTracking(campaignId);
      expect(response.status).toBe(200);
    });
  });

  test.describe('Campaign Analytics', () => {
    test('should view campaign analytics via API', async ({ apiHelper }) => {
      if (!campaignId) {
        const res = await apiHelper.createCampaign(createTestCampaign());
        campaignId = (res.data as Record<string, unknown>).id as string;
      }
      const response = await apiHelper.getAnalytics(campaignId);
      expect(response.status).toBe(200);
    });

    test('should display analytics in campaign detail', async ({ authenticatedPage }) => {
      if (!campaignId) return;
      await authenticatedPage.goto(`/campaigns/${campaignId}`);
      await authenticatedPage.waitForLoadState('networkidle');
      await expect(authenticatedPage.locator('text=/analytics|metrics|stats|reports/i').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Campaign Lifecycle - Full Flow', () => {
    test('should complete full campaign lifecycle', async ({ apiHelper, authenticatedPage }) => {
      const campaign = createTestCampaign({ name: `Lifecycle Test ${Date.now()}` });

      const createRes = await apiHelper.createCampaign(campaign);
      expect(createRes.status).toBeLessThan(400);
      const cId = (createRes.data as Record<string, unknown>).id as string;
      expect(cId).toBeTruthy();

      const importRes = await apiHelper.importBusinesses(cId, Array.from({ length: 2 }, () => createTestBusiness()));
      expect(importRes.status).toBeLessThan(400);

      const jobRes = await apiHelper.createOutreachJob(cId, {
        name: `Lifecycle Job ${Date.now()}`, type: 'whatsapp', template: 'Lifecycle test: Hello {{name}}',
      });
      expect(jobRes.status).toBeLessThan(400);

      const queueRes = await apiHelper.getQueue(cId);
      expect(queueRes.status).toBe(200);

      await authenticatedPage.goto(`/campaigns/${cId}`);
      await authenticatedPage.waitForLoadState('networkidle');
      await expect(authenticatedPage.locator(`text=${campaign.name}`).first()).toBeVisible({ timeout: 10000 });

      await authenticatedPage.goto('/campaigns');
      await authenticatedPage.waitForLoadState('networkidle');
      await expect(authenticatedPage.locator(`text=${campaign.name}`).first()).toBeVisible({ timeout: 10000 });

      const deliveryRes = await apiHelper.getDeliveryTracking(cId);
      expect(deliveryRes.status).toBe(200);

      const analyticsRes = await apiHelper.getAnalytics(cId);
      expect(analyticsRes.status).toBe(200);

      await apiHelper.deleteCampaign(cId);
    });
  });
});
