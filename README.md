# Conversation Platform

A production-grade multi-tenant AI Conversation Platform for building intelligent conversational experiences across channels.

## Overview

This platform provides a complete infrastructure for creating, managing, and scaling AI-powered conversations across multiple channels including web, WhatsApp, Instagram, Messenger, Telegram, email, SMS, Slack, Discord, Teams, and custom APIs.

## Architecture

The platform follows a microservices architecture organized as a monorepo with the following layers:

- **Apps** — Application entry points (API, Dashboard, Widgets)
- **Packages** — Shared libraries and engines
- **Services** — Independent microservices
- **Channels** — Communication channel integrations
- **Providers** — Third-party service integrations

## Getting Started

```bash
pnpm install
pnpm dev
```

## Project Structure

See `docs/architecture/` for detailed architecture documentation.

## Phase 5 - Dashboard & User Experience

The dashboard layer provides role-specific interfaces for the entire platform:

- **Admin Console** (`apps/dashboard/app/admin/`) — System administration, tenant and user management, roles, audit logging, platform analytics
- **Tenant Dashboard** (`apps/dashboard/app/tenant/`) — Knowledge management, conversations, workflow builder, team management, tenant analytics
- **User Dashboard** (`apps/dashboard/app/user/`) — Personal conversations, notifications, profile and security settings
- **Conversation Interface** (`apps/dashboard/app/conversations/`) — Real-time chat UI with streaming, markdown, and multi-channel support
- **Knowledge Management** (`apps/dashboard/app/knowledge/`) — Document upload, knowledge libraries, categories, and RAG-powered search
- **Workflow Builder** (`apps/dashboard/app/workflows/`) — Visual drag-and-drop workflow editor with triggers, conditions, and actions
- **Widget Builder** (`apps/dashboard/app/widgets/`) — No-code chat widget configuration with theming, preview, and embed code generation
- **Developer Portal** (`apps/dashboard/app/developer/`) — API key management, endpoint reference, code examples, and SDK documentation
- **Documentation Site** (`apps/dashboard/app/docs/`) — In-app getting started guides, API docs, and architecture overview
- **Integrations** (`apps/dashboard/app/tenant/integrations/`) — Channel management, API keys, webhooks, usage stats, and error logs

Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Zustand, and `@conversation-platform/ui`. See `apps/dashboard/README.md` for detailed setup instructions.

## Phase 6 - Channels & Integrations

An omnichannel communication layer connecting the AI engine to 12 messaging platforms:

- **Channel Framework** (`packages/channel-core/`) — ChannelInterface, ChannelRegistry, ChannelManager with connect/disconnect/reconnect/health checks, capability and version registries, message factories
- **12 Channel Adapters** (`channels/*/`) — WhatsApp (Meta Cloud API), Instagram (Graph API), Messenger (Facebook Platform), Telegram (Bot API), Slack (Events API), Discord (Interactions), Teams (Microsoft identity + Adaptive Cards), Email (SendGrid/SES/SMTP), SMS (Twilio/Vonage), Generic REST API, Custom (bring-your-own parser), Website (session-based widget)
- **Webhook Service** (`services/webhook-service/`) — WebhookRegistry, WebhookDispatcher with exponential backoff retry, WebhookSecurity (SHA256/512 HMAC signature verification), WebhookMonitor (delivery stats, failures)
- **Channel Service** (`services/channel-service/`) — ChannelOrchestrator coordinating registry, config loader, and event bus; MessageRouter for cross-channel routing
- **Integration Service** (`services/integration-service/`) — IntegrationManager (CRUD, connection logging), ApiKeyManager (SHA256 key hashing, create/validate/revoke), UsageTracker (daily aggregation)
- **Plugin Engine** (`packages/plugin-engine/`) — Sandboxed plugin execution with tool, workflow, and hook registration; timeout enforcement and API whitelist
- **SDK Packages** (`packages/sdk/`, `sdk/*/`) — Core TypeScript SDK, JavaScript SDK, React SDK (hooks + provider), Next.js SDK (server helpers), Node.js SDK (streaming support), Flutter and Android stubs
- **API Routes** (`apps/api/src/routes/`) — /api/v1/channels, /api/v1/webhooks, /api/v1/integrations, /api/v1/messages with API key auth middleware
- **Docs Site** (`apps/documentation/`) — Standalone Next.js documentation portal with API reference, SDK docs, and integration guides

All channel adapters convert third-party message formats to a common internal format via `ChannelInterface`, remaining independent from the Conversation Engine.

## License

See [LICENSE](LICENSE) for details.
