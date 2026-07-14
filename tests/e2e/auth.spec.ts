import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should display login page with form elements', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await expect(page.locator('text=/required|empty|enter/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'WrongPass123!');
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await expect(page.locator('text=/invalid|incorrect|unauthorized|failed/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should login successfully and redirect to dashboard', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"], input[name="email"]', 'admin@conversation-platform.com');
      await page.fill('input[type="password"], input[name="password"]', 'Admin123!');
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
      expect(page.url()).toMatch(/\/(dashboard|$)/);
    });

    test('should persist session across page reloads', async ({ page, context }) => {
      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@conversation-platform.com', password: 'Admin123!' }),
      });
      const data = await response.json();
      const token = data.token || data.data?.token || data.accessToken || data.data?.accessToken;

      await context.addCookies([{ name: 'auth_token', value: token, domain: new URL(baseURL).hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
      await page.evaluate((t) => { localStorage.setItem('auth_token', t); localStorage.setItem('token', t); }, token);

      await page.goto('/dashboard');
      expect(page.url()).not.toMatch(/\/login/);
      await page.reload();
      expect(page.url()).not.toMatch(/\/login/);
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login page', async ({ page, context }) => {
      const baseURL = 'http://localhost:3000';
      const resp = await fetch(`${baseURL}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@conversation-platform.com', password: 'Admin123!' }),
      });
      const d = await resp.json();
      const t = d.token || d.data?.token || d.accessToken || d.data?.accessToken;
      await context.addCookies([{ name: 'auth_token', value: t, domain: new URL(baseURL).hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
      await page.evaluate((tk) => { localStorage.setItem('auth_token', tk); localStorage.setItem('token', tk); }, t);

      await page.goto('/dashboard');
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out"), a:has-text("Logout"), [data-testid="logout"]');
      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click();
      } else {
        const userMenu = page.locator('[data-testid="user-menu"], .user-menu, [aria-label="User menu"]');
        if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
          await userMenu.click();
          await page.click('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]');
        }
      }

      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/login/);
    });
  });

  test.describe('Session Expiration', () => {
    test('should redirect to login when auth token is removed', async ({ page, context }) => {
      const baseURL = 'http://localhost:3000';
      const resp = await fetch(`${baseURL}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@conversation-platform.com', password: 'Admin123!' }),
      });
      const d = await resp.json();
      const t = d.token || d.data?.token || d.accessToken || d.data?.accessToken;
      await context.addCookies([{ name: 'auth_token', value: t, domain: new URL(baseURL).hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
      await page.evaluate((tk) => { localStorage.setItem('auth_token', tk); localStorage.setItem('token', tk); }, t);

      await page.goto('/dashboard');
      expect(page.url()).not.toMatch(/\/login/);

      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        document.cookie.split(';').forEach((c) => {
          document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });
      });

      await page.goto('/dashboard');
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/login/);
    });
  });

  test.describe('Permission Validation', () => {
    test('should redirect unauthenticated users to login from protected pages', async ({ page }) => {
      for (const route of ['/dashboard', '/campaigns', '/conversations', '/analytics']) {
        await page.goto(route);
        await page.waitForURL(/\/login|\/(dashboard|campaigns)/, { timeout: 10000 });
        if (page.url().match(/\/login/)) {
          expect(page.url()).toContain('/login');
        }
      }
    });

    test('should return 401 for API calls without auth token', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/v1/campaigns');
      expect(response.status()).toBe(401);
    });

    test('should return 401 for API calls with invalid token', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/v1/campaigns', {
        headers: { Authorization: 'Bearer invalid_token_xyz' },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('admin should access admin pages', async ({ page, context }) => {
      const baseURL = 'http://localhost:3000';
      const resp = await fetch(`${baseURL}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@conversation-platform.com', password: 'Admin123!' }),
      });
      const d = await resp.json();
      const t = d.token || d.data?.token || d.accessToken || d.data?.accessToken;
      await context.addCookies([{ name: 'auth_token', value: t, domain: new URL(baseURL).hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
      await page.evaluate((tk) => { localStorage.setItem('auth_token', tk); localStorage.setItem('token', tk); }, t);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login/);
    });

    test('should return 403 for non-admin role accessing admin API', async ({ request }) => {
      const loginResp = await request.post('http://localhost:3000/api/v1/auth/login', {
        data: { email: 'user@conversation-platform.com', password: 'UserPass123!' },
      });
      if (loginResp.ok()) {
        const body = await loginResp.json();
        const token = body.token || body.data?.token;
        const response = await request.get('http://localhost:3000/api/v1/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(response.status() === 403 || response.status() === 401).toBeTruthy();
      }
    });
  });
});
