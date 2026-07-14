# Operations Guide

## Monitoring

### Prometheus Metrics

The API exposes a Prometheus-compatible metrics endpoint at `GET /api/v1/health/prometheus`:

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/health"} 1234

# HELP http_requests_rps Requests per second
# TYPE http_requests_rps gauge
http_requests_rps{method="GET",path="/api/v1/health"} 5.2

# HELP process_uptime_seconds Process uptime
# TYPE process_uptime_seconds gauge
process_uptime_seconds 86400

# HELP process_memory_bytes Process memory usage
# TYPE process_memory_bytes gauge
process_memory_bytes{type="rss"} 104857600
process_memory_bytes{type="heapTotal"} 52428800
process_memory_bytes{type="heapUsed"} 36700160
```

### Internal Metrics Endpoint

Additional runtime metrics available at `GET /api/v1/health/metrics`:

```json
{
  "success": true,
  "data": {
    "metrics": {
      "GET:/api/v1/messages": { "count": 5432, "rps": 12.5 },
      "POST:/api/v1/messages": { "count": 1234, "rps": 3.1 }
    },
    "uptime": 86400,
    "memory": {
      "rss": 104857600,
      "heapTotal": 52428800,
      "heapUsed": 36700160,
      "external": 1234567
    }
  }
}
```

### Health Endpoints

| Endpoint | Purpose | Expected Status |
|---|---|---|
| `GET /api/v1/health` | Full health check with DB latency | 200 (healthy) or 503 (degraded) |
| `GET /api/v1/health/ready` | Kubernetes readiness probe | 200 |
| `GET /api/v1/health/live` | Kubernetes liveness probe | 200 |
| `GET /api/v1/health/metrics` | Runtime metrics (JSON) | 200 |
| `GET /api/v1/health/prometheus` | Prometheus-format metrics | 200 |

### Full Health Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.1.0",
    "uptime": 86400,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "checks": {
      "database": { "status": "healthy", "latency": 3 }
    }
  }
}
```

## Logging

### Structured Logging (Pino)

The platform uses Pino for high-performance structured JSON logging:

```typescript
// Log entry format
{
  "level": 30,
  "time": 1705312200000,
  "msg": "request completed",
  "method": "POST",
  "path": "/api/v1/messages",
  "status": 200,
  "duration": "45ms",
  "ip": "10.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req-abc123"
}
```

### Log Levels

| Level | Usage | Production Default |
|---|---|---|
| `debug` | Detailed debugging information | No |
| `info` | Normal operation events | Yes |
| `warn` | Unexpected but recoverable issues | Yes |
| `error` | Failures requiring attention | Yes |
| `fatal` | Critical failures causing shutdown | Yes |

### Configuration

```bash
# Environment variables
LOG_LEVEL=info        # debug | info | warn | error | fatal
LOG_PRETTY=false      # true for development (colorized), false for production (JSON)
```

### Request Logging

All HTTP requests are automatically logged with:
- Method, path, status code
- Response duration in milliseconds
- Client IP and user agent
- Request ID (for distributed tracing correlation)

### Log Aggregation

For production, pipe Pino JSON logs to an aggregator:

```bash
# Option 1: File-based with logrotate
# Configure app to write to stdout, Docker captures to JSON file
# Use filebeat/fluentd to ship logs

# Option 2: Direct to aggregation service
# Pipe stdout to Loki, Elasticsearch, or CloudWatch
docker compose logs -f api | pino-pretty | pino-loki --host http://loki:3100
```

### Sensitive Data in Logs

The following are automatically excluded or redacted:
- Passwords and password hashes
- JWT tokens (only token type logged, not the token itself)
- API key full values (only prefix logged)
- Database connection strings

## Alerting

