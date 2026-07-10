# @conversation-platform/sdk-nextjs

Next.js SDK for the Conversation Platform. Provides server-side helpers for Next.js App Router and re-exports React hooks for client components.

## Installation

```bash
pnpm add @conversation-platform/sdk-nextjs
```

## Usage

### Server Components (App Router)

```ts
import { fetchConversations, fetchMessages, getServerClient } from '@conversation-platform/sdk-nextjs';

const config = {
  baseUrl: process.env.CONVERSATION_API_URL!,
  apiKey: process.env.CONVERSATION_API_KEY!,
};

// In a Server Component
export default async function ConversationsPage() {
  const { data: conversations } = await fetchConversations(config, { status: 'active' });

  return <pre>{JSON.stringify(conversations, null, 2)}</pre>;
}
```

### Cached Client

```ts
const client = getServerClient(config);
// client is cached across requests using React's cache()
```

### Client Components

```tsx
'use client';
import { ConversationProvider } from '@conversation-platform/sdk-nextjs';
import { useConversations, useMessages } from '@conversation-platform/sdk-react';

// Use ConversationProvider and hooks from sdk-react
```

## Available Server Functions

| Function | Description |
|---|---|
| `getServerClient(config)` | Creates a cached ConversationClient |
| `fetchConversations(config, params?)` | Fetch paginated conversations |
| `fetchConversation(config, id)` | Get a single conversation |
| `createConversation(config, params)` | Create a conversation |
| `fetchMessages(config, conversationId, params?)` | Fetch messages |
| `sendMessage(config, conversationId, content)` | Send a message |
| `fetchChannels(config)` | List channels |
| `fetchWebhooks(config)` | List webhooks |
| `createWebhook(config, params)` | Create a webhook |
| `deleteWebhook(config, id)` | Delete a webhook |
| `searchKnowledge(config, query)` | Search knowledge base |
| `fetchDocuments(config, libraryId)` | List documents |
| `fetchWorkflows(config)` | List workflows |
| `executeWorkflow(config, id, input)` | Execute a workflow |
| `queryAnalytics(config, params)` | Query analytics |
| `getTokenFromCookies(cookieName?)` | Read token from request cookies |
