# @conversation-platform/sdk-react

React hooks and provider for the Conversation Platform.

## Installation

```bash
pnpm add @conversation-platform/sdk-react
```

## Usage

Wrap your app in a `ConversationProvider`:

```tsx
import { ConversationProvider } from '@conversation-platform/sdk-react';

function App() {
  return (
    <ConversationProvider baseUrl="https://api.example.com" apiKey="your-api-key">
      <YourComponent />
    </ConversationProvider>
  );
}
```

Then use hooks in any component:

```tsx
import { useConversations, useMessages, useChannels, useSendMessage, useCreateConversation } from '@conversation-platform/sdk-react';

function ConversationsList() {
  const { data, loading } = useConversations({ status: 'active' });
  if (loading) return <p>Loading...</p>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function Chat({ conversationId }: { conversationId: string }) {
  const { data: messages, loading } = useMessages(conversationId);
  const { send, sending } = useSendMessage(conversationId);

  return (
    <div>
      {messages?.data.map(msg => <div key={msg.id}>{msg.content}</div>)}
      <button onClick={() => send('Hello!')} disabled={sending}>Send</button>
    </div>
  );
}
```

## Available Hooks

| Hook | Returns | Description |
|---|---|---|
| `useConversations(params?)` | `{ data, loading, error }` | Fetch paginated conversations |
| `useMessages(conversationId)` | `{ data, loading, error }` | Fetch messages for a conversation |
| `useChannels()` | `{ data, loading, error }` | List all channels |
| `useSendMessage(conversationId)` | `{ send, sending, error }` | Send a message to a conversation |
| `useCreateConversation()` | `{ create, creating, error }` | Create a new conversation |
