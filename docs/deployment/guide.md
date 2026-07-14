# Deployment Guide

## Prerequisites

| Dependency | Minimum Version | Recommended |
|---|---|---|
| Node.js | 20.x | 20 LTS (latest) |
| pnpm | 9.x | 9.1+ |
| Docker | 24.x | 25+ |
| Docker Compose | 2.x | 2.24+ |
| PostgreSQL | 16 | 16-alpine |
| Redis | 7 | 7-alpine |
| Helm (K8s) | 3.x | 3.14+ |
| kubectl (K8s) | 1.28+ | 1.29+ |

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd conversation-platform
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with production values:

```bash
# Application
APP_NAME=conversation-platform
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (use strong credentials)
DATABASE_URL=postgresql://cp_user:<STRONG_PASSWORD>@localhost:5432/conversation_platform
DATABASE_MAX_CONNECTIONS=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=cp:

# Authentication (generate strong secrets)
JWT_SECRET=<64-char-random-hex>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<64-char-random-hex>
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
JWT_ISSUER=conversation-platform

# CORS
CORS_ORIGINS=https://your-domain.com,https://dashboard.your-domain.com
CORS_METHODS=GET,POST,PUT,PATCH,DELETE

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_PRETTY=false

# AI Providers (set at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Storage (optional)
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads

# Monitoring (optional)
SENTRY_DSN=https://...@sentry.io/...

# Application Version
APP_VERSION=0.1.0
```

### 3. Generate Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate REFRESH_TOKEN_SECRET
openssl rand -hex 32
```

## Database Setup

### Development

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed initial data (permissions, roles, admin tenant/user)
pnpm db:seed

# Open Prisma Studio (optional)
pnpm db:studio
```

### Production

```bash
# Deploy migrations (no interactive prompts)
pnpm db:deploy

# Seed (idempotent — skips if data exists)
pnpm db:seed
```

### Migration Commands Reference

| Command | Environment | Description |
|---|---|---|
| `pnpm db:generate` | All | Generate Prisma Client |
| `pnpm db:migrate` | Development | Create and apply migration |
| `pnpm db:deploy` | Production | Apply pending migrations only |
| `pnpm db:seed` | All | Seed initial data (idempotent) |
| `pnpm db:studio` | Development | Open Prisma Studio GUI |
| `pnpm db:reset` | Development | Reset database and re-apply |

## Docker Deployment (Single-Node)

### Quick Start with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f api

# Check service health
docker compose ps
```

### Services Included

| Service | Image | Port | Purpose |
|---|---|---|---|
| `postgres` | postgres:16-alpine | 5432 | Primary database |
| `redis` | redis:7-alpine | 6379 | Cache, sessions, rate limiting |
| `api` | Built from Dockerfile | 3000 | API server + WebSocket |

### Docker Compose Health Checks

Both PostgreSQL and Redis have health checks configured. The API service waits for both to be healthy before starting.

## Production Docker Compose Deployment

### Production Compose File

Create `docker-compose.prod.yml`:

```yaml
name: conversation-platform

services:
  postgres:
    image: postgres:16-alpine
    container_name: cp-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-conversation_platform}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB:-conversation_platform}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
    networks:
      - cp-network

  redis:
    image: redis:7-alpine
    container_name: cp-redis
    restart: always
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1'
    networks:
      - cp-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: cp-api
    restart: always
    ports:
      - "${API_PORT:-3000}:3000"
    environment:
      NODE_ENV: production
      PORT: "3000"
      HOST: "0.0.0.0"
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-conversation_platform}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
      REFRESH_TOKEN_EXPIRES_IN: ${REFRESH_TOKEN_EXPIRES_IN:-7d}
      BCRYPT_ROUNDS: ${BCRYPT_ROUNDS:-12}
      CORS_ORIGINS: ${CORS_ORIGINS}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      LOG_PRETTY: "false"
      APP_VERSION: ${APP_VERSION:-0.1.0}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/v1/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1'
    networks:
      - cp-network

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local

networks:
  cp-network:
    driver: bridge
```

### Deploy Production

```bash
# Set environment
export $(cat .env | grep -v '^#' | xargs)

# Build and deploy
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations after services are up
docker compose -f docker-compose.prod.yml exec api pnpm db:deploy

# Seed (if first deployment)
docker compose -f docker-compose.prod.yml exec api pnpm db:seed
```

## Kubernetes Deployment (with Helm)

### Helm Chart Structure

```
infrastructure/kubernetes/helm/cp-api/
├── Chart.yaml
├── values.yaml
├── values-production.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── hpa.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── serviceaccount.yaml
    └── _helpers.tpl
