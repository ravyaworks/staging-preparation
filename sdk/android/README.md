# Conversation Platform Android SDK

Kotlin SDK for the Conversation Platform API.

## Installation

Add to your project's `settings.gradle.kts`:

```kotlin
include(':conversation-platform-sdk')
project(':conversation-platform-sdk').projectDir = file('sdk/android')
```

Add to your module's `build.gradle.kts`:

```kotlin
implementation(project(":conversation-platform-sdk"))
```

## Usage

```kotlin
val client = ConversationClient(
    baseUrl = "https://api.example.com",
    apiKey = "your-api-key"
)

lifecycleScope.launch {
    val conversations = client.listConversations()
    val message = client.sendMessage("conv-123", content = "Hello!")
}
```

## API

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

## Requirements

- Android API 24+
- Kotlin 1.9+
- Coroutines
- OkHttp 4.12+
- Gson 2.10+

## Building

```bash
./gradlew :conversation-platform-sdk:assembleRelease
```
