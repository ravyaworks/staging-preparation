# Conversation Platform Flutter SDK

Dart SDK for the Conversation Platform API. Works with Flutter and standalone Dart.

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  conversation_platform_sdk:
    path: ./sdk/flutter
```

## Usage

```dart
import 'package:conversation_platform_sdk/conversation_platform_sdk.dart';

final client = ConversationClient(
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
);

// List conversations
final conversations = await client.listConversations();

// Send a message
final message = await client.sendMessage(
  'conv-123',
  content: 'Hello, world!',
);

// Search knowledge
final results = await client.searchKnowledge('How do I reset my password?');

client.dispose();
```

## API

All methods return Dart objects with `fromJson`/`toJson` support.

| Method | Description |
|--------|-------------|
| `listConversations()` | List conversations with pagination |
| `getConversation(id)` | Get a single conversation |
| `createConversation(channelId)` | Create a new conversation |
| `listMessages(conversationId)` | List messages for a conversation |
| `sendMessage(conversationId, content)` | Send a message |
| `listChannels()` | List connected channels |
| `connectChannel(type, config)` | Connect a channel |
| `disconnectChannel(type)` | Disconnect a channel |
| `listWebhooks()` | List registered webhooks |
| `createWebhook(url, events)` | Register a webhook |
| `deleteWebhook(id)` | Delete a webhook |
| `searchKnowledge(query)` | Search knowledge base |
| `listDocuments(libraryId)` | List documents in a library |
| `listWorkflows()` | List workflows |
| `executeWorkflow(id, input)` | Execute a workflow |
| `queryAnalytics(metric, ...)` | Query analytics data |

## Running tests

```bash
dart test
```
