# @conversation-platform/channel-telegram

Telegram channel integration using the Bot API.

## Features

- Bot API integration (send/receive messages)
- Inline keyboard buttons
- Media attachments (photos, documents, audio, video, voice)
- Location and contact sharing
- Webhook and polling support (placeholder)
- Bot commands support
- Typing indicators

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `botToken` | `string` | Yes | Telegram Bot API token |
| `webhookUrl` | `string` | No | HTTPS URL for webhook updates |
| `allowedUpdates` | `string[]` | No | List of update types to receive |
| `commands` | `BotCommand[]` | No | Bot commands list |

## Usage

```typescript
import { TelegramChannel } from '@conversation-platform/channel-telegram'

const channel = new TelegramChannel()
await channel.initialize({
  enabled: true,
  customConfig: { botToken: process.env.TELEGRAM_BOT_TOKEN },
})
await channel.connect({ type: 'bearer_token', credentials: { token: process.env.TELEGRAM_BOT_TOKEN } })
```
