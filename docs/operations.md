# Operations Guide

## Monitoring Stack

| Component | Port | Purpose |
|-----------|------|---------|
| Grafana | 3000 | Dashboards and alerting |
| Prometheus | 9090 | Metrics collection (30d retention) |
| Loki | 3100 | Log aggregation |
| Traefik | 8080 | Reverse proxy metrics |

## Health Checks

### API Health Endpoint
```bash
curl https://api.yourdomain.com/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected",
  "memory": "45%",
  "cpu": "12%"
}
```

### Service Health Commands
```bash
# Check all service statuses
docker compose -f docker-compose.prod.yml ps

# View service logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker

# Check database health
docker exec cp-postgres pg_isready -U postgres
```

## Backup & Restore

### Automated Backups
- **Schedule**: Daily at midnight (configurable via `SCHEDULE` env var)
- **Retention**: 30 daily, 4 weekly, 6 monthly backups
- **Location**: Docker volume `backup-data`
- **Format**: Compressed PostgreSQL dump (gzip, -Z9)

### Manual Backup
```bash
docker exec cp-postgres pg_dump -U postgres conversation_platform -Z9 > backup_$(date +%Y%m%d).sql.gz
```

### Manual Restore
```bash
gunzip -c backup_20240101.sql.gz | docker exec -i cp-postgres psql -U postgres conversation_platform
```

## Scaling

### Horizontal Scaling
- Increase `WORKER_REPLICAS` env var
- Add more API instances behind Traefik load balancer
- Use PostgreSQL connection pooling (PgBouncer)

### Vertical Scaling
- Adjust Docker resource limits per service in `docker-compose.prod.yml`
- Scale Redis memory: `redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru`
- Scale PostgreSQL: Increase shared_buffers, effective_cache_size

## Incident Response

### Severity Levels

| Level | Response Time | Example |
|-------|--------------|---------|
| P0 | < 15 min | API down, database unreachable |
| P1 | < 1 hour | Performance degradation, partial outage |
| P2 | < 4 hours | Non-critical feature broken |
| P3 | < 24 hours | Minor bug, no user impact |

### Runbooks

**P0 - API Down**
1. Check Traefik: `docker compose logs traefik --tail=50`
2. Check API health: `curl localhost:3001/health`
3. Check database: `docker exec cp-postgres pg_isready`
4. Check Redis: `docker exec cp-redis redis-cli ping`
5. Restart service: `docker compose restart api`
6. If persists, rollback to previous image

**P1 - Slow Response Times**
1. Check CPU/memory: `docker stats`
2. Check database slow queries
3. Check Redis memory usage
4. Check rate limiting logs
5. Scale up workers/resources

## Log Management

### Log Levels
- `error`: Production failures requiring immediate attention
- `warn`: Potential issues, non-critical
- `info`: Normal operations (default production level)
- `debug`: Development troubleshooting (never in production)
- `trace`: Full request/response logging

### Log Query Examples (Grafana / Loki)
```
{service="api"} |= "error"
{service="worker"} |= "job.failed" | json
{service="db"} |= "slow query" |= "duration"
```
