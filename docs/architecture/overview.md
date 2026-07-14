# Architecture Overview

## System Architecture

The Conversation Platform is a multi-tenant, event-driven AI conversation system built as a TypeScript monorepo. It enables businesses to manage customer conversations across multiple channels (WhatsApp, Telegram, Slack, email, SMS, web, etc.) with integrated AI capabilities.

### High-Level Component Diagram

```
                         ┌─────────────────────────────────────────┐
                         │              Clients                     │
                         │  Dashboard · Widget · SDK · Webhooks     │
                         └────────────────┬────────────────────────┘
                                          │ HTTPS / WSS
                         ┌────────────────▼────────────────────────┐
                         │           Load Balancer                  │
                         │      (Nginx / Cloud LB / Ingress)       │
                         └────────────────┬────────────────────────┘
                                          │
                         ┌────────────────▼────────────────────────┐
                         │        API Gateway (Express)            │
                         │  ┌──────────────────────────────────┐   │
                         │  │  Middleware Pipeline              │   │
                         │  │  Request ID → Metrics → Rate     │   │
                         │  │  Limit → Auth → Tenant Resolve   │   │
                         │  │  → CSRF → CORS → Helmet          │   │
                         │  └──────────────────────────────────┘   │
                         │                                         │
                         │  Routes:                                │
                         │  /auth · /tenants · /channels           │
                         │  /messages · /campaigns · /analytics    │
                         │  /knowledge · /workflows · /webhooks    │
                         │  /admin · /health · /metrics            │
                         └───────┬──────────┬──────────┬──────────┘
                                 │          │          │
              ┌──────────────────▼──┐  ┌────▼────┐  ┌──▼──────────────────┐
              │    PostgreSQL 16    │  │ Redis 7 │  │    WebSocket Server  │
              │    (Primary DB)     │  │ (Cache) │  │    (ws on /ws)       │
              │                     │  │         │  │    Real-time events  │
              │  Tenants · Users    │  │ Sessions│  │    Tenant-scoped     │
              │  Conversations      │  │ Cache   │  │    broadcasts        │
              │  Messages · Campaigns│  │ Rate    │  └─────────────────────┘
              │  Analytics · Audit  │  │ Limits  │
              │  Knowledge · Jobs   │  │ Pub/Sub │
              └─────────────────────┘  └─────────┘
                                 │
              ┌──────────────────▼──────────────────────────────────┐
              │              Engine Layer (Packages)                 │
              │                                                     │
              │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
              │  │AI Engine │ │Conversa- │ │ Workflow Engine   │   │
              │  │          │ │tion Eng. │ │                   │   │
              │  │ Provider │ │ Pipeline │ │ Visual builder    │   │
              │  │ fallback │ │ State    │ │ Custom actions    │   │
              │  │ Retry    │ │ Memory   │ │ Templates         │   │
              │  │ Tracking │ │ Context  │ └───────────────────┘   │
              │  └──────────┘ └──────────┘                         │
              │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
              │  │Knowledge │ │Prompt    │ │ Memory Engine     │   │
              │  │ Engine   │ │ Engine   │ │                   │   │
              │  │ RAG      │ │ Registry │ │ Conversation      │   │
              │  │ Vector   │ │ Templates│ │ history & state   │   │
              │  │ Search   │ │ Compose  │ │                   │   │
              │  └──────────┘ └──────────┘ └───────────────────┘   │
              │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
              │  │Analytics │ │Campaign  │ │ Notification      │   │
              │  │ Engine   │ │ Executor │ │ Engine            │   │
              │  └──────────┘ └──────────┘ └───────────────────┘   │
              └─────────────────────────────────────────────────────┘
                                 │
              ┌──────────────────▼──────────────────────────────────┐
              │          Channel Abstraction Layer                   │
              │          (packages/channel-core)                     │
              │                                                     │
              │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
              │  │Web   │ │What- │ │Tele- │ │Slack │ │Email │    │
              │  │Widget│ │sApp  │ │gram  │ │      │ │      │    │
              │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
              │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
              │  │Disc- │ │Teams │ │SMS   │ │Insta-│ │Messe-│    │
              │  │ord   │ │      │ │      │ │gram  │ │nger  │    │
              │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
              │  ┌──────┐ ┌──────┐                                 │
              │  │Custom│ │ API  │                                 │
              │  └──────┘ └──────┘                                 │
              └─────────────────────────────────────────────────────┘
                                 │
              ┌──────────────────▼──────────────────────────────────┐
              │            AI Provider Layer                         │
              │          (providers/ai/*)                            │
              │                                                     │
              │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │
              │  │ OpenAI │ │Anthropic │ │Gemini  │ │ Mistral  │  │
              │  └────────┘ └──────────┘ └────────┘ └──────────┘  │
              │  ┌────────┐ ┌──────────┐ ┌────────┐               │
              │  │DeepSkt │ │OpenRouter│ │ Ollama │               │
              │  └────────┘ └──────────┘ └────────┘               │
              └─────────────────────────────────────────────────────┘
```

