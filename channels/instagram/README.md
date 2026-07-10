# @conversation-platform/channel-instagram

Instagram Messenger channel integration using the Instagram Graph API.

## Features

- Incoming/outgoing text messaging
- Image and media messages
- Quick replies
- Postback buttons
- Typing indicators
- Read receipts and delivery receipts
- Story mentions (placeholder)
- Webhook verification and handling
- Rate limiting

## Configuration

| Config | Type | Required | Description |
|--------|------|----------|-------------|
| `instagramBusinessAccountId` | `string` | Yes | Instagram Business Account ID |
| `accessToken` | `string` | Yes | Instagram Graph API access token |
| `appSecret` | `string` | Yes | App secret for request validation |
| `webhookVerifyToken` | `string` | No | Webhook verification token |

## Usage

```typescript
import { InstagramChannel } from '@conversation-platform/channel-instagram'

const channel = new InstagramChannel()

await channel.initialize({
  enabled: true,
  customConfig: {
    instagramBusinessAccountId: 'ig-business-123',
    accessToken: 'your-access-token',
    appSecret: 'your-app-secret',
  },
})

await channel.connect({
  type: 'bearer_token',
  credentials: { token: 'your-access-token' },
})

const messageId = await channel.sendMessage({
  // ... outgoing message payload
})
```

## Capabilities

See `CapabilityRegistry.DEFAULT_CAPABILITIES.instagram` in `@conversation-platform/channel-core`.
