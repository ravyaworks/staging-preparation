# @conversation-platform/channel-discord

Discord channel integration using the Discord Bot API.

## Features

- Bot messages (send/receive)
- Slash commands (INTERACTION_CREATE)
- Message embeds
- File and image attachments
- Typing indicators
- Component buttons

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `botToken` | `string` | Yes | Discord Bot Token |
| `applicationId` | `string` | Yes | Discord Application ID |
| `publicKey` | `string` | Yes | Discord Application Public Key |
| `guildId` | `string` | No | Target Guild ID |

## Usage

```typescript
import { DiscordChannel } from '@conversation-platform/channel-discord'

const channel = new DiscordChannel()
await channel.initialize({
  enabled: true,
  customConfig: {
    botToken: process.env.DISCORD_BOT_TOKEN,
    applicationId: process.env.DISCORD_APPLICATION_ID,
    publicKey: process.env.DISCORD_PUBLIC_KEY,
  },
})
await channel.connect({ type: 'bearer_token', credentials: { token: process.env.DISCORD_BOT_TOKEN } })
```