### Data Flow: Inbound Message

```
Channel (e.g. WhatsApp webhook)
  → Express route handler (/api/v1/channels/whatsapp)
    → Channel adapter processes raw payload (processIncoming)
      → IncomingMessage normalized via channel-core types
        → Tenant resolved via x-tenant-id header
          → ConversationEngine.sendMessage()
            → MemoryManager.addEntry() (store user message)
              → PromptRegistry builds prompt with context
                → ContextManager assembles context window
                  → AIEngine.chat() with provider fallback
                    → ResponsePipeline processes AI output
                      → OutgoingMessage sent via ChannelInterface.sendMessage()
                        → Channel adapter delivers to platform
                          → WebSocket broadcastToTenant() for dashboard updates
                            → AnalyticsEngine.trackEvent() logs the interaction
```

### Data Flow: Outbound Campaign

```
Campaign created via API or Dashboard
  → CampaignExecutor picks up scheduled campaigns
    → ImportJob records validated and processed
      → OutreachJob created per contact
        → QueueService dispatches jobs
          → Worker picks job, locks it (advisory lock)
            → WhatsApp/SMS/Email adapter.sendMessage()
              → DeliveryEvent recorded (sent → delivered → read)
                → CampaignStatistics updated in real-time
                  → AnalyticsEngine aggregates metrics
```

## Key Design Decisions

### 1. Monorepo with Turborepo

The codebase uses a pnpm workspace monorepo managed by Turborepo. This provides:
- **Shared types and utilities** across all packages via `@conversation-platform/*` scope
- **Incremental builds** with Turborepo's caching and dependency graph
- **Consistent tooling** (TypeScript, ESLint, Prettier, Vitest) enforced at root level
- **Independent deployability** of `apps/api` and `apps/dashboard`

### 2. Multi-Tenant Isolation

Every data access is scoped to a tenant. The isolation model works at three levels:

- **Row-level isolation**: Every table with `tenantId` uses it as a primary filter. The `tenantResolve` middleware extracts the tenant from the `x-tenant-id` header and attaches it to the request context.
- **Query-level isolation**: Repository functions always include `where: { tenantId }` in queries. Prisma's query engine enforces this at the ORM level.
- **API-level isolation**: Rate limits, caches, and WebSocket broadcasts are all tenant-scoped.

### 3. Channel Abstraction Layer

The `ChannelInterface` contract (defined in `packages/channel-core/src/types.ts`) provides a uniform abstraction over all messaging platforms:

- Each channel implements: `initialize`, `connect`, `disconnect`, `healthCheck`, `sendMessage`, `processIncoming`, `getCapabilities`
- Channels are registered per-tenant via `ChannelConnection` records in the database
- Capabilities declare supported message types (text, image, buttons, lists, reactions, etc.)
- The registry pattern (`ChannelRegistry`) maps channel types to implementations at runtime

### 4. AI Engine with Provider Fallback

The AI engine (`packages/ai-engine`) implements a resilient pattern:

