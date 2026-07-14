# Database Guide

## Schema Overview

The database uses PostgreSQL 16 with the following core entities:

```
Tenant (1) ──── (N) User
  │                     │
  │                     ├── (N) Conversation ── (N) Message
  │                     ├── (N) Campaign ── (N) CampaignRecipient
  │                     └── (N) ApiKey
  │
  ├── (N) WebhookConfig ── (N) WebhookDelivery
  ├── (N) WorkflowDefinition
  └── (N) AnalyticsEvent
```

## Multi-tenancy

All tables include a `tenantId` column with a composite index. Row-Level Security (RLS) is enabled on production.

```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON "User" USING ("tenantId" = current_setting('app.current_tenant_id')::uuid);
```

## Migrations

### Creating Migrations
```bash
pnpm prisma:migrate:dev --name describe_change
```

### Deploying Migrations
```bash
pnpm prisma:migrate:deploy
```

### Rolling Back
```bash
pnpm prisma:migrate:down  # Rolls back last migration
```

### Resetting Database
```bash
pnpm prisma:migrate:reset  # Drops and recreates all migrations
```

## Indexing Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| Tenant | `slug` (unique) | Fast lookup by slug |
| User | `email` (unique) | Auth lookup |
| User | `(tenantId, email)` | Tenant-scoped lookup |
| Conversation | `(tenantId, status)` | List conversations by status |
| Message | `(conversationId, createdAt)` | Message timeline |
| Campaign | `(tenantId, status)` | Campaign management |
| AnalyticsEvent | `(tenantId, type, timestamp)` | Reporting queries |
| WebhookDelivery | `(webhookId, createdAt)` | Delivery history |

## Connection Pooling

In production, use PgBouncer for connection pooling:

```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer:1.23
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 25
```

## Backup Strategy

| Type | Schedule | Retention | Tool |
|------|----------|-----------|------|
| Full | Daily | 30 days | pg_dump |
| Weekly | Sunday | 4 weeks | pg_dump |
| Monthly | 1st | 6 months | pg_dump |
| WAL | Continuous | 7 days | pg_archive |

## Performance Guidelines

- Keep individual row size under 2KB
- Use JSONB for flexible metadata (not separate tables)
- Index columns used in WHERE, ORDER BY, and JOIN clauses
- Monitor slow queries via `pg_stat_statements`
- Use `EXPLAIN ANALYZE` to optimize query plans
