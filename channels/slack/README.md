# @conversation-platform/channel-slack

Slack channel integration using the Slack API.

## Features

- Bot events (message received)
- Slash commands
- Interactive message buttons
- Thread replies
- File attachments
- URL verification for Events API
- Rich text (mrkdwn) support

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `botToken` | `string` | Yes | Slack Bot User OAuth Token |
| `signingSecret` | `string` | Yes | Slack App Signing Secret |
| `appId` | `string` | No | Slack App ID |
| `clientId` | `string` | No | Slack App Client ID |
| `clientSecret` | `string` | No | Slack App Client Secret |
| `slashCommands` | `SlashCommand[]` | No | Registered slash commands |

## Usage

```typescript
import { SlackChannel } from '@conversation-platform/channel-slack'

const channel = new SlackChannel()
await channel.initialize({
  enabled: true,
  customConfig: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  },
})
await channel.connect({ type: 'bearer_token', credentials: { token: process.env.SLACK_BOT_TOKEN } })
```
