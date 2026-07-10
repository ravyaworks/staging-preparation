import type { IncomingMessage, OutgoingMessage, ChannelType } from '@conversation-platform/channel-core'
import { ChannelError } from '@conversation-platform/channel-core'
import type { Logger } from '@conversation-platform/logger'

export interface MessageRouterConfig {
  defaultPriority?: 'normal' | 'high' | 'urgent'
  fallbackChannel?: ChannelType
  maxRoutingAttempts?: number
}

export class MessageRouter {
  private logger?: Logger
  private config: Required<MessageRouterConfig>

  constructor(logger?: Logger, config: MessageRouterConfig = {}) {
    this.logger = logger
    this.config = {
      defaultPriority: config.defaultPriority ?? 'normal',
      fallbackChannel: config.fallbackChannel as ChannelType,
      maxRoutingAttempts: config.maxRoutingAttempts ?? 3,
    }
  }

  async routeIncoming(
    message: IncomingMessage,
    routingFn: (message: IncomingMessage) => Promise<{ channelType: ChannelType; transformed: OutgoingMessage } | null>,
  ): Promise<boolean> {
    try {
      const result = await routingFn(message)
      if (result) {
        this.logger?.info?.('Message routed', {
          fromType: message.metadata.channelType,
          toType: result.channelType,
          messageId: message.id,
        })
        return true
      }
      return false
    } catch (error) {
      this.logger?.error?.('Message routing failed', {
        messageId: message.id,
        error: error instanceof Error ? error.message : 'Unknown',
      })
      return false
    }
  }

  shouldRoute(message: IncomingMessage): boolean {
    return message.metadata.source === 'user' && message.type !== 'file'
  }
}
