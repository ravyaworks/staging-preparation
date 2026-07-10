# @conversation-platform/channel-teams

Microsoft Teams channel integration for the Conversation Platform.

## Features

- Bot messaging via Microsoft Teams Bot Framework
- Adaptive card support
- OAuth2 authentication with Microsoft identity platform
- App-only authentication mode
- Typing indicators
- Read receipts
- Webhook-based incoming activity handling

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `botId` | `string` | No | Microsoft Teams bot ID |
| `botPassword` | `string` | No | Microsoft Teams bot password |
| `tenantId` | `string` | Yes (OAuth2) | Azure AD tenant ID |
| `appId` | `string` | Yes (OAuth2) | Azure AD app registration ID |
| `appPassword` | `string` | Yes (OAuth2) | Azure AD app client secret |
| `authMode` | `'oauth2' \| 'app_only'` | No | Authentication mode (default: `oauth2`) |
| `enableAdaptiveCards` | `boolean` | No | Enable/disable adaptive card support (default: `true`) |

## Usage

```typescript
import { TeamsChannel } from '@conversation-platform/channel-teams'

const channel = new TeamsChannel()
await channel.initialize({
  enabled: true,
  customConfig: {
    botId: 'your-bot-id',
    tenantId: 'your-tenant-id',
    appId: 'your-app-id',
    appPassword: 'your-app-password',
  },
})
```

## Authentication

Teams uses OAuth2 with the Microsoft identity platform. The channel acquires tokens using the client credentials flow against `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`.

## Capabilities

- Incoming: text, image, file, adaptive_card
- Outgoing: text, image, file, adaptive_card
- Supports replies and threads
- Maximum message length: 4096 characters
- Maximum attachment size: 10 MB
