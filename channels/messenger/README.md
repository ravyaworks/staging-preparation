# @conversation-platform/channel-messenger

Facebook Messenger channel integration using the Messenger Platform API.

## Features

- Incoming/outgoing text messaging
- Media messages (images, audio, video, files)
- Button templates and quick replies
- Postback handling
- Typing indicators
- Read receipts and delivery receipts
- Persistent menu configuration
- User profile retrieval
- Webhook verification and handling
- Rate limiting

## Configuration

| Config | Type | Required | Description |
|--------|------|----------|-------------|
| `pageId` | `string` | Yes | Facebook Page ID |
| `appSecret` | `string` | Yes | App secret for request validation |
| `accessToken` | `string` | Yes | Page access token |
| `webhookVerifyToken` | `string` | No | Webhook verification token |
| `persistentMenu` | `array` | No | Persistent menu configuration |

## Usage

```typescript
import { MessengerChannel } from '@conversation-platform/channel-messenger'

const channel = new MessengerChannel()

await channel.initialize({
  enabled: true,
  customConfig: {
    pageId: 'your-page-id',
    appSecret: 'your-app-secret',
    accessToken: 'your-page-access-token',
  },
})

await channel.connect({
  type: 'bearer_token',
  credentials: { token: 'your-page-access-token' },
})

const messageId = await channel.sendMessage({
  // ... outgoing message payload
})

// Set persistent menu
await channel.setPersistentMenu([{
  locale: 'default',
  call_to_actions: [
    { title: 'Help', type: 'postback', payload: 'HELP' },
    { title: 'Contact', type: 'postback', payload: 'CONTACT' },
  ],
}])
```

## Capabilities

See `CapabilityRegistry.DEFAULT_CAPABILITIES.messenger` in `@conversation-platform/channel-core`.
