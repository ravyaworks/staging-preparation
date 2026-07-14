# Database Guide

## Schema Overview

The database uses PostgreSQL 16 with Prisma ORM. The schema is defined in `packages/database/prisma/schema.prisma`.

### Key Models and Relationships

```
Tenant (1) ──┬── (N) User
             ├── (N) Organization
             ├── (N) Role
             ├── (N) ApiKey
             ├── (N) AuditLog
             ├── (N) ChannelConnection
             ├── (N) Integration
             ├── (N) Contact
             ├── (N) Conversation ── (N) Message
             ├── (N) Webhook
             ├── (N) Event
             ├── (N) Notification
             ├── (N) OutreachJob
             ├── (N) FeatureFlag
             ├── (N) File
             └── (N) Setting

Organization (1) ── (N) Campaign ──┬── (N) CampaignBusiness
                                   ├── (N) OutreachJob
                                   ├── (N) CampaignStatistics
                                   ├── (N) CampaignLog
                                   └── (N) ImportJob

User (N) ── (N) Role        (via UserRole)
Role (N) ── (N) Permission  (via RolePermission)

CampaignBusiness ── (N) ImportRecord
OutreachJob ──┬── (N) DeliveryEvent
              └── (N) JobFailure
```

### Model Summary

| Model | Purpose | Key Fields |
|---|---|---|
| `Tenant` | Multi-tenant root | `id`, `slug`, `settings`, `isActive` |
| `User` | Platform users | `email`, `passwordHash`, `tenantId` |
| `Organization` | Sub-groups within tenants | `name`, `slug`, `tenantId` |
| `Role` | RBAC roles | `name`, `slug`, `isSystem` |
| `Permission` | Granular permissions | `slug` (e.g. `user:create`) |
| `Conversation` | Chat conversations | `status`, `channel`, `tenantId` |
| `Message` | Individual messages | `role`, `content`, `direction`, `conversationId` |
| `Campaign` | Outreach campaigns | `name`, `channel`, `status`, `organizationId` |
| `OutreachJob` | Per-recipient job | `status`, `lockedAt`, `campaignId` |
| `ChannelConnection` | Channel config per tenant | `channelType`, `config`, `status` |
| `Integration` | Third-party integrations | `channelType`, `settings`, `status` |
| `Contact` | Customer records | `name`, `phone`, `email`, `tenantId` |
| `AuditLog` | Security audit trail | `action`, `entity`, `tenantId`, `userId` |
| `ApiKey` | API authentication | `keyPrefix`, `hash`, `tenantId` |
| `AnalyticsEvent` | Event tracking | `type`, `tenantId`, `timestamp` |
| `AnalyticsMetric` | Aggregated metrics | `metric`, `value`, `period`, `bucket` |

## Migration Workflow

### Development

```bash
# Create a new migration (interactive)
pnpm db:migrate

# This will:
# 1. Detect schema changes
# 2. Create a new migration SQL file in packages/database/prisma/migrations/
# 3. Apply the migration to the local database
# 4. Regenerate the Prisma Client
```

### Production

```bash
# Deploy pending migrations (non-interactive)
pnpm db:deploy

# This will:
# 1. Apply all pending migrations in order
# 2. Fail if a migration cannot be applied
# 3. NOT create new migrations (only apply existing ones)
```

### Migration Best Practices

1. **Never modify applied migrations** — create a new migration instead
2. **Test migrations locally** before committing
3. **Make migrations backward-compatible** — avoid breaking changes in a single migration
4. **Use `--create-only`** for complex migrations that need manual SQL editing:

```bash
npx prisma migrate dev --create-only --schema=packages/database/prisma/schema.prisma
# Edit the generated SQL file
npx prisma migrate dev --schema=packages/database/prisma/schema.prisma
```

### Migration File Structure

```
packages/database/prisma/migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240115000000_add_campaign_tables/
│   └── migration.sql
└── migration_lock.toml
```

## Indexing Strategy

### Current Indexes

The schema includes indexes on all high-cardinality and frequently queried columns:

```sql
-- Tenant scoping (every major table)
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Lookup indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_tenants_slug ON tenants(slug);

-- Query pattern indexes
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_priority ON conversations(priority);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Campaign processing
CREATE INDEX idx_outreach_jobs_status ON outreach_jobs(status);
CREATE INDEX idx_outreach_jobs_locked_at ON outreach_jobs(locked_at);
CREATE INDEX idx_campaign_businesses_status ON campaign_businesses(status);

-- Analytics
CREATE INDEX idx_analytics_events_type_timestamp ON analytics_events(type, timestamp);
CREATE INDEX idx_analytics_events_tenant_timestamp ON analytics_events(tenant_id, timestamp);
CREATE INDEX idx_analytics_metrics_metric_tenant ON analytics_metrics(metric, tenant_id, period, bucket);
```

### Adding New Indexes

When adding new indexes:

```sql
-- Composite index for common query pattern
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Partial index for active records only
CREATE INDEX idx_conversations_active ON conversations(tenant_id, created_at)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Covering index for frequently accessed columns
CREATE INDEX idx_users_email_active ON users(email, tenant_id, is_active);
```

### Index Monitoring

```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find index hit rate
SELECT
  schemaname, tablename, indexname,
  idx_scan,
  idx_hit / (idx_scan + idx_hit) AS hit_ratio
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY hit_ratio ASC;
```

## Connection Pooling

### Prisma Connection Pool

Configured via `DATABASE_URL` query parameters:

```
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
```

| Parameter | Default | Description |
|---|---|---|
| `connection_limit` | 10 | Max connections in pool |
| `pool_timeout` | 10 | Seconds to wait for a connection |
| `connect_timeout` | 5 | Seconds to wait for initial connection |

### Connection Pool Sizing

| Scenario | Recommended Pool Size |
|---|---|
| Single API instance | 10-20 |
| 3 API replicas | 10 per replica (30 total) |
| High concurrency (>500 req/s) | 20 per replica |

### PgBouncer (Optional, High Scale)

For high-concurrency scenarios, add PgBouncer between Prisma and PostgreSQL:

```yaml
# docker-compose.yml addition
pgbouncer:
  image: edoburu/pgbouncer:1.21.0
  environment:
    DATABASE_URL: postgresql://cp_user:password@postgres:5432/conversation_platform
    POOL_MODE: transaction
    DEFAULT_POOL_SIZE: 20
    MAX_CLIENT_CONN: 200
  ports:
    "6432:6432"
```

## Backup and Restore

### pg_dump Backup

```bash
# Full backup (custom format, compressed)
pg_dump -U cp_user -d conversation_platform \
  --format=custom \
  --compress=9 \
  --verbose \
  --file=backup_$(date +%Y%m%d_%H%M%S).dump

# Plain SQL backup (human-readable)
pg_dump -U cp_user -d conversation_platform \
  --format=plain \
  --file=backup_$(date +%Y%m%d_%H%M%S).sql

# Schema-only backup
pg_dump -U cp_user -d conversation_platform \
  --schema-only \
  --file=schema_$(date +%Y%m%d).sql

# Data-only backup
pg_dump -U cp_user -d conversation_platform \
  --data-only \
  --file=data_$(date +%Y%m%d).sql
```

### pg_restore

```bash
# Restore from custom format
pg_restore -U cp_user -d conversation_platform \
  --verbose \
  --clean \
  --if-exists \
  backup_20240101_020000.dump

# Restore from SQL file
psql -U cp_user -d conversation_platform \
  < backup_20240101_020000.sql

# Restore specific table
pg_restore -U cp_user -d conversation_platform \
  --table=conversations \
  backup_20240101_020000.dump
```

### Docker-Based Backup

```bash
# Backup via Docker
docker compose exec -T postgres pg_dump \
  -U cp_user \
  -d conversation_platform \
  --format=custom \
  --compress=9 \
  > backup_$(date +%Y%m%d).dump

# Restore via Docker
docker compose exec -T postgres pg_restore \
  -U cp_user \
  -d conversation_platform \
  --clean \
  --if-exists \
  < backup_20240101.dump
```

