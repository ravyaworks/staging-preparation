# Staging Deployment Guide

## Prerequisites

- Docker & Docker Compose v2
- Node.js >= 20
- pnpm >= 9 (`corepack enable && corepack prepare pnpm@latest --activate`)

## Quick Start

```bash
# 1. Clone and install
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET, ENCRYPTION_KEY, etc.)

# 3. Build everything
pnpm build

# 4. Start staging stack
docker compose -f docker-compose.staging.yml up -d

# 5. Run database migrations
pnpm db:deploy

# 6. Seed default data (optional)
pnpm db:seed

# 7. Verify
curl http://localhost:3001/health
```

## Service Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Dashboard  │────▶│     API      │────▶│  PostgreSQL   │
│  (port 3000) │     │  (port 3001) │     │  (port 5432)  │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌──────────────┐
                    │   Worker     │     │     Redis     │
                    │  (internal)  │     │  (port 6379)  │
                    └──────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  Scheduler   │     │  Prometheus   │
                    │  (internal)  │     │  (port 9090)  │
                    └──────────────┘     └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │   Grafana     │
                                         │  (port 3002)  │
                                         └──────────────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │    Loki       │
                                         │  (port 3100)  │
                                         └──────────────┘
```

## Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| PostgreSQL | cp-staging-postgres | 5432 | Primary database |
| Redis | cp-staging-redis | 6379 | Queue & cache |
| API | cp-staging-api | 3001 | HTTP API server |
| Worker | cp-staging-worker | - | Background job processor |
| Dashboard | cp-staging-dashboard | 3000 | Next.js admin UI |
| Scheduler | cp-staging-scheduler | - | Cron job dispatcher |
| Prometheus | cp-staging-prometheus | 9090 | Metrics collection |
| Grafana | cp-staging-grafana | 3002 | Monitoring dashboards |
| Loki | cp-staging-loki | 3100 | Log aggregation |

## Environment Variables

See `.env.example` for the complete list of required variables.

### Required Secrets

| Variable | Description | Generate With |
|----------|-------------|---------------|
| `JWT_SECRET` | JWT signing key | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Data encryption key (32 bytes) | `openssl rand -base64 32` |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 16` |
| `REDIS_PASSWORD` | Redis password | `openssl rand -base64 16` |

## Docker Commands

```bash
# Start all services
docker compose -f docker-compose.staging.yml up -d

# View logs
docker compose -f docker-compose.staging.yml logs -f
docker compose -f docker-compose.staging.yml logs -f api
docker compose -f docker-compose.staging.yml logs -f worker

# Stop services
docker compose -f docker-compose.staging.yml down

# Rebuild specific service
docker compose -f docker-compose.staging.yml build api
docker compose -f docker-compose.staging.yml up -d api

# Reset everything (DANGER: deletes volumes)
docker compose -f docker-compose.staging.yml down -v
```

## Database Management

```bash
# Generate Prisma client (after schema changes)
pnpm db:generate

# Create a migration
pnpm db:migrate

# Apply migrations (staging/production)
pnpm db:deploy

# Seed default data
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

## Health Checks

```bash
# API health
curl http://localhost:3001/health

# PostgreSQL
docker exec cp-staging-postgres pg_isready -U cp_user

# Redis
docker exec cp-staging-redis redis-cli ping

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3002/api/health
```

## Troubleshooting

### API won't start (database connection refused)
```bash
# Ensure postgres is healthy
docker compose -f docker-compose.staging.yml ps postgres
docker compose -f docker-compose.staging.yml logs postgres
```

### Worker exits immediately
```bash
# Check worker logs
docker compose -f docker-compose.staging.yml logs worker
# Ensure database is migrated
pnpm db:deploy
```

### Dashboard shows blank page
```bash
# Verify API is reachable
curl http://localhost:3001/health
# Check NEXT_PUBLIC_API_URL in .env matches the API URL
```

### Port conflicts
Edit `docker-compose.staging.yml` or override via `.env`:
```bash
API_PORT=3005
DASHBOARD_PORT=3006
```

### Rebuild after code changes
```bash
docker compose -f docker-compose.staging.yml build api worker
docker compose -f docker-compose.staging.yml up -d api worker
```

## Smoke Test Checklist

After deployment, verify:

```bash
# 1. API responds
curl http://localhost:3001/health

# 2. Auth endpoint works
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# 3. Dashboard loads
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# 4. Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up

# 5. Logs are flowing
docker compose -f docker-compose.staging.yml logs --tail=20 api
```
