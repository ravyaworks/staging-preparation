import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookRegistry, WebhookDispatcher, WebhookMonitor, createSignatureHeader, verifySignature, generateSecret } from '@conversation-platform/webhook-service';
import type { WebhookConfig, WebhookEvent } from '@conversation-platform/webhook-service';

function createTestWebhookConfig(overrides?: Partial<WebhookConfig>): WebhookConfig {
  return { id: overrides?.id ?? `wh_${Date.now()}`, tenantId: overrides?.tenantId ?? 'tenant-001', name: overrides?.name ?? 'Test Webhook', url: overrides?.url ?? 'https://httpbin.org/post', secret: overrides?.secret ?? generateSecret(), events: overrides?.events ?? ['message.sent', 'campaign.completed'], enabled: overrides?.enabled ?? true, retryMaxAttempts: overrides?.retryMaxAttempts ?? 3, retryBackoffBaseMs: overrides?.retryBackoffBaseMs ?? 100, timeoutMs: overrides?.timeoutMs ?? 5000, headers: overrides?.headers, createdAt: overrides?.createdAt ?? new Date().toISOString(), updatedAt: overrides?.updatedAt ?? new Date().toISOString() };
}

function createTestEvent(overrides?: Partial<WebhookEvent>): WebhookEvent {
  return { id: overrides?.id ?? `evt_${Date.now()}`, type: overrides?.type ?? 'message.sent', tenantId: overrides?.tenantId ?? 'tenant-001', payload: overrides?.payload ?? { messageId: 'msg-123', status: 'delivered' }, timestamp: overrides?.timestamp ?? new Date().toISOString() };
}

describe('Webhook Service Integration', () => {
  describe('Security - Signature Verification', () => {
    it('should create a signature header', () => {
      const header = createSignatureHeader(JSON.stringify({ test: true }), 'my-secret-key');
      expect(header).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
    });

    it('should verify a valid signature', () => {
      const payload = JSON.stringify({ test: true });
      const header = createSignatureHeader(payload, 'my-secret-key');
      expect(verifySignature(payload, header, 'my-secret-key')).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const header = createSignatureHeader(JSON.stringify({ test: true }), 'my-secret-key');
      expect(verifySignature('tampered-payload', header, 'my-secret-key')).toBe(false);
    });

    it('should reject a signature with wrong secret', () => {
      const header = createSignatureHeader(JSON.stringify({ test: true }), 'correct-secret');
      expect(verifySignature(JSON.stringify({ test: true }), header, 'wrong-secret')).toBe(false);
    });

    it('should reject a malformed header', () => {
      expect(verifySignature('payload', 'malformed', 'secret')).toBe(false);
    });

    it('should generate unique secrets', () => {
      expect(generateSecret()).not.toBe(generateSecret());
      expect(generateSecret().length).toBe(64);
    });
  });

  describe('Webhook Registry', () => {
    let registry: WebhookRegistry;
    beforeEach(() => { registry = new WebhookRegistry(); });

    it('should register a webhook', () => {
      const registration = registry.register(createTestWebhookConfig());
      expect(registration.config.id).toBeDefined();
      expect(registration.status).toBe('active');
    });

    it('should retrieve a webhook by id', () => {
      registry.register(createTestWebhookConfig({ id: 'wh-1' }));
      expect(registry.get('wh-1')).toBeDefined();
    });

    it('should list webhooks by tenant', () => {
      registry.register(createTestWebhookConfig({ id: 'wh-1', tenantId: 't1' }));
      registry.register(createTestWebhookConfig({ id: 'wh-2', tenantId: 't1' }));
      registry.register(createTestWebhookConfig({ id: 'wh-3', tenantId: 't2' }));
      expect(registry.getByTenant('t1').length).toBe(2);
    });

    it('should filter webhooks by event type', () => {
      registry.register(createTestWebhookConfig({ id: 'wh-sent', events: ['message.sent'] }));
      registry.register(createTestWebhookConfig({ id: 'wh-disabled', events: ['message.sent'], enabled: false }));
      expect(registry.getByEvent('message.sent', 'tenant-001').length).toBe(1);
    });

    it('should unregister a webhook', () => {
      registry.register(createTestWebhookConfig({ id: 'wh-del' }));
      expect(registry.unregister('wh-del')).toBe(true);
      expect(registry.get('wh-del')).toBeUndefined();
    });

    it('should track consecutive failures', () => {
      registry.register(createTestWebhookConfig({ id: 'wh-failing' }));
      for (let i = 0; i < 10; i++) registry.recordDelivery('wh-failing', false);
      expect(registry.get('wh-failing')!.consecutiveFailures).toBe(10);
      expect(registry.get('wh-failing')!.status).toBe('failing');
    });

    it('should reset failures on success', () => {
      registry.register(createTestWebhookConfig({ id: 'wh-reset' }));
      for (let i = 0; i < 5; i++) registry.recordDelivery('wh-reset', false);
      registry.recordDelivery('wh-reset', true);
      expect(registry.get('wh-reset')!.consecutiveFailures).toBe(0);
    });
  });

  describe('Webhook Monitor', () => {
    let monitor: WebhookMonitor;
    beforeEach(() => { monitor = new WebhookMonitor(); });

    it('should return zero stats for empty monitor', () => {
      const stats = monitor.getStats([createTestWebhookConfig()]);
      expect(stats.totalDeliveries).toBe(0);
      expect(stats.uptimePercent).toBe(100);
    });

    it('should track delivery stats', () => {
      monitor.record({ id: '1', webhookId: 'wh-1', tenantId: 't1', event: 'test', payload: {}, status: 'delivered', attemptNumber: 1, durationMs: 100, timestamp: new Date().toISOString() });
      monitor.record({ id: '2', webhookId: 'wh-1', tenantId: 't1', event: 'test', payload: {}, status: 'failed', attemptNumber: 1, durationMs: 50, error: 'timeout', timestamp: new Date().toISOString() });
      const stats = monitor.getStats([createTestWebhookConfig()]);
      expect(stats.totalDeliveries).toBe(2);
      expect(stats.failedDeliveries).toBe(1);
      expect(stats.uptimePercent).toBe(50);
    });

    it('should get recent failures', () => {
      for (let i = 0; i < 5; i++) monitor.record({ id: `f-${i}`, webhookId: 'wh-1', tenantId: 't1', event: 'test', payload: {}, status: 'failed', attemptNumber: 1, durationMs: 0, error: `error-${i}`, timestamp: new Date().toISOString() });
      expect(monitor.getRecentFailures(3).length).toBe(3);
    });
  });
});
