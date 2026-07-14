# Architecture

## Overview

Conversation Platform is a multi-tenant, real-time conversation management system built with a microservices-oriented monolith architecture using Node.js, TypeScript, and a monorepo managed by pnpm and Turborepo.

```
┌─────────────────────────────────────────────────────────┐
│                    Traefik (Reverse Proxy)                │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│   API    │  Worker  │  Admin   │  Grafana │  Prometheus  │
│  :3001   │  :3002   │  :3003   │  :3000   │  :9090       │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│                     Docker Network                        │
├─────────────────────────┬───────────────────────────────┤
│      PostgreSQL 16      │         Redis 7               │
└─────────────────────────┴───────────────────────────────┘
```

## Key Architectural Decisions

### Monorepo Structure
- **packages/**: Shared libraries (cache, queue, whatsapp, ai-engine, etc.)
- **apps/api/**: Express REST API server
- **apps/admin/**: Admin dashboard (separate from main API)
- **apps/web/**: Customer-facing web app

### Multi-tenancy
- All tables are scoped by `tenantId`
- Row-Level Security (RLS) in PostgreSQL
- Isolated configuration per tenant

### Queue-driven Processing
- BullMQ backed by Redis for job queues
- Separate worker processes for background jobs
- Automatic retry with exponential backoff

### Real-time Communication
- WebSocket connections via Socket.io
- Server-Sent Events (SSE) for status updates
- Webhook delivery system for external integrations

## Core Patterns

### Repository Pattern
Each domain module uses a repository layer that abstracts database access, making the service layer testable without database dependencies.

### Middleware Pipeline
Requests flow through: Auth → Tenant Resolution → Rate Limiting → Validation → Controller → Service → Repository → Database

### Event-driven
Domain events are published after state changes and consumed by:
- Notification service
- Analytics service
- Webhook dispatcher
- Audit logging

## Data Flow

### Message Processing Pipeline
1. WhatsApp sends webhook → API receives
2. Message validated and stored in database
3. Event published to queue
4. Worker picks up event
5. Message processed through AI engine
6. Workflow engine evaluates rules
7. Response generated and sent back via WhatsApp API
8. Analytics event recorded