### Critical Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold | Action |
|---|---|---|---|
| API error rate (5xx) | > 1% for 5 min | > 5% for 2 min | Investigate logs, check dependencies |
| API p95 latency | > 500ms for 5 min | > 2000ms for 5 min | Scale API, check DB queries |
| API p99 latency | > 1000ms for 5 min | > 5000ms for 5 min | Scale API urgently |
| Database connections | > 80% pool | > 95% pool | Increase pool size or add replicas |
| Database query p95 | > 200ms for 5 min | > 1000ms for 5 min | Analyze slow queries |
| Redis memory | > 80% maxmemory | > 95% maxmemory | Increase memory or optimize keys |
| Redis evictions | > 100/min | > 1000/min | Review TTL policies |
| WebSocket connections | > 5000/pod | > 10000/pod | Scale pods |
| Queue depth (pending jobs) | > 100 for 5 min | > 1000 for 5 min | Scale workers |
| Queue processing time | > 30s average | > 120s average | Scale workers, check bottlenecks |
| Disk usage | > 70% | > 90% | Expand volume or clean up |
| Container restarts | > 2 in 10 min | > 5 in 10 min | Investigate crash cause |
| Certificate expiry | < 30 days | < 7 days | Renew certificate |

### Prometheus Alert Rules

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High 5xx error rate on API"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API p95 latency exceeds 500ms"

      - alert: DatabasePoolExhausted
        expr: pg_stat_activity_count > pg_settings_max_connections * 0.8
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool near exhaustion"

      - alert: QueueDepthHigh
        expr: queue_pending_jobs > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Job queue depth is high"

      - alert: ContainerRestarting
        expr: increase(kube_pod_container_status_restarts_total[10m]) > 2
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Container is restarting frequently"
```

## Backup Procedures

### Database Backup Schedule

| Frequency | Retention | Method |
|---|---|---|
| Daily at 02:00 UTC | 30 days | `pg_dump` compressed |
| Weekly (Sunday 03:00 UTC) | 90 days | Full `pg_dump` |
| Before deployments | Until next daily | `pg_dump` compressed |

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -euo pipefail

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/cp_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Perform backup
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --format=custom \
  --compress=9 \
  --verbose \
  > "$BACKUP_FILE"

# Verify backup integrity
gunzip -t "$BACKUP_FILE" 2>/dev/null && echo "Backup verified: $BACKUP_FILE" || echo "BACKUP VERIFICATION FAILED"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "cp_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
```

### Restore Procedure

```bash
#!/bin/bash
# scripts/restore-database.sh

set -euo pipefail

BACKUP_FILE="${1:?Usage: restore-database.sh <backup-file>}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will overwrite the current database."
read -p "Continue? (yes/no): " confirm
[ "$confirm" = "yes" ] || exit 0

# Stop API to prevent writes
echo "Stopping API..."
docker compose stop api

# Drop and recreate database
echo "Recreating database..."
docker compose exec -T postgres psql -U "${POSTGRES_USER}" -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();
"
docker compose exec -T postgres psql -U "${POSTGRES_USER}" -c "DROP DATABASE IF EXISTS ${POSTGRES_DB}"
docker compose exec -T postgres psql -U "${POSTGRES_USER}" -c "CREATE DATABASE ${POSTGRES_DB}"

# Restore
echo "Restoring from backup..."
gunzip < "$BACKUP_FILE" | docker compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

# Verify
echo "Verifying restore..."
docker compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT COUNT(*) FROM information_schema.tables"

# Restart API
echo "Starting API..."
docker compose start api

echo "Restore completed successfully."
```

## Incident Response

### Playbook Template

```markdown
# Incident: [TITLE]

## Status: [Investigating | Identified | Monitoring | Resolved]

## Summary
Brief description of the incident.

## Timeline (UTC)
- HH:MM — Issue detected via [alert/monitor/user report]
- HH:MM — Investigation started
- HH:MM — Root cause identified
- HH:MM — Fix applied
- HH:MM — Monitoring confirmed resolution

## Impact
- Affected services: [list]
- Affected users: [count/percentage]
- Duration: [time]
- Data loss: [yes/no]

## Root Cause
Technical description of what caused the incident.

## Resolution
Steps taken to resolve the incident.

## Action Items
- [ ] [Owner] Action item 1
- [ ] [Owner] Action item 2

## Lessons Learned
What we learned and how to prevent recurrence.
```