### Automated Backup Script

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --format=custom \
  --compress=9 > "${BACKUP_DIR}/cp_${TIMESTAMP}.dump"

# Verify
pg_restore -l "${BACKUP_DIR}/cp_${TIMESTAMP}.dump" > /dev/null 2>&1 \
  && echo "OK: Backup verified" \
  || echo "ERROR: Backup verification failed"

# Cleanup old backups
find "$BACKUP_DIR" -name "cp_*.dump" -mtime +${RETENTION_DAYS} -delete
```

## Performance Optimization

### Query Tuning

```sql
-- Enable query logging (development)
ALTER SYSTEM SET log_min_duration_statement = 100; -- queries > 100ms
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check table bloat
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size,
  n_live_tup, n_dead_tup,
  CASE WHEN n_live_tup > 0
    THEN round(100.0 * n_dead_tup / n_live_tup, 1)
    ELSE 0
  END AS dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### Vacuum and Analyze

```sql
-- Manual vacuum analyze (run weekly)
VACUUM ANALYZE;

-- Check autovacuum status
SELECT
  schemaname, tablename,
  last_vacuum, last_autovacuum,
  last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;
```

### Connection Management

```sql
-- Current connections
SELECT
  state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Long-running queries
SELECT
  pid, state, query_start,
  now() - query_start AS duration,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '5 minutes'
ORDER BY duration DESC;
```

### Query Plan Analysis

```sql
-- Analyze a query
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE conversation_id = '...'
ORDER BY created_at DESC
LIMIT 50;
```

## Data Retention Policies

### Recommended Retention Periods

| Data Type | Retention | Action |
|---|---|---|
| Messages | 2 years | Archive to cold storage, then delete |
| Conversations (closed) | 1 year | Archive, then soft delete |
| Audit logs | 7 years | Compliance requirement, archive |
| Analytics events | 1 year | Aggregate to metrics, archive raw |
| Analytics metrics | 2 years | Keep aggregated, delete raw daily |
| Delivery events | 90 days | Archive, then delete |
| Job failures | 90 days | Archive resolved, delete unresolved |
| Outbound jobs (completed) | 90 days | Archive, then delete |
| Import records | 30 days | Delete after import completes |
| Notifications | 30 days | Delete old notifications |
| Sessions | 30 days | Delete expired sessions |

### Retention Cleanup Query

```sql
-- Delete messages older than 2 years (run monthly)
DELETE FROM messages
WHERE created_at < now() - interval '2 years'
  AND conversation_id IN (
    SELECT id FROM conversations WHERE status = 'closed'
  );

-- Archive analytics events older than 1 year
-- (export to cold storage first, then delete)
DELETE FROM analytics_events
WHERE created_at < now() - interval '1 year';

-- Clean up old delivery events
DELETE FROM delivery_events
WHERE timestamp < now() - interval '90 days';

-- Clean up completed outreach jobs
DELETE FROM outreach_jobs
WHERE status = 'completed'
  AND processed_at < now() - interval '90 days';
```

## Archival Strategies

### Cold Storage Archival

For data that must be retained but rarely accessed:

1. **Export** data to JSON/CSV files
2. **Upload** to S3 or similar cold storage (Glacier, etc.)
3. **Delete** from PostgreSQL
4. **Maintain** an index table pointing to archived records

```sql
-- Archive index table
CREATE TABLE archived_conversations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL,
  archive_location VARCHAR(512) NOT NULL,
  original_created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_archived_conversations_tenant ON archived_conversations(tenant_id);
CREATE INDEX idx_archived_conversations_date ON archived_conversations(original_created_at);
```

### Table Partitioning (Future Scale)

For high-volume tables, consider partitioning:

```sql
-- Partition messages by month
CREATE TABLE messages_partitioned (
  LIKE messages INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE messages_2024_01 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE messages_2024_02 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition analytics_events by month
CREATE TABLE analytics_events_partitioned (
  LIKE analytics_events INCLUDING ALL
) PARTITION BY RANGE (timestamp);
```
