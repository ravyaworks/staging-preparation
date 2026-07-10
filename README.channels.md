# Channel Implementations

12 channel adapters implementing `ChannelInterface` from `@conversation-platform/channel-core`.

## Supported Channels

| Channel | Package | Type |
|---|---|---|
| Website Widget | `@conversation-platform/channel-website` | Embeddable web chat with realtime messaging, typing indicators, session management |
| WhatsApp | `@conversation-platform/channel-whatsapp` | Meta WhatsApp Cloud API — messaging, templates, media, interactive messages, webhooks |
| Instagram | `@conversation-platform/channel-instagram` | Instagram Messenger via Meta Graph API |
| Messenger | `@conversation-platform/channel-messenger` | Facebook Messenger Platform |
| Telegram | `@conversation-platform/channel-telegram` | Telegram Bot API |
| Slack | `@conversation-platform/channel-slack` | Slack Web API + Events API — messages, threads, slash commands, embeds |
| Discord | `@conversation-platform/channel-discord` | Discord Bot API |
| Teams | `@conversation-platform/channel-teams` | Microsoft Teams — messages, adaptive cards, files |
| Email | `@conversation-platform/channel-email` | SendGrid, SES, SMTP — rich text, attachments |
| SMS | `@conversation-platform/channel-sms` | Twilio, Vonage — text + delivery receipts |
| API | `@conversation-platform/channel-api` | Custom REST API integration |
| Custom | `@conversation-platform/channel-custom` | Bring your own channel adapter |

## Feature Matrix

| Capability | Web | WA | IG | FB | TG | SL | DC | TE | EM | SMS | API | Cus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Text | x | x | x | x | x | x | x | x | x | x | x | x |
| Image | x | x | x | x | x | x | x | x | x | | x | x |
| Document/File | x | x | | x | x | x | x | x | x | | x | x |
| Audio/Video | | x | | x | x | | x | | | | x | x |
| Buttons | | x | | x | x | x | x | | | | x | x |
| Lists | | x | | | | | | | | | x | |
| Quick Reply | x | x | x | x | x | | | | | | x | x |
| Location | | x | | x | x | | | | | | x | x |
| Contact | | x | | | x | | | | | | x | x |
| Typing Indicator | x | x | | x | | x | | | | | | |
| Delivery Receipt | | x | | x | | | | | | x | | |
| Read Receipt | | x | | x | | | | | | | | |
| Threads | | | | x | x | x | x | x | x | | x | |
| Rich Text | x | | | | x | x | x | x | x | | x | x |
| Slash Commands | | | | | | x | x | | | | | |
| Adaptive Cards | | | | | | | | x | | | | |
| Templates | | x | | | | | | | | | | |
| Interactive | | x | | | | | | | | | | |
| Embed | | | | | | x | x | | | | | |
| Persistent Menu | | | | | | | | | | | | |

## Quick Start

```ts
import { WhatsAppChannel } from '@conversation-platform/channel-whatsapp'
import { ChannelRegistry, ChannelManager } from '@conversation-platform/channel-core'

const registry = new ChannelRegistry()
registry.register('whatsapp', new WhatsAppChannel())

const manager = new ChannelManager(registry, { healthCheckIntervalMs: 30000 })
await manager.connect(tenantId, 'whatsapp', {
  enabled: true,
  webhookUrl: 'https://example.com/webhook/whatsapp',
  webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,
}, {
  type: 'bearer_token',
  credentials: { token: process.env.WHATSAPP_ACCESS_TOKEN },
})

await manager.sendMessage({
  // OutgoingMessage fields...
})
```

## Architecture Notes

- All channels implement the same `ChannelInterface` contract from `channel-core`, enabling uniform lifecycle management and message processing.
- Each channel adapter owns its API-specific transport, auth, and webhook parsing. The core framework handles retry, health checking, and registration.
- Channel-specific types (e.g., `WhatsAppTemplate`, `SlackSlashCommand`) are exported from each channel package for consumers that need native payload access.
- Channels are registered at startup via `ChannelOrchestrator.registerChannelImplementation()`. The orchestrator then provides the unified API surface for the rest of the platform.