```

### values.yaml

```yaml
replicaCount: 3

image:
  repository: your-registry.com/conversation-platform/api
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
  hosts:
    - host: api.conversation-platform.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.conversation-platform.com

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

env:
  NODE_ENV: production
  PORT: "3000"
  HOST: "0.0.0.0"
  LOG_LEVEL: info
  LOG_PRETTY: "false"
  JWT_EXPIRES_IN: "15m"
  REFRESH_TOKEN_EXPIRES_IN: "7d"
  BCRYPT_ROUNDS: "12"

postgresql:
  host: postgres-primary.database.svc.cluster.local
  port: 5432
  database: conversation_platform
  existingSecret: cp-database-credentials
  existingSecretKey: database-url

redis:
  host: redis-master.cache.svc.cluster.local
  port: 6379
  existingSecret: cp-redis-credentials
  existingSecretKey: redis-url

resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

probes:
  liveness:
    path: /api/v1/health/live
    initialDelaySeconds: 30
    periodSeconds: 30
  readiness:
    path: /api/v1/health/ready
    initialDelaySeconds: 10
    periodSeconds: 10
  startup:
    path: /api/v1/health/live
    initialDelaySeconds: 5
    periodSeconds: 5
    failureThreshold: 30

podDisruptionBudget:
  enabled: true
  minAvailable: 2

serviceAccount:
  create: true
  name: cp-api
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace conversation-platform

# Create secrets
kubectl create secret generic cp-database-credentials \
  --namespace=conversation-platform \
  --from-literal=database-url="postgresql://cp_user:PASSWORD@postgres-primary.database.svc.cluster.local:5432/conversation_platform"

kubectl create secret generic cp-api-secrets \
  --namespace=conversation-platform \
  --from-literal=jwt-secret="$(openssl rand -hex 32)" \
  --from-literal=refresh-token-secret="$(openssl rand -hex 32)" \
  --from-literal=openai-api-key="sk-..."

# Install with Helm
helm upgrade --install cp-api ./infrastructure/kubernetes/helm/cp-api \
  --namespace conversation-platform \
  -f ./infrastructure/kubernetes/helm/cp-api/values-production.yaml

# Check deployment status
kubectl get pods -n conversation-platform
kubectl rollout status deployment/cp-api -n conversation-platform

# Run migrations as a job
kubectl run cp-migrate --rm -i \
  --namespace=conversation-platform \
  --image=your-registry.com/conversation-platform/api:latest \
  --env="DATABASE_URL=$(kubectl get secret cp-database-credentials -n conversation-platform -o jsonpath='{.data.database-url}' | base64 -d)" \
  -- pnpm db:deploy
```

## Multi-Region Deployment

See [multi-region.md](./multi-region.md) for detailed configuration.

### Summary

| Region | ID | API Hostname | Data Isolation |
|---|---|---|---|
| US-East | us-east | api-us-east.conversation-platform.com | Own PostgreSQL + Redis |
| EU-West | eu-west | api-eu-west.conversation-platform.com | Own PostgreSQL + Redis |
| AP-Southeast | ap-southeast | api-ap-southeast.conversation-platform.com | Own PostgreSQL + Redis |

### Key Constraints

- WebSocket connections are region-local (no cross-region passthrough)
- Webhook delivery targets the origin region's API
- Data isolation: each region has its own database (no global replication)
- API keys are region-scoped (tenant + region)
- DNS-based global routing (Route53, Cloudflare) directs traffic to nearest region

## Zero-Downtime Deployment Strategy

### Rolling Update (Kubernetes)

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

### Deployment Steps

1. Build new Docker image with version tag
2. Push to container registry
3. Update Helm values with new image tag
4. `helm upgrade` triggers rolling update
5. New pods start and pass health checks
6. Old pods drain active connections
7. Old pods terminated

### Pre-Deployment Checklist

```bash
# Run tests
pnpm test
pnpm lint
pnpm typecheck

# Build
pnpm build

# Verify Docker build
docker build -f apps/api/Dockerfile -t cp-api:test .
docker run --rm -e DATABASE_URL=postgresql://... cp-api:test node dist/index.js --help

# Run migrations first (if schema changes)
pnpm db:deploy

# Then deploy application
```

### Rollback Procedure

```bash
# Kubernetes: rollback to previous revision
helm rollback cp-api <REVISION> -n conversation-platform

