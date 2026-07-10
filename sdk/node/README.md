# @conversation-platform/sdk-node

Node.js SDK for the Conversation Platform. Extends the core SDK with server-side features like streaming message support.

## Installation

```bash
pnpm add @conversation-platform/sdk-node
```

## Usage

```ts
import { ConversationClient, createServerClient } from '@conversation-platform/sdk-node';

// Standard usage
const client = new ConversationClient('https://api.example.com', 'your-api-key');
const { data: conversations } = await client.list();

// Streaming messages (Server-Sent Events)
const stream = client.streamMessages('conv-123');
for await (const message of stream) {
  console.log('New message:', message.content);
}

// Factory function
const serverClient = await createServerClient('https://api.example.com', 'your-api-key');
```

## Features

- All core SDK methods
- `streamMessages(conversationId)` — async generator that yields messages from a Server-Sent Events stream
- `createServerClient(baseUrl, apiKey)` — factory function for creating server-side clients
