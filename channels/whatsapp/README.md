# @conversation-platform/channel-whatsapp

WhatsApp Business channel integration using the Meta WhatsApp Cloud API.

## Features

- Incoming/outgoing text messaging
- Media messages (images, documents, audio, video)
- Interactive messages (buttons, lists)
- Location and contact sharing
- Message templates
- Delivery and read receipts
- Typing indicators
- Webhook verification and handling
- Rate limiting
- Retry strategy with exponential backoff
- Health checks

## Configuration

| Config | Type | Required | Description |
|--------|------|----------|-------------|
| `phoneNumberId` | `string` | Yes | WhatsApp Business phone number ID |
| `businessAccountId` | `string` | No | WhatsApp Business Account ID |
| `apiVersion` | `string` | No | Meta Graph API version (default: v21.0) |
| `webhookVerifyToken` | `string` | No | Webhook verification token |
| `appSecret` | `string` | Yes | App secret for request validation |

## Usage

```typescript
import { WhatsAppChannel } from '@conversation-platform/channel-whatsapp'
import type { ChannelConfig, ChannelAuthConfig } from '@conversation-platform/channel-core'

const channel = new WhatsAppChannel()

await channel.initialize({
  enabled: true,
  customConfig: {
    phoneNumberId: '123456789',
    appSecret: 'your-app-secret',
    apiVersion: 'v21.0',
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

## Webhook Verification

```typescript
const result = channel.verifyWebhook(mode, token, challenge)
if (result.verified) {
  return result.challenge
}
```

## Capabilities

See `CapabilityRegistry.DEFAULT_CAPABILITIES.whatsapp` in `@conversation-platform/channel-core`.
