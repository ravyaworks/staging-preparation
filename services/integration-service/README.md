# @conversation-platform/integration-service

Manages channel integrations, API keys, and usage tracking per tenant.

## IntegrationManager

CRUD for integration configurations:

- **createIntegration**(config) — register a new integration
- **getIntegration**(id), **getIntegrationsByTenant**(tenantId), **getIntegrationsByChannel**(tenantId, channelType)
- **updateIntegration**(id, updates) — partial update
- **removeIntegration**(id)
- **updateStatus**(id, status, error?) — track connection state changes
- **recordConnection**(integrationId, connection) — append a connection record
- **addLog**(entry) / **getLogs**(integrationId) — structured audit logging
- **count**() — total and active integration counts

## ApiKeyManager

API key management with SHA-256 hashing. Raw keys are returned once on creation and never stored.

- **createKey**({ tenantId, name, scopes, expiresAt? }) — returns `{ key, rawKey }` where rawKey is `cp_` + 48 random hex chars
- **validateKey**(rawKey) — hash lookup against stored keys; checks enabled + expiry; updates `lastUsedAt`
- **getKey**(id), **getKeysByTenant**(tenantId)
- **revokeKey**(id) — sets enabled=false (soft delete)
- **deleteKey**(id) — hard delete

Key format: `cp_{48 hex chars}`, prefix (first 8 chars) stored for identification.

## UsageTracker

Daily-aggregated usage records per integration:

- **record**({ integrationId, tenantId, messagesSent?, messagesReceived?, errors?, latencyMs? }) — upserts today's record, accumulates counters
- **getUsage**(integrationId, days?) — last N days of daily usage
- **getTenantUsage**(tenantId, days?)
- **getStats**(integrations) — aggregated stats: totals today, average latency, top 5 channels by volume

## API Reference

```ts
// IntegrationManager
createIntegration(config): IntegrationConfig
getIntegration(id): IntegrationConfig | undefined
getIntegrationsByTenant(tenantId): IntegrationConfig[]
updateIntegration(id, updates): IntegrationConfig
removeIntegration(id): boolean
updateStatus(id, status, error?): void
recordConnection(integrationId, connection): void
addLog(entry): void

// ApiKeyManager
createKey(params): { key: IntegrationApiKey; rawKey: string }
validateKey(rawKey): IntegrationApiKey | null
getKey(id): IntegrationApiKey | undefined
revokeKey(id): boolean

// UsageTracker
record(params): void
getUsage(integrationId, days?): IntegrationUsage[]
getStats(integrations): IntegrationStats
```

Error classes: `IntegrationError`, `IntegrationAuthError`, `IntegrationConnectionError`, `IntegrationRateLimitError`.
