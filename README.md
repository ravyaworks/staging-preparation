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

## License

See [LICENSE](LICENSE) for details.