- **Provider abstraction**: All providers implement `AIProvider` from `provider-framework`
- **Retry with backoff**: Exponential retry strategy with configurable max retries and delay
- **Automatic fallback**: If the primary provider fails, requests fall back to a configured secondary provider
- **Usage tracking**: Every request tracks token usage and estimated cost per provider/model
- **Streaming support**: Both synchronous and streaming completions are supported

### 5. Event-Driven Architecture

The platform uses an event-driven approach:

- **Event Bus** (`packages/event-bus`): In-process pub/sub for decoupled communication between engines
- **Queue Service** (`packages/queue`): Job queue with priority levels (low, normal, high, critical), retry logic, and configurable max attempts
- **WebSocket broadcasts**: Real-time event delivery to connected dashboard clients, scoped per tenant

### 6. Database-First with Prisma

All database interactions go through Prisma Client:

- Schema-driven migrations ensure reproducible database changes
- Generated client provides type-safe queries
- Connection pooling managed at the Prisma client level
- Advisory locks used for job processing to prevent duplicate work

## Technology Stack Rationale

| Technology | Purpose | Rationale |
|---|---|---|
| **Node.js 20 + TypeScript** | Runtime | Type safety, async I/O, ecosystem maturity |
| **Express** | HTTP framework | Mature, well-understood, extensive middleware ecosystem |
| **Prisma 6** | ORM / Migration | Type-safe queries, excellent migration system, PostgreSQL-native |
| **PostgreSQL 16** | Primary database | ACID compliance, JSON support, full-text search, mature tooling |
| **Redis 7** | Cache / Pub-Sub / Rate Limiting | In-memory performance, TTL support, pub/sub for real-time |
| **WebSocket (ws)** | Real-time communication | Native bidirectional communication for dashboard updates |
| **pnpm + Turbo** | Build system | Strict dependency resolution, efficient caching, monorepo support |
| **Docker** | Containerization | Reproducible builds, consistent environments |
| **Zod** | Schema validation | Runtime type checking, composable schemas, TypeScript integration |
| **Pino** | Structured logging | High-performance JSON logging, child logger support |
| **Helmet** | Security headers | Comprehensive HTTP security header management |
| **bcryptjs** | Password hashing | Industry-standard adaptive hashing |
| **jsonwebtoken** | JWT management | Standard JWT creation and verification |

## Multi-Tenant Architecture

### Tenant Model

```
Tenant
├── Users (scoped to tenant)
├── Organizations (sub-groups within tenant)
├── Roles (custom + system roles)
├── Channel Connections (per-channel config)
├── Integrations (third-party connections)
├── Campaigns (outreach campaigns)
├── Conversations → Messages
├── Contacts (customer records)
├── Knowledge Base entries
├── Webhooks (event subscriptions)
├── API Keys (tenant-scoped)
├── Audit Logs
├── Feature Flags
└── Settings
```

### Tenant Resolution

1. Extract `x-tenant-id` header from incoming request
2. Validate tenant exists and is active (future: cache in Redis)
3. Attach `tenantId` to request context
4. All downstream queries filter by this `tenantId`

### Data Isolation Guarantees

- No cross-tenant data leakage: every query includes `tenantId` filter
- WebSocket broadcasts are tenant-scoped via `broadcastToTenant()`
- Cache keys are namespaced per tenant
- Rate limits are enforced per user/IP (with tenant-scoped overrides available)

## Channel Abstraction Layer

### Supported Channels

| Channel | Status | Capabilities |
|---|---|---|
| Website Widget | Active | text, image, file, typing_indicator |
| WhatsApp | Active | text, image, document, audio, template, interactive |
| Telegram | Active | text, image, document, audio, video, buttons, inline_keyboard |
| Slack | Active | text, rich_text, blocks, threads, reactions |
| Discord | Active | text, embeds, files, threads |
| Email | Active | text, html, attachments |
| SMS | Active | text, MMS |
| Instagram | Active | text, image, stories |
| Messenger | Active | text, image, buttons, quick_replies |
| Teams | Active | text, adaptive_cards, attachments |
| API | Active | full message types |
| Custom | Active | configurable capabilities |

