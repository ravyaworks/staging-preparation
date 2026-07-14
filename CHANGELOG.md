# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]


---

## [1.0.0] - 2026-07-14 — Phase 10: Production Readiness & Quality Assurance

### Added

#### End-to-End Tests (Playwright)
- Authentication flow tests (login, logout, session, RBAC)
- Campaign flow tests (creation, import, outreach, delivery, analytics)
- WhatsApp flow tests (queue, webhook, delivery, conversation)
- Conversation flow tests (incoming webhook, workflow, AI, handoff)
- Dashboard flow tests (navigation, filtering, reports, admin)

#### Integration Tests (Vitest)
- Database integration tests (CRUD, transactions, constraints, pagination)
- Redis cache integration tests (set/get, TTL, namespaces, error handling)
- Queue integration tests (job lifecycle, processing, metrics, pause/resume)
- Webhook integration tests (signature verification, registry, delivery, monitoring)
- WhatsApp integration tests (webhook validation, event extraction, media)
- AI Engine integration tests (intent classification, sentiment, response generation)
- Workflow Engine integration tests (registration, execution, parallel branches, timeouts)
- Analytics integration tests (event tracking, metrics, reports, export, real-time)

#### CI/CD Pipelines (GitHub Actions)
- CI pipeline with lint, typecheck, unit tests, build, and security scan
- E2E test workflow with Playwright, database, and Redis services
- Release pipeline with Docker build, GHCR publish, and GitHub Release
- Security scanning workflow (dependencies, secrets, CodeQL, Docker, Trivy, Dockle)

#### Docker & Infrastructure
- Production Docker Compose with Traefik, PostgreSQL, Redis, API, Worker, Prometheus, Grafana, Loki, automated backups
- Enhanced API Dockerfile with health checks, OCI labels, non-root user, multi-stage build
- Security audit script (`scripts/security/audit.sh`) with automated checks
- Security-hardened `.env.example` with comprehensive documentation

#### Documentation
- Architecture guide (`docs/architecture.md`)
- Deployment guide (`docs/deployment.md`)
- Operations guide (`docs/operations.md`)
- Security guide (`docs/security.md`)
- Database guide (`docs/database.md`)
- Monitoring guide (`docs/monitoring.md`)
- Release process (`docs/release.md`)
- Development guide (`docs/development.md`)

#### Release Management
- Production release notes (`RELEASE_NOTES.md`)
- Production readiness checklist (`PRODUCTION_READINESS_CHECKLIST.md`)
- Updated changelog with v1.0.0 release entry

### Changed
- Upgraded @playwright/test to v1.61.1
- Expanded Turbo pipeline with `test:e2e` and `test:integration` commands
- Enhanced `.env.example` with security-hardened defaults

### Security
- Automated security audit script with secret scanning, permission checks, and dependency auditing
- Weekly scheduled security scanning pipeline
- Docker image vulnerability scanning with Trivy
- Container best practices (non-root user, read-only FS, resource limits)
- Secret scanning on every push (TruffleHog + Gitleaks)

### Fixed
- All TypeScript errors in administration module (Phase 9)
- All lint warnings in administration package
- Dockerfile health check and non-root user configuration

### Planned

- OpenTelemetry distributed tracing integration
- WAF (Web Application Firewall) configuration
- CSRF token-based protection for browser forms
- File upload extension whitelist
- WebSocket JWT authentication
- Read replicas for analytics queries
- Table partitioning for high-volume tables
- PgBouncer connection pooling for high concurrency
- Automated dependency updates (Renovate/Dependabot)
- Load testing suite
- Penetration testing
- SOC 2 Type II audit preparation

---

## [0.1.0] - 2025-01-15 — Phase 10: Enterprise Features

### Added

#### Billing & Usage
- Billing engine with usage tracking (`packages/billing-engine/`)
- AI provider cost estimation and tracking per request
- Token usage tracking across providers and models

#### Audit & Compliance
- Comprehensive audit logging system (`packages/audit/`)
- `AuditLog` model with entity, action, metadata, and tenant scoping
- GDPR compliance framework (`packages/compliance/`)
- SOC 2 compliance tooling

#### SSO/SAML
- SSO service implementation (`packages/auth/src/sso/sso-service.ts`)
- SSO type definitions and configuration
- SSO unit tests

#### Campaign Management
- Campaign CRUD with multi-channel support (`packages/campaign/`)
- Campaign execution engine (`packages/campaign-executor/`)
- Outreach job processing with worker metrics (`packages/outreach-integration/`)
- Import job processing for bulk data ingestion
- Campaign statistics with real-time counters (`CampaignStatistics` model)
- Campaign tagging system (`CampaignTag` model)
- Campaign audit logging (`CampaignLog` model)
- Per-business campaign tracking (`CampaignBusiness` model)