### Common Incident Playbooks

#### Database Down

1. Check PostgreSQL container status: `docker compose ps postgres`
2. Check logs: `docker compose logs postgres --tail=100`
3. Check disk space: `df -h`
4. Check memory: `free -m`
5. Restart PostgreSQL: `docker compose restart postgres`
6. Verify connectivity: `docker compose exec postgres pg_isready`
7. If data corruption: restore from latest backup

#### API Unresponsive

1. Check API container: `docker compose ps api`
2. Check logs: `docker compose logs api --tail=100`
3. Check resource usage: `docker stats`
4. Check dependencies (DB, Redis): health endpoints
5. Restart API: `docker compose restart api`
6. If persistent: scale up or investigate memory leaks

#### High Latency

1. Check API metrics: `curl http://localhost:3000/api/v1/health/metrics`
2. Check database slow queries
3. Check Redis hit rate
4. Check for deployment in progress
5. Scale API replicas if needed
6. Identify and optimize slow queries

## Performance Tuning

### Node.js Tuning

```bash
# Set Node.js memory limit
NODE_OPTIONS="--max-old-space-size=1024"

# Enable Node.js clustering (future: PM2 or cluster mode)
```

### Database Tuning

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check connection count
SELECT count(*) FROM pg_stat_activity WHERE state != 'idle';
```

### Connection Pool Configuration

```typescript
// Prisma connection pool (configured via DATABASE_URL)
DATABASE_URL=postgresql://...?connection_limit=20&pool_timeout=10
```

## Capacity Planning

### Sizing Guidelines

| Concurrent Users | API Replicas | DB CPU | DB Memory | Redis Memory |
|---|---|---|---|---|
| < 100 | 1 | 1 core | 1 GB | 256 MB |
| 100-500 | 2-3 | 2 cores | 2 GB | 512 MB |
| 500-2000 | 3-5 | 4 cores | 4 GB | 1 GB |
| 2000-10000 | 5-10 | 8 cores | 8 GB | 2 GB |

### Growth Indicators

Monitor these metrics monthly to plan capacity:
- Active tenant count growth rate
- Messages per day growth rate
- AI API call volume growth
- Storage growth rate
- Peak concurrent connections

## Routine Maintenance

### Daily

- [ ] Review error logs for new failure patterns
- [ ] Check backup completion status
- [ ] Monitor disk usage trends
- [ ] Review API response time trends

### Weekly

- [ ] Review database slow query log
- [ ] Analyze cache hit rates
- [ ] Review rate limit hit patterns
- [ ] Check SSL certificate expiry
- [ ] Review dependency vulnerabilities (`pnpm audit`)

### Monthly

- [ ] Capacity planning review
- [ ] Performance benchmark comparison
- [ ] Security patch updates
- [ ] Review and update runbooks
- [ ] Database maintenance (VACUUM ANALYZE)
- [ ] Review and rotate logs

### Quarterly

- [ ] Disaster recovery drill
- [ ] Load testing
- [ ] Security audit review
- [ ] Architecture review
- [ ] Documentation update

## Disaster Recovery

### Recovery Time Objectives (RTO)

| Component | RTO | Strategy |
|---|---|---|
| API | < 5 min | Kubernetes auto-healing or Docker restart |
| PostgreSQL | < 30 min | Restore from latest backup |
| Redis | < 5 min | Rebuild from DB, no critical state |
| Full System | < 1 hour | Full redeploy from backup |

### Recovery Point Objectives (RPO)

| Component | RPO | Backup Frequency |
|---|---|---|
| Database | < 24 hours | Daily backup at 02:00 UTC |
| Configuration | < 24 hours | Git version control |
| User uploads | < 1 hour | S3 cross-region replication |

### DR Drill Procedure

1. Simulate primary database failure
2. Verify backup exists and is valid
3. Restore database to a test environment
4. Verify data integrity (record counts, checksums)
5. Point API to restored database
6. Verify API functionality end-to-end
7. Document any issues found
8. Update runbook with lessons learned
