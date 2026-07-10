# @conversation-platform/sdk-js

JavaScript SDK for the Conversation Platform. Provides a JavaScript-friendly wrapper around the core SDK with a namespaced API surface.

## Installation

```bash
pnpm add @conversation-platform/sdk-js
```

## Usage

```ts
import { ConversationClient } from '@conversation-platform/sdk-js';

const client = new ConversationClient('https://api.example.com', 'your-api-key');

// Conversations
const { data: conversations } = await client.conversations.list({ status: 'active' });
const conversation = await client.conversations.get('conv-123');
const newConversation = await client.conversations.create({ channelId: 'ch-1' });

// Messages
const { data: messages } = await client.messages.list('conv-123');
const sent = await client.messages.send('conv-123', 'Hello world');

// Channels
const channels = await client.channels.list();
const channel = await client.channels.connect('slack', { token: 'xoxb-...' });
await client.channels.disconnect('slack');

// Webhooks
const webhooks = await client.webhooks.list();
const webhook = await client.webhooks.create({ url: 'https://...', events: ['message.created'] });
await client.webhooks.delete('wh-123');

// Knowledge
const searchResult = await client.knowledge.search('How to reset password?');
const documents = await client.knowledge.listDocuments('lib-123');

// Workflows
const workflows = await client.workflows.list();
const execution = await client.workflows.execute('wf-123', { input: { prompt: 'Hello' } });

// Analytics
const analytics = await client.analytics.query({
  metric: 'messages_count',
  dimensions: ['channel'],
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});
```

## API

The client exposes the same methods as the core SDK organized into namespaced accessors: `conversations`, `messages`, `channels`, `webhooks`, `knowledge`, `workflows`, and `analytics`.

All methods return `Promise<ApiResponse<T>>` and support an optional `AbortSignal` via the last argument.
