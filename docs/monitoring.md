# Monitoring Guide

## Metrics Stack

The platform uses Prometheus + Grafana for metrics collection and visualization.

### Prometheus Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, path, status | Total API requests |
| `http_request_duration_ms` | Histogram | method, path | Request latency |
| `messages_processed_total` | Counter | channel, status | Messages processed |
| `queue_jobs_total` | Gauge | queue, status | Queue depth by status |
| `db_query_duration_ms` | Histogram | query, table | Database query latency |
| `active_connections` | Gauge | service | Active WebSocket connections |
| `memory_usage_bytes` | Gauge | service | Process memory usage |
| `cpu_usage_percent` | Gauge | service | CPU utilization |

### Key Dashboards

#### API Performance Dashboard
- Request rate (RPS) by endpoint
- P50/P95/P99 latency
- Error rate by status code
- Active connections over time

#### Business Dashboard
- Messages sent/received per hour
- Active conversations
- Campaign delivery rates
- Tenant activity breakdown

#### Infrastructure Dashboard
- CPU/Memory/Disk per service
- Database connections and slow queries
- Redis memory and hit rate
- Queue depth and processing time

## Alerting Rules

### Critical Alerts (P0)
```
- api_down: API health check fails for 1 minute
- database_down: Database connection fails
- high_error_rate: Error rate > 5% for 5 minutes
- queue_backlog: Queue depth > 10,000 for 10 minutes
```

### Warning Alerts (P1)
```
- high_latency: P99 latency > 2s for 5 minutes
- high_cpu: CPU > 80% for 10 minutes
- high_memory: Memory > 85% for 10 minutes
- low_disk: Disk space < 20%
```

## Log Aggregation

All services ship logs to Loki via the Docker logging driver. Logs are structured JSON with these fields:

```json
{
  "timestamp": "2026-01-15T10:30:00.000Z",
  "level": "info",
  "service": "api",
  "requestId": "req_abc123",
  "message": "Message processed",
  "duration": 145,
  "metadata": { "tenantId": "t1", "conversationId": "c1" }
}
```

## Uptime Monitoring

External health checks should be configured (e.g., UptimeRobot, Checkly, or Grafana Cloud):
- **Endpoint**: `https://api.yourdomain.com/health`
- **Interval**: 1 minute
- **Locations**: Multi-region
- **Notifications**: Email, Slack, PagerDuty

## Tracing

OpenTelemetry is configured for distributed tracing:
- Traces sent to Jaeger or Tempo
- Sampling rate: 10% (configurable via `SENTRY_TRACES_SAMPLE_RATE`)
- Key spans: HTTP requests, database queries, queue operations, WhatsApp API calls

## Runbooks

### High Error Rate
1. Check Loki for error patterns in the last 15 minutes
2. Check Sentry for new issues
3. Check if recent deployment introduced regression
4. Verify downstream services (WhatsApp API, OpenAI) are operational
5. Rollback if recent change is identified as cause

### Database Performance Degradation
1. Check `pg_stat_activity` for long-running queries
2. Check `pg_stat_statements` for high-frequency queries
3. Review slow query log
4. Check connection pool saturation
5. Add missing indexes or optimize queries
