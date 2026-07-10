# @conversation-platform/channel-service

Orchestrates channel lifecycle, message routing, and event publishing across all communication channels.

## ChannelOrchestrator

Top-level facade that composes `ChannelRegistry`, `ChannelManager`, and `ChannelConfigLoader` from `@conversation-platform/channel-core`. Manages the full lifecycle:

- **registerChannelImplementation**(type, impl) — register a channel adapter
- **connectChannel**(tenantId, type, config, auth) — validate, initialize, connect, persist config, publish `channel.connected` event
- **disconnectChannel**(tenantId, type) — disconnect, remove config, publish `channel.disconnected` event
- **reconnectChannel**(tenantId, type) — reconnect and publish `channel.reconnected` event
- **sendMessage**(tenantId, type, message) — send outgoing message via the channel adapter
- **processIncomingPayload**(tenantId, type, rawPayload, context) — parse raw webhook payload into `IncomingMessage[]`, publish `message.received` for each
- **getConnectedChannels**(tenantId) — list active channel connections
- **getChannelHealth**(tenantId, type) — run health check
- **updateChannelConfig**(tenantId, type, config) — partial config update

Integrates with `@conversation-platform/event-bus` for event-driven workflows.

## MessageRouter

Routes incoming user messages to the appropriate destination channel. Stateless design:

- **routeIncoming**(message, routingFn) — calls a user-provided async routing function that returns `{ channelType, transformed }` or null. Returns true if routed.
- **shouldRoute**(message) — returns true for user-sourced text messages (skips files and system messages).

The routing function is injected, so custom logic (AI-based routing, round-robin, priority queues) can be implemented externally.

## Usage

```ts
import { ChannelOrchestrator, MessageRouter } from '@conversation-platform/channel-service'
import { WhatsAppChannel } from '@conversation-platform/channel-whatsapp'

const orchestrator = new ChannelOrchestrator({ eventBus, logger })
orchestrator.registerChannelImplementation('whatsapp', new WhatsAppChannel())

await orchestrator.connectChannel(tenantId, 'whatsapp', config, auth)

const router = new MessageRouter(logger)
const routed = await router.routeIncoming(message, async (msg) => {
  if (msg.metadata.channelType === 'whatsapp') {
    return { channelType: 'slack', transformed: transform(msg) }
  }
  return null
})
```
