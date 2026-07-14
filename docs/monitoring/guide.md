# Monitoring Guide

## Prometheus Metrics Exposed

The API exposes a Prometheus-compatible metrics endpoint at `GET /api/v1/health/prometheus`.

### Available Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | counter | `method`, `path` | Total HTTP requests |
| `http_requests_rps` | gauge | `method`, `path` | Requests per second |
| `process_uptime_seconds` | gauge | — | Process uptime in seconds |
| `process_memory_bytes` | gauge | `type` | Memory usage (rss, heapTotal, heapUsed) |

### Prometheus Scrape Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'conversation-platform-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['api:3000']
    metrics_path: /api/v1/health/prometheus
    honor_labels: true
```

### Internal Metrics Endpoint

Additional metrics at `GET /api/v1/health/metrics` (JSON format):

```json
{
  "success": true,
  "data": {
    "metrics": {
      "GET:/api/v1/health": { "count": 12345, "rps": 5.2 },
      "POST:/api/v1/messages": { "count": 8901, "rps": 3.1 },
      "GET:/api/v1/conversations": { "count": 4567, "rps": 1.8 }
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

## Health Check Endpoints

| Endpoint | Purpose | Response |
|---|---|---|
| `GET /api/v1/health` | Full health check with DB connectivity | 200 `{ status: "healthy" }` or 503 `{ status: "degraded" }` |
| `GET /api/v1/health/ready` | Kubernetes readiness probe | 200 `{ status: "ready" }` |
| `GET /api/v1/health/live` | Kubernetes liveness probe | 200 `{ status: "alive" }` |
| `GET /api/v1/health/metrics` | JSON metrics + memory | 200 with metrics object |
| `GET /api/v1/health/prometheus` | Prometheus text format | 200 text/plain |
| `POST /api/v1/health/metrics/reset` | Reset metrics counters | 200 `{ reset: true }` |

### Health Check Details

The `/api/v1/health` endpoint performs:
1. **Database connectivity test**: `SELECT 1` with latency measurement
2. **Aggregated status**: Returns `healthy` if all checks pass, `degraded` if any fail
3. **Version reporting**: Reports `APP_VERSION` env var
4. **Uptime tracking**: Reports `process.uptime()`

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

## Key Metrics to Monitor

### API Throughput

| Metric | Description | How to Measure |
|---|---|---|
| Requests per second | Total API RPS | `http_requests_rps` or Prometheus `rate()` |
| Requests per endpoint | RPS breakdown by route | `http_requests_rps{path="/api/v1/messages"}` |
| Peak RPS | Maximum observed RPS | `max_over_time(http_requests_rps[1h])` |

### Queue Depth

| Metric | Description | How to Measure |
|---|---|---|
| Pending jobs | Jobs waiting to be processed | `queue_pending` via `/api/v1/health/metrics` |
| Processing jobs | Currently executing jobs | `queue_processing` |
| Failed jobs | Jobs that failed after all retries | `queue_failed` |
| Job processing time | Average time per job | Track in application logs |

### Error Rates

| Metric | Description | Threshold |
|---|---|---|
| 5xx error rate | Server errors / total requests | > 1% warning, > 5% critical |
| 4xx error rate | Client errors / total requests | > 10% may indicate API issues |
| Error rate by endpoint | Per-route error rate | > 5% for any single route |
| Unhandled exceptions | Exceptions not caught by error handler | 0 (any = investigate) |

### Latency Percentiles

| Percentile | Description | Warning | Critical |
|---|---|---|---|
| p50 (median) | Typical response time | > 100ms | > 500ms |
| p95 | 95th percentile | > 500ms | > 2000ms |
| p99 | 99th percentile | > 1000ms | > 5000ms |
| p999 | Worst case | > 2000ms | > 10000ms |

### Database Metrics

| Metric | Description | How to Measure |
|---|---|---|
| Connection pool usage | Active / max connections | `pg_stat_activity` count vs pool size |
| Query latency | Average query execution time | `pg_stat_statements.mean_exec_time` |
| Slow queries | Queries exceeding threshold | `pg_stat_statements` filtered by time |
| Cache hit ratio | Buffer cache efficiency | `pg_stat_database.blks_hit / (blks_hit + blks_read)` |
| Transaction rate | Commits per second | `pg_stat_database.xact_commit` |

### Redis Metrics

| Metric | Description | How to Measure |
|---|---|---|
| Memory usage | Used / max memory | `redis-cli INFO memory` |
| Hit rate | Cache hits / (hits + misses) | `redis-cli INFO stats` keyspace_hits/misses |
| Eviction rate | Keys evicted per second | `redis-cli INFO stats` evicted_keys |
| Connection count | Active connections | `redis-cli INFO clients` connected_clients |
| Operations per second | Total ops/sec | `redis-cli INFO stats` instantaneous_ops_per_sec |

## Grafana Dashboard Setup

### Dashboard: API Overview

```json
{
  "dashboard": {
    "title": "Conversation Platform - API",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "5xx Error Rate"
          }
        ],
        "thresholds": [
          { "value": 0.01, "color": "yellow" },
          { "value": 0.05, "color": "red" }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_memory_bytes{type=\"heapUsed\"}",
            "legendFormat": "Heap Used"
          },
          {
            "expr": "process_memory_bytes{type=\"rss\"}",
            "legendFormat": "RSS"
          }
        ]
      },
      {
        "title": "Uptime",
        "type": "stat",
        "targets": [
          {
            "expr": "process_uptime_seconds",
            "legendFormat": "Uptime"
          }
        ]
      }
    ]
  }
}
```

### Dashboard: Database

Create panels for:
- Connection count over time
- Query rate and latency
- Cache hit ratio
- Table bloat and dead tuples
- Transaction rate

### Dashboard: Redis

Create panels for:
- Memory usage and eviction rate
- Hit rate percentage
- Connection count
- Operations per second

## Alert Thresholds

### Critical Alerts (Immediate Action)

| Alert | Condition | Duration | Action |
|---|---|---|---|
| API Down | Health check fails | 1 min | Restart service, investigate |
| Database Down | Cannot connect | 1 min | Check PostgreSQL, restart |
| Error Rate > 5% | 5xx responses / total | 2 min | Check logs, identify cause |
| p99 Latency > 5s | Response time | 5 min | Scale API, check dependencies |
| Container Restarting | > 5 restarts in 10 min | 10 min | Investigate crash cause |

### Warning Alerts (Investigate Soon)

| Alert | Condition | Duration | Action |
|---|---|---|---|
| Error Rate > 1% | 5xx responses / total | 5 min | Review error logs |
| p95 Latency > 500ms | Response time | 5 min | Check slow queries |
| DB Connection Pool > 80% | Active / max | 5 min | Increase pool or scale |
| Redis Memory > 80% | Used / max | 10 min | Increase memory or optimize |
| Queue Depth > 100 | Pending jobs | 5 min | Scale workers |
| Certificate Expiry < 30d | Days to expiry | Daily | Renew certificate |

### Info Alerts (Monitor)

| Alert | Condition | Duration | Action |
|---|---|---|---|
| High Traffic | RPS > 2x baseline | 5 min | Consider scaling |
| New Error Pattern | New error code appears | 1 min | Review and categorize |

## Logging Configuration

### Pino Structured Logging

The platform uses Pino for high-performance JSON structured logging:

```typescript
// Configuration
const logger = pino({
  name: 'api',
  level: 'info',           // debug | info | warn | error | fatal
  transport: undefined,     // undefined for JSON, { target: 'pino/file' } for pretty
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});
```

### Log Entry Structure

```json
{
  "level": 30,
  "time": 1705312200000,
  "pid": 1234,
  "hostname": "cp-api-abc123",
  "name": "api",
  "method": "POST",
  "path": "/api/v1/messages",
  "status": 200,
  "duration": "45ms",
  "ip": "10.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req-abc123",
  "msg": "request completed"
}
```

### Child Loggers

Contextual information is attached via child loggers:

```typescript
// Tenant-scoped logger
const tenantLogger = logger.child({ tenantId: 'tenant-123', userId: 'user-456' });
tenantLogger.info('User authenticated');

// Request-scoped logger
const reqLogger = logger.child({ requestId: 'req-abc', conversationId: 'conv-789' });
reqLogger.info('Message processed');
```

### Log Levels

| Level | Value | When to Use |
|---|---|---|
| `debug` | 10 | Detailed debugging info (development only) |
| `info` | 20 | Normal operation events (requests, connections) |
| `warn` | 30 | Unexpected but recoverable (retries, fallbacks) |
| `error` | 40 | Failures requiring attention (provider errors, DB errors) |
| `fatal` | 50 | Critical failures causing process exit |

### Sensitive Data in Logs

The following are automatically excluded or masked:
- Passwords and password hashes — never logged
- JWT tokens — only token type logged, not the value
- API key full values — only `keyPrefix` logged
- Database connection strings — only host/port logged (not credentials)

### Log Aggregation Setup

```bash
# Pipe to Loki via pino-loki
docker compose logs -f api | pino-loki \
  --hostname cp-api \
  --base-url http://loki:3100 \
  --labels '{"app":"conversation-platform","env":"production"}'

# Pipe to file with rotation
docker compose logs -f api | tee -a /var/log/cp-api.json

# Use Docker logging driver
docker compose -f docker-compose.prod.yml up -d \
  --logging-driver=json-file \
  --logging-opt max-size=10m \
  --logging-opt max-file=5
```

## Error Tracking Integration

### Sentry Integration

```bash
# Environment variable
SENTRY_DSN=https://...@sentry.io/...
```

### Error Context

When errors occur, the following context is captured:
- Request ID (for correlation)
- Tenant ID
- User ID (if authenticated)
- HTTP method and path
- User agent and IP
- Stack trace
- Custom tags (environment, version)

### Error Categories

| Category | Examples | Severity |
|---|---|---|
| Application errors | Validation failures, business logic errors | Warning/Error |
| Provider errors | AI API failures, rate limits | Error |
| Database errors | Connection failures, query timeouts | Error |
| External service errors | Webhook delivery failures | Warning |
| System errors | Out of memory, unhandled rejections | Fatal |

## Distributed Tracing

### Request ID Propagation

Every request receives a unique `requestId` that propagates through:
1. Generated by `requestId` middleware (`apps/api/src/middleware/request-id.ts`)
2. Added to response headers (`X-Request-Id`)
3. Attached to all log entries within the request
4. Passed to child services in the request context

### Trace Context

```typescript
// Request context carries trace information
interface TraceContext {
  requestId: string;
  tenantId: string;
  userId?: string;
  spanId?: string;   // Future: OpenTelemetry span
  traceId?: string;  // Future: OpenTelemetry trace
}
```

### OpenTelemetry (Future)

For distributed tracing across services:

```bash
# Add OpenTelemetry SDK
pnpm add @opentelemetry/sdk-node
pnpm add @opentelemetry/exporter-trace-otlp-http
pnpm add @opentelemetry/instrumentation-express
pnpm add @opentelemetry/instrumentation-pg
```

```typescript
// Tracing setup
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [
    new ExpressInstrumentation(),
    new PgInstrumentation(),
  ],
  serviceName: 'conversation-platform-api',
});

sdk.start();
```

### Trace Visualization

With OpenTelemetry + Jaeger/Tempo:
- See request flow across middleware, routes, and external calls
- Identify slow spans in the request lifecycle
- Correlate errors with specific trace spans
- Visualize database query timing within requests

## Monitoring Checklist

### Daily

- [ ] Review error rate trends
- [ ] Check API response time trends
- [ ] Review database connection pool usage
- [ ] Check Redis memory usage
- [ ] Review queue depth and processing times
- [ ] Check container restart events

### Weekly

- [ ] Analyze slow query log
- [ ] Review cache hit rates
- [ ] Check disk usage trends
- [ ] Review rate limit hits
- [ ] Analyze traffic patterns
- [ ] Check SSL certificate expiry

### Monthly

- [ ] Capacity planning review
- [ ] Performance benchmark comparison
- [ ] Alert threshold review and tuning
- [ ] Dashboard review and updates
- [ ] Monitoring infrastructure updates
