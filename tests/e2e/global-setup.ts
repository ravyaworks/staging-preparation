import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_STATE_PATH = path.join(__dirname, '.auth/user.json');

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  const response = await fetch(`${baseURL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@conversation-platform.com',
      password: 'Admin123!',
    }),
  });

  if (!response.ok) {
    throw new Error(`Global setup login failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const token = data.token || data.data?.token || data.accessToken || data.data?.accessToken;

  if (!token) {
    throw new Error('Global setup: No token found in login response');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();

  await context.addCookies([
    {
      name: 'auth_token',
      value: token,
      domain: new URL(baseURL).hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();
  await page.goto(baseURL);

  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
    localStorage.setItem('token', t);
  }, token);

  const dir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}

export default globalSetup;
