# Development Guide

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

### Setup

```bash
# Clone the repository
git clone https://github.com/anomalyco/conversation-platform.git
cd conversation-platform

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# Run database migrations
pnpm prisma:migrate:dev

# Start development servers
pnpm dev
```

## Project Structure

```
conversation-platform/
├── apps/
│   ├── api/          # Express REST API server
│   ├── admin/        # Admin dashboard (React)
│   └── web/          # Customer-facing web app (React)
├── packages/
│   ├── cache/        # Redis cache abstraction
│   ├── queue/        # BullMQ job queue
│   ├── whatsapp/     # WhatsApp Cloud API client
│   ├── ai-engine/    # OpenAI integration + intent classification
│   ├── webhook-service/ # Webhook delivery system
│   ├── workflow-engine/ # Workflow automation engine
│   ├── analytics/    # Event tracking and metrics
│   ├── messaging/    # Message routing and formatting
│   ├── encryption/   # Field-level encryption utilities
│   ├── database/     # Prisma client and database utilities
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Common utilities
├── tests/
│   ├── e2e/          # Playwright end-to-end tests
│   └── integration/  # Vitest integration tests
├── .github/
│   └── workflows/    # CI/CD pipeline definitions
├── scripts/          # Utility scripts (security, db, etc.)
└── docs/             # Documentation
```

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features (branch from `develop`)
- `fix/*`: Bug fixes (branch from `develop`)
- `release/*`: Release preparation (branch from `develop`)
- `hotfix/*`: Critical fixes (branch from `main`)

### Code Style
- TypeScript strict mode
- ESLint with recommended rules
- Prettier for formatting
- Imports organized (external → internal, absolute → relative)
- No `any` types without justification
- Tests required for new features

### Testing

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode (development)
pnpm test -- --watch
```

### Building

```bash
# Build all packages and apps
pnpm build

# Build specific package
pnpm build --filter=@conversation-platform/whatsapp
```

### Linting

```bash
# Lint all projects
pnpm lint

# Auto-fix issues
pnpm lint -- --fix

# Type checking
pnpm typecheck
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers with hot reload |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | Run ESLint across all projects |
| `pnpm typecheck` | Run TypeScript compilation check |
| `pnpm format` | Format code with Prettier |
| `pnpm prisma:studio` | Open Prisma Studio (DB GUI) |
| `pnpm prisma:migrate:dev` | Create and apply migrations |
| `pnpm prisma:migrate:deploy` | Apply migrations in production |
| `pnpm prisma:generate` | Generate Prisma client |
