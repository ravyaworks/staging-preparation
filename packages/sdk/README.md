# @conversation-platform/sdk

TypeScript SDK client for the Conversation Platform REST API.

## Constructor

```ts
const client = new ConversationClient('https://api.example.com', 'cp_abc123...')
```

## Supported Operations

| Method | Endpoint | Description |
|---|---|---|
| `list(params?)` | GET /conversations | List conversations (paginated, filterable by status/channel) |
| `get(id)` | GET /conversations/:id | Get single conversation |
| `create(params)` | POST /conversations | Create conversation |
| `listMessages(conversationId, params?)` | GET /conversations/:id/messages | List messages (paginated, time-range filterable) |
| `sendMessage(conversationId, content, params?)` | POST /conversations/:id/messages | Send a message |
| `listChannels()` | GET /channels | List connected channels |
| `connectChannel(type, config)` | POST /channels | Connect a new channel |
| `disconnectChannel(type)` | DELETE /channels/:type | Disconnect a channel |
| `listWebhooks()` | GET /webhooks | List webhooks |
| `createWebhook(config)` | POST /webhooks | Register a webhook |
| `deleteWebhook(id)` | DELETE /webhooks/:id | Remove a webhook |
| `searchKnowledge(query)` | POST /knowledge/search | Semantic knowledge search |
| `listDocuments(libraryId)` | GET /knowledge/libraries/:id/documents | List knowledge documents |
| `listWorkflows()` | GET /workflows | List workflows |
| `executeWorkflow(id, input)` | POST /workflows/:id/execute | Execute a workflow |
| `queryAnalytics(params)` | POST /analytics/query | Query analytics data |

## TypeScript Types

All request/response types are exported: `Conversation`, `Message`, `Channel`, `Webhook`, `Document`, `Workflow`, `WorkflowExecution`, `KnowledgeQuery`, `KnowledgeResult`, `AnalyticsQuery`, `AnalyticsResult`, `SDKPaginatedResult`, and the parameter interfaces (`CreateConversationParams`, `SendMessageParams`, `CreateWebhookParams`, `ConnectChannelParams`, `ListConversationsParams`, `ListMessagesParams`).

## Error Handling

Every method throws `SDKError` on non-2xx responses:

```ts
class SDKError extends Error {
  name: 'SDKError'
  code: string       // e.g. 'NOT_FOUND', 'RATE_LIMITED'
  status: number     // HTTP status code
}
```

## AbortSignal Support

All methods accept an optional `options` argument with an `AbortSignal`:

```ts
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)
const conversations = await client.list({ page: 1 }, { signal: controller.signal })
```
