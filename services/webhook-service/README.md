# @conversation-platform/webhook-service

Delivers webhook events to registered endpoints with signature verification, exponential backoff retry, and per-webhook monitoring.

## Purpose

When channel events occur (message received, channel connected, etc.), the service dispatches them to registered webhook URLs. Supports tenant-scoped webhook registrations with event-type filtering.

## Security

- **HMAC-SHA256/512 signature** in `X-Webhook-Signature` header format: `t={timestamp},v1={signature}`
- **Timestamp validation** against configurable tolerance (default 5 minutes) prevents replay attacks
- **Timing-safe comparison** via `crypto.timingSafeEqual`
- Helper functions: `createSignatureHeader()`, `verifySignature()`, `generateSecret()`

## Retry Mechanism

`WebhookDispatcher` implements exponential backoff:

```
delay = retryBackoffBaseMs * 2^(attempt - 1)
```

Up to `retryMaxAttempts` (configurable per webhook). After 10 consecutive failures, webhook status is set to `failing`.

## Monitoring and Stats

`WebhookMonitor` tracks delivery attempts and provides:

- `getStats(webhooks)` — success/failure counts, retry rate, average latency, uptime %
- `getRecentFailures(limit)` — last N failures
- Internal ring buffer (default 50,000 entries)

## API Reference

```ts
// WebhookRegistry
register(config: WebhookConfig): WebhookRegistration
unregister(webhookId): boolean
get(webhookId): WebhookRegistration | undefined
getByTenant(tenantId): WebhookRegistration[]
getByEvent(event, tenantId): WebhookRegistration[]  // Only enabled + matching events
list(tenantId?): WebhookRegistration[]
recordDelivery(webhookId, success): void

// WebhookDispatcher
dispatch(event: WebhookEvent): Promise<WebhookDeliveryAttempt[]>
getDeliveryLog(webhookId?, limit?): WebhookDeliveryAttempt[]

// Security
createSignatureHeader(payload, secret, config?): string
verifySignature(payload, headerValue, secret, config?): boolean
generateSecret(length?): string

// WebhookMonitor
record(attempt): void
getStats(webhooks): WebhookStats
getRecentFailures(limit?): WebhookDeliveryAttempt[]
```

## Types

```ts
WebhookConfig { id, tenantId, name, url, secret, events, enabled, retryMaxAttempts,
  retryBackoffBaseMs, timeoutMs, headers? }
WebhookEvent { id, type, tenantId, channelType?, payload, timestamp }
WebhookDeliveryAttempt { id, webhookId, tenantId, event, payload, status,
  attemptNumber, statusCode?, durationMs, error? }
WebhookStats { totalWebhooks, activeWebhooks, totalDeliveries,
  successfulDeliveries, failedDeliveries, retryRate, averageLatencyMs, uptimePercent }
```

Error classes: `WebhookError`, `WebhookValidationError`, `WebhookDeliveryError`, `WebhookSignatureError`.