# Docker Compose: revert image tag and redeploy
# Edit docker-compose.prod.yml to use previous image tag
docker compose -f docker-compose.prod.yml up -d --no-deps api
```

## Health Checks and Monitoring

### Health Endpoints

| Endpoint | Purpose | Expected Response |
|---|---|---|
| `GET /api/v1/health` | Full health check (DB connectivity) | 200 OK or 503 |
| `GET /api/v1/health/ready` | Readiness probe | 200 `{ status: "ready" }` |
| `GET /api/v1/health/live` | Liveness probe | 200 `{ status: "alive" }` |
| `GET /api/v1/health/metrics` | Runtime metrics + memory | 200 with metrics JSON |
| `GET /api/v1/health/prometheus` | Prometheus-format metrics | text/plain |

### Kubernetes Probe Configuration

```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 30
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/v1/health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /api/v1/health/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 30
```

## SSL/TLS Configuration

### Option 1: Cert-Manager (Kubernetes)

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@your-domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### Option 2: Nginx Reverse Proxy (Docker)

```nginx
server {
    listen 443 ssl http2;
    server_name api.conversation-platform.com;

    ssl_certificate /etc/ssl/certs/api.crt;
    ssl_certificate_key /etc/ssl/private/api.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;

    location / {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### Option 3: Cloud Load Balancer

Configure SSL termination at the cloud load balancer level (ALB, GCLB, Azure LB). Forward plain HTTP to the API pods.

## Backup and Restore Procedures

### PostgreSQL Backup

```bash
# Manual backup
docker compose exec postgres pg_dump -U cp_user conversation_platform | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Automated daily backup (cron)
0 2 * * * docker compose exec -T postgres pg_dump -U cp_user conversation_platform | gzip > /backups/cp_$(date +\%Y\%m\%d).sql.gz

# Retain last 30 days
find /backups -name "cp_*.sql.gz" -mtime +30 -delete
```

### PostgreSQL Restore

```bash
# Stop API to prevent writes
docker compose stop api

# Restore from backup
gunzip < backup_20240101_020000.sql.gz | docker compose exec -T postgres psql -U cp_user conversation_platform

# Restart API
docker compose start api
```

### Redis Backup

Redis uses AOF persistence (`appendonly yes`). Back up the AOF file:

```bash
docker compose exec redis redis-cli BGSAVE
docker compose cp redis:/data/dump.rdb ./backups/redis_$(date +%Y%m%d).rdb
```

### Configuration Backup

```bash
# Backup environment and config files
tar czf config_$(date +%Y%m%d).tar.gz .env docker-compose*.yml infrastructure/
```

## Scaling Guidelines

### API Horizontal Scaling

| Metric | Threshold | Action |
|---|---|---|
| CPU > 70% sustained | 5 min | Add API replica |
| Memory > 80% sustained | 5 min | Add API replica or increase limits |
| p95 latency > 500ms | 5 min | Add API replica |
| Active connections > 1000/pod | 5 min | Add API replica |

### PostgreSQL Scaling

| Metric | Threshold | Action |
|---|---|---|
| Connection count > 80% pool | 5 min | Increase `maxConnections` or add read replica |
| Query p95 > 200ms | 10 min | Analyze slow queries, add indexes |
| Disk > 80% | 1 hour | Expand volume or archive old data |
| Replication lag > 1s | 5 min | Investigate primary load |

### Redis Scaling

| Metric | Threshold | Action |
|---|---|---|
| Memory > 80% maxmemory | 10 min | Increase maxmemory or optimize keys |
| Eviction rate high | 10 min | Review TTL policies |
| Connection count > 1000 | 5 min | Scale Redis or use connection pooling |

### Recommended Starting Resources

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---|---|---|---|---|
| API (per pod) | 250m | 1000m | 512Mi | 1Gi |
| PostgreSQL | 500m | 2000m | 1Gi | 2Gi |
| Redis | 250m | 1000m | 512Mi | 1Gi |

## Troubleshooting

### Common Issues

**Database connection refused**
```bash
# Check PostgreSQL is running and healthy
docker compose ps postgres
docker compose logs postgres --tail=50

# Verify credentials
docker compose exec postgres psql -U cp_user -d conversation_platform -c "SELECT 1"
```

**Redis connection refused**
```bash
docker compose exec redis redis-cli ping
# Expected: PONG
```

**API fails to start**
```bash
docker compose logs api --tail=100
# Common causes:
# - Missing DATABASE_URL
# - Missing JWT_SECRET
# - Database not yet migrated
```

**Migration fails**
```bash
# Check database connectivity
docker compose exec api npx prisma db push --schema=packages/database/prisma/schema.prisma

# Reset database (development only!)
docker compose exec api pnpm db:reset
```

**WebSocket connection issues**
```bash
# Verify WebSocket endpoint
wscat -c ws://localhost:3000/ws?tenantId=default

# Check if port is open
curl -i http://localhost:3000/api/v1/health
```
