# Development Guide

## Local Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | `nvm install 20` |
| pnpm | ≥ 9 | `corepack enable && corepack prepare pnpm@9.1.0 --activate` |
| Docker | ≥ 24 | [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | ≥ 2 | Included with Docker Desktop |

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd conversation-platform

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed initial data (permissions, roles, admin user)
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Configuration

Key environment variables (see `.env.example` for full list):

```bash
# Required
DATABASE_URL=postgresql://cp_user:cp_password@localhost:5432/conversation_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=<at-least-32-chars>

# Optional (at least one AI provider)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Development
NODE_ENV=development
LOG_LEVEL=debug
LOG_PRETTY=true
```

### Verify Setup

```bash
# Check API is running
curl http://localhost:3000/api/v1/health

# Check database
pnpm db:studio

# Run tests
pnpm test
```

## Development Workflow

### Monorepo Structure

```
conversation-platform/
├── apps/
│   ├── api/              ← Main API server (Express)
│   ├── dashboard/        ← Admin dashboard (Next.js)
│   ├── playground/       ← API playground
│   └── website-widget/   ← Embeddable widget
├── packages/
│   ├── ai-engine/        ← AI provider orchestration
│   ├── auth/             ← Authentication & JWT
│   ├── cache/            ← Redis + in-memory cache
│   ├── channel-core/     ← Channel abstraction layer
│   ├── config/           ← Configuration management
│   ├── conversation-engine/ ← Conversation logic
│   ├── database/         ← Prisma schema & client
│   ├── logger/           ← Pino structured logging
│   ├── prompt-engine/    ← Prompt templating
│   ├── queue/            ← Job queue abstraction
│   ├── shared/           ← Shared utilities
│   ├── workflow-engine/  ← Workflow automation
│   └── ... (40+ packages)
├── channels/             ← Channel implementations
│   ├── whatsapp/
│   ├── telegram/
│   ├── slack/
│   ├── discord/
│   ├── email/
│   ├── sms/
│   └── ...
├── providers/            ← AI provider implementations
│   ├── ai/openai/
│   ├── ai/anthropic/
│   └── ...
├── services/             ← Microservice implementations
└── sdk/                  ← Client SDKs
```

### Common Commands

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm build                  # Build all packages
pnpm build:api              # Build only API
pnpm build:dashboard        # Build only dashboard

# Testing
pnpm test                   # Run all tests
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests only

# Code Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Auto-fix lint issues
pnpm typecheck              # Type-check all packages
pnpm format                 # Format with Prettier
pnpm format:check           # Check formatting

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Create + apply migration (dev)
pnpm db:deploy              # Apply pending migrations (prod)
pnpm db:seed                # Seed initial data
pnpm db:studio              # Open Prisma Studio
pnpm db:reset               # Reset database (dev only)

# Docker
pnpm docker:dev             # Start dev containers
pnpm docker:down            # Stop containers
pnpm docker:logs            # Follow container logs

# Cleanup
pnpm clean                  # Remove dist and node_modules
pnpm reset                  # Clean + reinstall
```

### Working on a Package

```bash
# Navigate to package
cd packages/ai-engine

# Run package-specific tests
pnpm test

# Build package
pnpm build

# Type-check package
pnpm typecheck

# The package is referenced as workspace:* in dependent packages
# Changes are automatically picked up by Turborepo
```

### Turborepo Caching

Turborepo caches build outputs. To force a rebuild:

```bash
# Clean Turbo cache
rm -rf .turbo

# Or use turbo's --force flag
pnpm turbo build --force

# Or clean everything
pnpm clean
```

## Testing

### Test Framework

The project uses [Vitest](https://vitest.dev/) for testing:

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm vitest run --coverage

# Run in watch mode (during development)
pnpm vitest watch

# Run specific test file
pnpm vitest run packages/ai-engine/src/__tests__/ai-engine.test.ts
```

### Unit Tests

Unit tests validate individual functions and classes in isolation:

```
packages/*/src/__tests__/
├── ai-engine.test.ts
├── channel-core.test.ts
├── jwt.test.ts
├── password.test.ts
├── queue.test.ts
└── ...
```

**Example:**

```typescript
// packages/ai-engine/src/__tests__/ai-engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createAIEngine } from '../engine';

describe('AIEngine', () => {
  it('should send chat request to provider', async () => {
    const mockProvider = { chat: vi.fn().mockResolvedValue({...}) };
    const engine = createAIEngine({
      getProvider: () => mockProvider,
      config: { defaultProvider: 'openai', defaultModel: 'gpt-4' },
      logger: mockLogger,
    });

    const result = await engine.chat({ messages: [...] });
    expect(mockProvider.chat).toHaveBeenCalled();
    expect(result.content).toBeDefined();
  });
});
```

### Integration Tests

Integration tests validate API endpoints with actual HTTP requests:

```
apps/api/src/__tests__/
└── *.test.ts
```

**Example:**

```typescript
import request from 'supertest';
import { createApp } from '../app';

describe('POST /api/v1/auth/login', () => {
  it('should return tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@conversation-platform.com', password: 'Admin123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

For dashboard and widget testing:

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run in headed mode
npx playwright test --headed
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## Code Style and Linting

### ESLint Configuration

```javascript
// .eslintrc.cjs
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': 'warn',
  },
};
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Code Conventions

