import { test as base, type Page } from '@playwright/test';
import { ApiHelper } from '../helpers/api';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface TestCampaign {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface TestConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: string;
  channel: string;
}

export interface TestBusiness {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface TestMessage {
  id: string;
  conversationId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: string;
}

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function generatePhone(): string {
  const area = ['212', '310', '415', '512', '617', '718', '801', '917'];
  const prefix = area[Math.floor(Math.random() * area.length)];
  const line = Math.floor(Math.random() * 9000000 + 1000000);
  return `+1${prefix}${line}`;
}

function generateEmail(prefix?: string): string {
  return `${prefix || 'user'}_${Date.now()}_${generateId()}@test.example.com`;
}

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = generateId();
  return { id, email: generateEmail('user'), password: 'TestPass123!', name: `Test User ${id}`, role: 'user', ...overrides };
}

export function createTestCampaign(overrides: Partial<TestCampaign> = {}): TestCampaign {
  const id = generateId();
  return { id, name: `Test Campaign ${id}`, description: `Automated test campaign created at ${new Date().toISOString()}`, type: 'whatsapp', status: 'draft', createdAt: new Date().toISOString(), ...overrides };
}

export function createTestConversation(overrides: Partial<TestConversation> = {}): TestConversation {
  const id = generateId();
  return { id, contactName: `Contact ${id}`, contactPhone: generatePhone(), status: 'open', channel: 'whatsapp', ...overrides };
}

export function createTestBusiness(overrides: Partial<TestBusiness> = {}): TestBusiness {
  const id = generateId();
  return { id, name: `Business ${id}`, phone: generatePhone(), email: generateEmail('biz'), address: `${Math.floor(Math.random() * 9999)} Test Street, Testville, TS ${Math.floor(Math.random() * 90000 + 10000)}`, ...overrides };
}

export function createTestMessage(overrides: Partial<TestMessage> = {}): TestMessage {
  const id = generateId();
  return { id, conversationId: generateId(), content: `Test message ${id} - ${Date.now()}`, direction: 'inbound', status: 'delivered', ...overrides };
}

export function createWebhookPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: generateId(),
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '15551234567', phone_number_id: generateId() },
          contacts: [{ wa_id: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}`, profile: { name: `Webhook Contact ${generateId()}` } }],
          messages: [{ from: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}`, id: `wamid.${generateId()}`, timestamp: Math.floor(Date.now() / 1000).toString(), type: 'text', text: { body: `Webhook test message ${generateId()}` } }],
        },
        field: 'messages',
      }],
    }],
    ...overrides,
  };
}

export function createDeliveryStatusPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: generateId(),
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '15551234567', phone_number_id: generateId() },
          statuses: [{ id: `wamid.${generateId()}`, status: 'delivered', timestamp: Math.floor(Date.now() / 1000).toString(), recipient_id: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}` }],
        },
        field: 'messages',
      }],
    }],
    ...overrides,
  };
}

type TestFixtures = {
  apiHelper: ApiHelper;
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  apiHelper: async ({ request }, use) => {
    const api = new ApiHelper(request);
    await api.login();
    await use(api);
  },

  authenticatedPage: async ({ page, context }, use) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@conversation-platform.com', password: 'Admin123!' }),
    });

    const data = await response.json();
    const token = data.token || data.data?.token || data.accessToken || data.data?.accessToken;

    await context.addCookies([{ name: 'auth_token', value: token, domain: new URL(baseURL).hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);

    await page.evaluate((t) => { localStorage.setItem('auth_token', t); localStorage.setItem('token', t); }, token);

    await use(page);
  },
});

export { expect } from '@playwright/test';
