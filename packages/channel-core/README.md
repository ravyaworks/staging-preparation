# @conversation-platform/channel-core

Core channel abstractions for omnichannel communication. Defines the framework for connecting, sending/receiving messages, and managing channel lifecycle across all communication channels.

## Architecture

Three primary classes:

- **ChannelInterface** — contract all channel adapters implement. Covers initialize, connect, disconnect, sendMessage, processIncoming, healthCheck, getCapabilities, onEvent, validateConfig.
- **ChannelRegistry** — singleton registry mapping `ChannelType` -> `ChannelInterface` implementations. Also tracks per-tenant active connections as `ChannelRegistration`.
- **ChannelManager** — orchestrates connect/disconnect lifecycle, health check polling, config updates, and event emission. Delegates to Registry for storage.

Supporting registries:

- **CapabilityRegistry** — declare per-channel capabilities (text, image, buttons, etc.) with static defaults for all 12 channel types.
- **VersionRegistry** — track supported/deprecated API versions per channel.
- **ChannelConfigLoader** — load config from a `ConfigSource` interface keyed by tenant+type.

## Message Types

- **IncomingMessage** — message received from a channel (user -> platform). Contains content, attachments, buttons, location, contact, user/conversation/tenant context, and raw payload.
- **OutgoingMessage** — message sent to a channel (platform -> user). Same shape as IncomingMessage plus optional `customization` for channel-specific overrides.

Helper factories: `createIncomingMessage()`, `createOutgoingMessage()`. Content type guards: `isTextContent()`, `isAttachmentContent()`.

## Error Classes

| Class | Code | When |
|---|---|---|
| `ChannelError` | CHANNEL_ERROR | Base error |
| `ChannelConfigError` | CHANNEL_CONFIG_ERROR | Invalid config |
| `ChannelAuthError` | CHANNEL_AUTH_ERROR | Auth failure |
| `ChannelConnectionError` | CHANNEL_CONNECTION_ERROR | Connect/reconnect failure |
| `ChannelMessageError` | CHANNEL_MESSAGE_ERROR | Send/receive failure |
| `ChannelRateLimitError` | CHANNEL_RATE_LIMIT_ERROR | Rate limited, includes `retryAfterMs` |
| `ChannelNotImplementedError` | CHANNEL_NOT_IMPLEMENTED | Method not supported by adapter |

## Creating a Channel Adapter

```ts
import { ChannelInterface, ChannelConfig, ChannelAuthConfig, ChannelRegistration } from '@conversation-platform/channel-core'

class MyChannel implements ChannelInterface {
  readonly type = 'custom'
  readonly displayName = 'My Channel'
  readonly version = '1.0.0'

  async initialize(config: ChannelConfig): Promise<void> { /* ... */ }
  async connect(auth: ChannelAuthConfig): Promise<void> { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
  async healthCheck(): Promise<{ healthy: boolean; status: string; latencyMs: number; lastCheckedAt: string }> { /* ... */ }
  async sendMessage(message: OutgoingMessage): Promise<string> { /* ... */ }
  async sendTypingIndicator(conversationId: string, isTyping: boolean, tenantId: string): Promise<void> { /* ... */ }
  async markAsRead(messageId: string, conversationId: string, tenantId: string): Promise<void> { /* ... */ }
  getCapabilities(): ChannelCapabilitySet { /* ... */ }
  getConfig(): ChannelConfig { /* ... */ }
  async updateConfig(config: Partial<ChannelConfig>): Promise<void> { /* ... */ }
  onEvent(handler: ChannelEventHandler): void { /* ... */ }
  validateConfig(config: ChannelConfig): string[] { /* ... */ }
  async processIncoming(rawPayload: Record<string, unknown>, context: RequestContext): Promise<IncomingMessage[]> { /* ... */ }
}
```

Register with `registry.register('custom', new MyChannel())`.

## API Reference

```ts
// ChannelRegistry
register(type, implementation)       // Register adapter
getImplementation(type)              // Get adapter by type
connect(tenantId, type, reg)         // Track connection
disconnect(tenantId, type)           // Remove connection
get(tenantId, type)                  // Get registration
list(options?)                       // Filter by status/type/tenant

// ChannelManager
connect(tenantId, type, config, auth)   // Full connect lifecycle
disconnect(tenantId, type)
reconnect(tenantId, type)
getHealth(tenantId, type)
updateConfig(tenantId, type, config)
listChannels(options?)
onEvent(handler)
dispose()                              // Clean up all timers
```