#### Delivery Tracking
- Delivery event lifecycle tracking (`packages/delivery-tracking/`)
- `DeliveryEvent` model with status transitions (sent → delivered → read)
- `JobFailure` model with error categorization and resolution tracking
- `DeliveryNotification` alert system
- `WorkerMetric` model for worker health monitoring

#### WhatsApp Integration
- Dedicated WhatsApp channel implementation (`channels/whatsapp/`)
- WhatsApp utility package (`packages/whatsapp/`)
- WhatsApp API routes with template and interactive message support

#### Analytics
- Analytics engine with event tracking (`packages/analytics-engine/`)
- `AnalyticsEvent` model for granular event logging
- `AnalyticsMetric` model for aggregated metrics with time bucketing
- Multi-dimensional analytics (tenant, organization, campaign, conversation)
- Analytics API endpoints for dashboard consumption

#### Administration
- Admin module with system-wide management endpoints (`apps/api/src/modules/admin/`)
- Feature flag system (`FeatureFlag` model) with tenant-level overrides
- Maintenance window management (`MaintenanceWindow` model)
- Notification engine (`packages/notification-engine/`)

#### Knowledge & RAG
- Knowledge engine (`packages/knowledge-engine/`)
- Document processor (`packages/document-processor/`)
- Embeddings generation (`packages/embeddings/`)
- Vector search (`packages/vector-search/`)
- RAG pipeline (`packages/rag-pipeline/`)
- Context engine (`packages/context-engine/`)

#### Conversation Enhancements
- Conversation state management (`ConversationStateManager`)
- Response processing pipeline (`createResponsePipeline`)
- Human handoff support (`Conversation.isHumanHandoff`)
- SLA deadline tracking (`Conversation.slaDeadline`)
- Contact management with conversation history

#### AI Engine Enhancements
- Provider fallback with automatic failover
- Exponential backoff retry strategy
- Usage tracking and cost estimation per request
- Streaming response support

#### Workflow Engine
- Workflow engine (`packages/workflow-engine/`)
- Visual workflow builder support
- Pre-built workflow templates (`templates/`)

#### Plugin System
- Plugin framework (`packages/plugin-framework/`)
- Plugin engine (`packages/plugin-engine/`)
- Tool engine (`packages/tool-engine/`)
- Tool definitions and execution (`packages/tools/`)

#### Dashboard
- Admin dashboard application (`apps/dashboard/`)
- Conversation viewer with real-time updates
- Analytics and reporting views
- Knowledge base management UI
- Workflow builder interface
- Tenant settings management
- Developer tools section

#### SDK & Developer Tools
- JavaScript/TypeScript SDK (`sdk/javascript/`)
- React SDK (`sdk/react/`)
- Next.js SDK (`sdk/nextjs/`)
- Node.js SDK (`sdk/node/`)
- Flutter SDK (`sdk/flutter/`)
- Android SDK (`sdk/android/`)

#### API Enhancements
- WebSocket real-time server (`apps/api/src/websocket/handler.ts`)
- Server-Sent Events for streaming (`events.routes.ts`)
- Swagger/OpenAPI documentation endpoint (`/api/v1/docs`)
- Inbox routes for unified message management
- Widget routes for embeddable widget configuration
- Integration routes for third-party connections
- Webhook routes with event filtering

#### Production Infrastructure
- Docker multi-stage builds with non-root user
- Health check endpoints: `/health`, `/health/ready`, `/health/live`, `/health/metrics`, `/health/prometheus`
- Prometheus-format metrics endpoint
- Kubernetes deployment manifests with Helm chart structure
- Multi-region deployment configuration
- Production Docker Compose with resource limits
- Nginx reverse proxy configuration with WebSocket support

### Changed

- Upgraded Prisma to v6.19.3 with improved performance
- Enhanced Zod validation to v4.4.3 with stricter schema checking
- Updated Express middleware pipeline with metrics and CSRF layers
- Improved error handling with consistent `AppError` response format
- Expanded database schema from initial models to 35+ models
- Enhanced configuration system with Zod validation and nested object support
- Updated rate limiting to tiered system (API, auth, webhook, integration, message, widget)

### Fixed

- Request ID propagation across all middleware layers
- Tenant resolution fallback in development mode
- WebSocket client cleanup on disconnect
- Graceful shutdown handling for API server and WebSocket

### Security

- JWT authentication with access/refresh token pair
- Bcrypt password hashing with configurable salt rounds (default 12)
- RBAC permission system with 55 granular permissions
- Helmet security headers (CSP, X-Frame-Options, HSTS, X-XSS-Protection)
- CSRF protection via Origin/Referer header validation
- Tiered rate limiting: 100 req/min (API), 20 req/15min (auth), 30 req/min (webhooks)
- CORS configuration via environment variables
- Prisma parameterized queries preventing SQL injection
- API key hashing with prefix-based identification
- Request body size limit (1MB)
- Generic error messages in production (no stack trace exposure)
- Multi-tenant data isolation at query, API, and WebSocket levels
