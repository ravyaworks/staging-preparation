# @conversation-platform/channel-sms

SMS channel integration for the Conversation Platform.

## Features

- Multi-provider support: Twilio, Vonage, Custom
- Incoming SMS via webhooks
- Outgoing SMS sending
- Delivery status tracking
- Retry strategy with configurable backoff
- Automatic message segmentation
- Maximum message length enforcement (1600 characters)

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | `'twilio' \| 'vonage' \| 'custom'` | Yes | SMS provider |
| `accountSid` | `string` | For Twilio | Twilio Account SID |
| `authToken` | `string` | For Vonage | Vonage API key/secret |
| `fromNumber` | `string` | Yes | Sender phone number (E.164 format) |
| `messagingServiceSid` | `string` | No | Twilio Messaging Service SID |
| `maxMessageLength` | `number` | No | Maximum message length (default: 1600) |
| `retryMaxAttempts` | `number` | No | Maximum retry attempts (default: 3) |
| `retryBackoffBaseMs` | `number` | No | Base retry backoff in ms (default: 1000) |

## Usage

```typescript
import { SmsChannel } from '@conversation-platform/channel-sms'

const channel = new SmsChannel()
await channel.initialize({
  enabled: true,
  customConfig: {
    provider: 'twilio',
    accountSid: 'your-twilio-account-sid',
    authToken: 'your-twilio-auth-token',
    fromNumber: '+1234567890',
  },
})
```

## Capabilities

- Incoming: text, delivery_receipt
- Outgoing: text, delivery_receipt
- Supports replies (no threads)
- Maximum message length: 1600 characters
- No attachment support
