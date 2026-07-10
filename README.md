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

Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Zustand, and `@conversation-platform/ui`. See `apps/dashboard/README.md` for detailed setup instructions.

## License

See [LICENSE](LICENSE) for details.
