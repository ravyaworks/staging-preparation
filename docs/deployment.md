# Deployment Guide

## Prerequisites

- Docker Engine 24+ and Docker Compose v2+
- Domain with DNS configured (A records for `api.*`, `monitor.*`, `traefik.*`)
- SMTP server for transactional emails
- WhatsApp Business Account with API access
- OpenAI API key

## Production Deployment

### 1. Clone and Configure

```bash
git clone https://github.com/anomalyco/conversation-platform.git
cd conversation-platform
cp .env.example .env
# Edit .env with your production values
```

### 2. Deploy with Docker Compose

```bash
docker compose -f docker-compose.prod.yml up -d
```

This starts: Traefik (reverse proxy + TLS), PostgreSQL, Redis, API server, Worker pool, Prometheus, Grafana, Loki, and automated backup.

### 3. Database Migrations

```bash
docker exec cp-api pnpm prisma:migrate:deploy
```

### 4. Verify Deployment

```bash
curl https://api.yourdomain.com/health
```

Expected response: `{"status":"ok","version":"x.y.z","uptime":123}`

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main/develop | Lint, typecheck, unit tests, build, security scan |
| `e2e.yml` | Push/PR to main | Full E2E test suite with Playwright |
| `release.yml` | Tag push `v*.*.*` | Docker image build + publish + GitHub Release |
| `security.yml` | Weekly schedule + push | Dependency, secret, CodeQL, Docker scans |

### Release Process

1. Merge changes to `develop`
2. Run tests and verify stability
3. Create release branch: `release/v1.x.x`
4. Tag release: `git tag v1.x.x && git push origin v1.x.x`
5. CI builds and publishes Docker image to GHCR
6. GitHub Release created with auto-generated notes
7. Deploy to staging, then production

## Environment-Specific Configs

| Environment | docker-compose file | Key Differences |
|-------------|-------------------|-----------------|
| Development | docker-compose.yml | Hot reload, verbose logging, debug ports |
| Staging | docker-compose.prod.yml | Production-like, staging secrets |
| Production | docker-compose.prod.yml | TLS, monitoring, backup, scaled workers |

## Rollback Procedure

```bash
# Revert to previous Docker image tag
docker compose -f docker-compose.prod.yml pull api:previous-tag
docker compose -f docker-compose.prod.yml up -d api
# If database migration was applied, rollback the migration
docker exec cp-api pnpm prisma:migrate:down
```
