# Dashboard

Root dashboard application for the Conversation Platform. This Next.js application serves as the unified interface for all user roles in the system.

## Applications

The dashboard contains several route-based applications, each targeting a specific user role and use case:

- **Admin Console** (`/admin`) — System-wide administration for super admins
- **Tenant Dashboard** (`/tenant`) — Tenant-level management for organization admins
- **User Dashboard** (`/user`) — Personal workspace for end users
- **Conversation Interface** (`/conversations`) — Real-time chat and messaging
- **Knowledge Management** (`/knowledge`) — Document and knowledge library management
- **Workflow Builder** (`/workflows`) — Visual drag-and-drop workflow editor
- **Widget Builder** (`/widgets`) — No-code chat widget configuration
- **Developer Portal** (`/developer`) — API keys, documentation, and SDKs
- **Documentation** (`/docs`) — In-app help and reference documentation
- **Playground** (`/playground`) — Interactive API and AI playground
- **Auth** (`/auth`) — Login, registration, and password management
- **Analytics** (`/analytics`) — Cross-cutting analytics and reporting
- **Settings** (`/settings`) — User and application settings
- **Help** (`/help`) — Help center and support resources

## Architecture

The dashboard follows Next.js App Router conventions with route groups for each application. Shared code lives in the following directories:

- `components/` — Reusable UI and domain components
- `lib/` — Client libraries, stores, and utilities
- `hooks/` — Custom React hooks
- `styles/` — Global and shared styles
- `public/` — Static assets

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Library:** `@conversation-platform/ui` (shared component library)
- **Icons:** lucide-react
- **State Management:** Zustand
- **Forms:** react-hook-form + zod
- **Theming:** next-themes
- **Testing:** Vitest + React Testing Library

## Development

```bash
# Install dependencies (from repository root)
pnpm install

# Start the development server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Future Extensions

- Server-side rendering for public pages
- Internationalization (i18n) support
- Real-time collaboration features
- Mobile-responsive layouts
- Offline support with service workers
- Accessibility audit and WCAG 2.1 compliance