1. **Use `const` by default** — never use `var`
2. **Prefer `async/await`** over raw promises
3. **Use named exports** — avoid default exports
4. **Type everything** — explicit return types on exported functions
5. **No `any` types** — use `unknown` and type narrowing
6. **Functional patterns** — prefer pure functions over classes
7. **Error handling** — always catch errors, use `AppError` for business errors
8. **Log at boundaries** — log at API entry/exit, not in business logic

## Database Changes (Prisma Migration Workflow)

### Adding a New Model

1. Add the model to `packages/database/prisma/schema.prisma`:

```prisma
model Widget {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @db.VarChar(255)
  tenantId  String   @db.Uuid
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@map("widgets")
}
```

2. Add the relation to the parent model (`Tenant`):

```prisma
model Tenant {
  // ... existing fields
  widgets Widget[]
}
```

3. Create the migration:

```bash
pnpm db:migrate
# Enter migration name: add_widget_model
```

4. Generate the Prisma client:

```bash
pnpm db:generate
```

5. Use in your code:

```typescript
import { getPrismaClient } from '@conversation-platform/database';

const prisma = getPrismaClient();
const widget = await prisma.widget.create({
  data: { name: 'Support Widget', tenantId: '...' },
});
```

### Modifying an Existing Model

1. Edit the schema in `packages/database/prisma/schema.prisma`
2. Run `pnpm db:migrate` — Prisma detects the diff
3. Enter a descriptive migration name
4. Review the generated SQL in the migration file
5. Test the migration on a copy of production data

### Migration Naming Convention

Use descriptive kebab-case names:

- `add_widget_model`
- `add_index_to_messages_conversation_id`
- `add_campaign_statistics_table`
- `update_user_email_unique_constraint`

## Adding a New Channel

### 1. Create Channel Package

```bash
mkdir -p channels/mychannel/src
```

### 2. Create Channel Implementation

```typescript
// channels/mychannel/src/index.ts
import type {
  ChannelInterface,
  ChannelConfig,
  ChannelAuthConfig,
  ChannelCapabilitySet,
  ChannelHealthStatus,
  ChannelEventHandler,
  OutgoingMessage,
  IncomingMessage,
} from '@conversation-platform/channel-core';

export function createMyChannel(): ChannelInterface {
  return {
    type: 'custom',
    displayName: 'My Channel',
    version: '1.0.0',

    async initialize(config: ChannelConfig) { /* ... */ },
    async connect(auth: ChannelAuthConfig) { /* ... */ },
    async disconnect() { /* ... */ },

    async healthCheck(): Promise<ChannelHealthStatus> {
      return { healthy: true, status: 'connected', latencyMs: 0, lastCheckedAt: new Date().toISOString() };
    },

    async sendMessage(message: OutgoingMessage): Promise<string> {
      // Send message to external platform
      return 'msg-id-123';
    },

    async sendTypingIndicator(conversationId: string, isTyping: boolean, tenantId: string) { /* ... */ },
    async markAsRead(messageId: string, conversationId: string, tenantId: string) { /* ... */ },

    getCapabilities(): ChannelCapabilitySet {
      return {
        incoming: ['text', 'image'],
        outgoing: ['text', 'image'],
        supportsReplies: true,
        supportsThreads: false,
        supportsRichText: false,
      };
    },

    getConfig(): ChannelConfig { return this._config; },
    async updateConfig(config: Partial<ChannelConfig>) { /* ... */ },
    onEvent(handler: ChannelEventHandler) { this._handlers.push(handler); },
    validateConfig(config: ChannelConfig): string[] { return []; },

    async processIncoming(rawPayload: Record<string, unknown>, context: any): Promise<IncomingMessage[]> {
      // Normalize incoming payload to IncomingMessage format
      return [{ /* ... */ }];
    },
  };
}
```

