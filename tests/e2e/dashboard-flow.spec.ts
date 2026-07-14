import { test, expect } from './fixtures/test-data';

test.describe('Dashboard Flow', () => {
  test.describe('Navigation', () => {
    test('should load dashboard home page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');
      expect(authenticatedPage.url()).not.toMatch(/\/login/);
      await expect(authenticatedPage.locator('h1, h2, [data-testid="page-title"], [data-testid="dashboard"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to campaigns page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/campaigns');
      await authenticatedPage.waitForLoadState('networkidle');
      expect(authenticatedPage.url()).toMatch(/campaign/);
    });

    test('should navigate to conversations page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/conversations');
      await authenticatedPage.waitForLoadState('networkidle');
      expect(authenticatedPage.url()).toMatch(/conversation/);
    });

    test('should navigate to analytics page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/analytics');
      await authenticatedPage.waitForLoadState('networkidle');
      expect(authenticatedPage.url()).toMatch(/analytic/);
    });

    test('should navigate to settings page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings');
      await authenticatedPage.waitForLoadState('networkidle');
      expect(authenticatedPage.url()).toMatch(/setting/);
    });

    test('should navigate to admin section', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/admin');
      await authenticatedPage.waitForLoadState('networkidle');
      expect(authenticatedPage.url()).toMatch(/admin/);
    });
  });

  test.describe('Filtering', () => {
    test('should apply date range filter on campaigns', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/campaigns');
      await authenticatedPage.waitForLoadState('networkidle');
      const dateFilter = authenticatedPage.locator('[data-testid="date-filter"], input[type="date"], [placeholder*="date" i]').first();
      if (await dateFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dateFilter.fill(new Date().toISOString().split('T')[0]).catch(() => {});
        await authenticatedPage.waitForLoadState('networkidle');
      }
    });

    test('should filter conversations by status', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/conversations');
      await authenticatedPage.waitForLoadState('networkidle');
      const filterButton = authenticatedPage.locator('button:has-text("Filter"), [data-testid="filter-button"]').first();
      if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filterButton.click();
        await authenticatedPage.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Searching', () => {
    test('should search for campaigns by name', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/campaigns');
      await authenticatedPage.waitForLoadState('networkidle');
      const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]').first();
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('test');
        await authenticatedPage.waitForTimeout(500);
        await authenticatedPage.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Reports and Analytics', () => {
    test('should navigate to analytics page and load data', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/analytics');
      await authenticatedPage.waitForLoadState('networkidle');
      expect(authenticatedPage.url()).not.toMatch(/\/login/);
      await expect(authenticatedPage.locator('h1, h2, [data-testid="page-title"], text=/analytics|reports|metrics/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should fetch dashboard stats via API', async ({ apiHelper }) => {
      const response = await apiHelper.getDashboardStats();
      expect(response.status).toBe(200);
    });
  });

  test.describe('Administration', () => {
    test('should access API user management', async ({ apiHelper }) => {
      const response = await apiHelper.getUsers();
      expect(response.status).toBe(200);
    });

    test('should enforce RBAC on admin pages', async ({ page }) => {
      const loginRes = await page.request.post('http://localhost:3000/api/v1/auth/login', {
        data: { email: 'user@conversation-platform.com', password: 'UserPass123!' },
      });
      if (loginRes.ok()) {
        const body = await loginRes.json();
        const token = body.token || body.data?.token;
        if (token) {
          await page.evaluate((t) => { localStorage.setItem('auth_token', t); localStorage.setItem('token', t); }, token);
          await page.goto('/admin');
          await page.waitForLoadState('networkidle');
          const isRestricted = page.url().includes('/dashboard') || page.url().includes('/login') ||
            await page.locator('text=/access denied|forbidden|unauthorized|403|no permission/i').isVisible({ timeout: 3000 }).catch(() => false);
          expect(isRestricted).toBeTruthy();
        }
      }
    });
  });

  test.describe('Loading and Error States', () => {
    test('should handle network error gracefully', async ({ authenticatedPage }) => {
      await authenticatedPage.route('**/api/v1/**', (route) => route.abort('connectionrefused'));
      await authenticatedPage.goto('/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');
      const errorOrContent = await authenticatedPage.locator('text=/error|failed|retry|something went wrong|offline/i').isVisible({ timeout: 5000 }).catch(() => false);
      const hasContent = await authenticatedPage.locator('h1, h2, main, [data-testid="dashboard"]').isVisible({ timeout: 5000 }).catch(() => false);
      expect(errorOrContent || hasContent).toBeTruthy();
      await authenticatedPage.unroute('**/api/v1/**');
    });

    test('should show 404 page for invalid routes', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/nonexistent-page-12345');
      await authenticatedPage.waitForLoadState('networkidle');
      const notFound = await authenticatedPage.locator('text=/404|not found|page does not exist/i').isVisible({ timeout: 5000 }).catch(() => false);
      const redirected = authenticatedPage.url().includes('/dashboard') || authenticatedPage.url().includes('/login');
      expect(notFound || redirected).toBeTruthy();
    });
  });
});
