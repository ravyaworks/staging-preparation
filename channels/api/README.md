# @conversation-platform/channel-api

A generic REST API channel that allows external systems to send and receive messages programmatically.

## Features

- Full message type support: text, image, document, audio, video, file, button, list, quick_reply, location, contact
- API key authentication
- IP allowlisting
- Rate limiting support
- Webhook integration for outgoing messages
- Batch message processing

## Configuration

| Option             | Type     | Required | Description                          |
| ------------------ | -------- | -------- | ------------------------------------ |
| enabled            | boolean  | yes      | Enable/disable the channel           |
| apiKey             | string   | no       | API key for authentication           |
| allowedIps         | string[] | no       | IP allowlist                         |
| rateLimitPerMinute | number   | no       | Max requests per minute              |
| webhookUrl         | string   | no       | Webhook URL for outgoing messages    |
| webhookSecret      | string   | no       | Webhook signing secret               |

## Usage

```typescript
import { ApiChannel } from '@conversation-platform/channel-api'

const channel = new ApiChannel()
await channel.initialize({ enabled: true, apiKey: 'sk-...', rateLimitPerMinute: 60 })
await channel.connect({ type: 'api_key', credentials: { apiKey: 'sk-...' } })

const messages = channel.processIncoming(
  { text: 'Hello from API', conversationId: 'conv-1' },
  { requestId: 'req-1', tenantId: 'tenant-1', userId: 'user-1' },
)
```

## Incoming Payload Format

```json
{
  "text": "Hello world",
  "imageUrl": "https://example.com/image.png",
  "conversationId": "conv-123",
  "userId": "user-456",
  "attachments": [{ "type": "image", "url": "...", "fileName": "...", "fileSizeBytes": 1000, "mimeType": "image/png" }],
  "buttons": [{ "id": "btn-1", "title": "Click", "type": "postback", "value": "clicked" }],
  "quickReplies": [{ "id": "qr-1", "title": "Yes", "payload": "yes" }]
}
```