### Channel Registration

```typescript
// Channels implement ChannelInterface
interface ChannelInterface {
  readonly type: ChannelType;
  readonly displayName: string;
  initialize(config: ChannelConfig): Promise<void>;
  connect(auth: ChannelAuthConfig): Promise<void>;
  sendMessage(message: OutgoingMessage): Promise<string>;
  processIncoming(raw: Record<string, unknown>, ctx: RequestContext): Promise<IncomingMessage[]>;
  healthCheck(): Promise<ChannelHealthStatus>;
  getCapabilities(): ChannelCapabilitySet;
  onEvent(handler: ChannelEventHandler): void;
}
```

### Message Normalization

All incoming messages from any channel are normalized to the `IncomingMessage` type:
- `content` (text, image URLs, document URLs)
- `attachments` (files with metadata)
- `metadata` (message ID, channel type, timestamps, source)
- `user` context (ID, name, email, phone, locale)
- `conversation` context (ID, channel type)

This normalization means the conversation engine, AI engine, and analytics engine never need to know which channel a message originated from.

## AI Engine Integration Pattern

### Provider Registry

```
provider-framework (AIProvider interface)
├── providers/ai/openai → OpenAIProvider
├── providers/ai/anthropic → AnthropicProvider
├── providers/ai/gemini → GeminiProvider
├── providers/ai/mistral → MistralProvider
├── providers/ai/deepseek → DeepseekProvider
├── providers/ai/openrouter → OpenRouterProvider
└── providers/ai/ollama → OllamaProvider
```

### Request Flow

1. **ConversationEngine** receives a user message
2. **PromptEngine** composes the system prompt from templates + context
3. **ContextEngine** assembles relevant context (knowledge base, conversation history)
4. **MemoryEngine** provides conversation history within the context window
5. **AIEngine** sends the request to the configured provider
6. **ProviderFramework** normalizes the response to a common format
7. **UsageTracker** records token counts and cost estimates
8. Response is stored in the conversation and sent back through the channel

### Fallback Strategy

```
Primary Provider (e.g., OpenAI)
  ↓ fails with retryable error
Retry with exponential backoff (1s, 2s, 4s)
  ↓ all retries exhausted
Fallback Provider (e.g., Anthropic)
  ↓ fails
AIEngineError('ALL_PROVIDERS_FAILED')
```

## Package Dependency Graph

```
apps/api
├── @conversation-platform/config
├── @conversation-platform/database
├── @conversation-platform/logger
├── @conversation-platform/auth
├── @conversation-platform/cache
├── @conversation-platform/audit
├── @conversation-platform/campaign
├── @conversation-platform/knowledge-engine
├── @conversation-platform/notification-engine
├── @conversation-platform/plugin-framework
├── @conversation-platform/tool-engine
├── @conversation-platform/tools
├── @conversation-platform/workflow-engine
├── @conversation-platform/analytics-engine
└── @conversation-platform/shared

packages/conversation-engine
├── @conversation-platform/ai-engine
├── @conversation-platform/prompt-engine
├── @conversation-platform/memory-engine
└── @conversation-platform/context-engine

packages/ai-engine
├── @conversation-platform/provider-framework
└── @conversation-platform/logger

packages/channel-core
└── @conversation-platform/types
```

## Scaling Considerations

### Horizontal Scaling

- The API server is stateless (sessions in PostgreSQL, cache in Redis)
- Multiple API replicas behind a load balancer for throughput
- WebSocket connections are sticky-routed or shared via Redis pub/sub (future)
- Queue workers can be scaled independently

### Vertical Scaling

- PostgreSQL connection pooling via Prisma (configurable `maxConnections`)
- Redis handles high-throughput caching and rate limiting
- In-memory queue for development; swap to Redis/BullMQ for production at scale

### Database Scaling

- Read replicas for analytics-heavy queries (future)
- Partitioning for `messages` and `analytics_events` tables by time
- Connection pooling via PgBouncer for high-concurrency scenarios
