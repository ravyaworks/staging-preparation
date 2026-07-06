# Packages

Shared libraries, engines, and utilities for the Conversation Platform.

## Categories

### Core
- `auth/` — Authentication and authorization logic
- `shared/` — Shared utilities and helpers
- `config/` — Configuration management
- `logger/` — Logging infrastructure
- `types/` — Shared TypeScript types

### Data Layer
- `database/` — Database client and ORM setup
- `cache/` — Caching abstraction (Redis)
- `queue/` — Message queue abstraction
- `event-bus/` — Event-driven architecture bus

### Engines
- `ai-engine/` — AI provider abstraction and orchestration
- `conversation-engine/` — Conversation routing and state management
- `workflow-engine/` — Workflow execution engine
- `knowledge-engine/` — Knowledge base management
- `tool-engine/` — Tool/function calling abstraction
- `memory-engine/` — Conversation memory management
- `prompt-engine/` — Prompt template management
- `retrieval-engine/` — RAG retrieval orchestration
- `analytics-engine/` — Analytics data processing
- `notification-engine/` — Notification dispatching

### Platform
- `channel-core/` — Channel integration base classes
- `tenant-engine/` — Multi-tenant isolation and management
- `plugin-engine/` — Plugin system for extensibility
- `billing-engine/` — Usage tracking and billing
- `monitoring/` — Observability (metrics, tracing, logging)
- `sdk/` — Client SDK core
- `ui/` — Shared UI components
- `testing/` — Test utilities and helpers