### 3. Add Package Configuration

```json
// channels/mychannel/package.json
{
  "name": "@conversation-platform/channel-mychannel",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@conversation-platform/channel-core": "workspace:*",
    "@conversation-platform/types": "workspace:*"
  }
}
```

### 4. Register in Channel Registry

```typescript
// In the channel service or API startup
import { createMyChannel } from '@conversation-platform/channel-mychannel';
channelRegistry.register('custom', createMyChannel());
```

### 5. Add Tests

```typescript
// channels/mychannel/src/__tests__/mychannel.test.ts
import { describe, it, expect } from 'vitest';
import { createMyChannel } from '../index';

describe('MyChannel', () => {
  it('should send message', async () => {
    const channel = createMyChannel();
    await channel.initialize({ enabled: true });
    const msgId = await channel.sendMessage({ /* ... */ });
    expect(msgId).toBeDefined();
  });
});
```

## Adding a New AI Provider

### 1. Create Provider Package

```bash
mkdir -p providers/ai/myprovider/src
```

### 2. Implement AIProvider Interface

```typescript
// providers/ai/myprovider/src/index.ts
import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderConfig,
} from '@conversation-platform/provider-framework';

export function createMyProvider(config: ProviderConfig): AIProvider {
  return {
    name: 'myprovider',

    async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
      // Call your AI API
      const response = await fetch('https://api.myprovider.com/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
        }),
      });

      const data = await response.json();

      return {
        id: data.id,
        model: data.model,
        provider: 'myprovider',
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: data.choices[0].finish_reason,
        latency: 0,
      };
    },

    async chatStream(request: ChatCompletionRequest, onChunk) {
      // Implement streaming
      const response = await fetch(/* ... */);
      // Parse SSE stream and call onChunk for each chunk
    },
  };
}
```

### 3. Register in Provider Registry

```typescript
// In AI engine setup
import { createMyProvider } from '@conversation-platform/provider-myprovider';
providerRegistry.register('myprovider', createMyProvider({ apiKey: process.env.MYPROVIDER_API_KEY }));
```

## Building and Publishing a Package

### Build

```bash
# Build a specific package
cd packages/my-package
pnpm build

# Or via Turbo (builds dependencies first)
pnpm turbo build --filter=@conversation-platform/my-package
```

### Publish (Internal Packages)

Internal packages use workspace protocol (`workspace:*`) and are not published to npm. They are consumed directly by other packages in the monorepo.

### Publish (External Packages, Future)

```bash
# If publishing to npm
cd packages/my-package

# Ensure name is scoped
# "name": "@conversation-platform/my-package"

# Build
pnpm build

# Publish
pnpm publish --access public

# Or with Turbo
pnpm turbo publish --filter=@conversation-platform/my-package
```

### Package Checklist

Before publishing a package:

- [ ] `package.json` has correct `name`, `version`, `main`, `types`
- [ ] `build` script produces `dist/` with `.js` and `.d.ts` files
- [ ] All dependencies listed in `dependencies` (not `devDependencies`)
- [ ] `README.md` with usage documentation
- [ ] Tests passing
- [ ] Type-check passing
- [ ] Lint passing
- [ ] No sensitive data in source code
