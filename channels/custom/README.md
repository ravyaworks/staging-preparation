# @conversation-platform/channel-custom

A flexible "bring your own channel" adapter for custom integrations. Users configure it with their own webhook and parser logic.

## Features

- Full message type support: text, image, document, audio, video, file, button, quick_reply, location, contact
- Custom parser function for transforming incoming payloads
- Multiple auth types: api_key, basic_auth, bearer_token, custom
- Webhook integration for outgoing messages
- User-defined credentials storage

## Configuration

| Option        | Type   | Required | Description                                |
| ------------- | ------ | -------- | ------------------------------------------ |
| enabled       | boolean | yes      | Enable/disable the channel                 |
| channelName   | string | yes      | Unique name for this integration           |
| webhookUrl    | string | no       | Webhook URL for outgoing messages          |
| webhookSecret | string | no       | Webhook signing secret                     |
| authType      | string | no       | One of: api_key, basic_auth, bearer_token, custom |
| credentials   | object | no       | Key-value store for auth credentials       |

## Usage

```typescript
import { CustomChannel } from '@conversation-platform/channel-custom'

// Without custom parser
const channel = new CustomChannel()
await channel.initialize({ enabled: true, channelName: 'My Integration' })
await channel.connect({ type: 'bearer_token', credentials: { token: 'my-token' } })

// With custom parser
const customParser = (raw) => {
  const { message, convId, sender } = raw.data ?? {}
  return { text: message, conversationId: convId, userId: sender }
}
const channelWithParser = new CustomChannel(undefined, customParser)
```

## Custom Parser

The parser function receives the raw payload and returns a record (or array of records) that maps to the internal message format:

```typescript
type CustomParserFunction = (
  rawPayload: Record<string, unknown>,
) => Record<string, unknown> | Record<string, unknown>[]
```
