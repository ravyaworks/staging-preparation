import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'

export interface ConversationContext {
  conversationId: string
  tenantId: string
  channel: string
  status: string
  metadata?: Record<string, unknown>
}

export interface ConversationService {
  createContext(params: { tenantId: string; channel: string; contactId?: string }): Promise<ConversationContext>
  getContext(conversationId: string): Promise<ConversationContext | null>
  updateStatus(conversationId: string, status: string): Promise<void>
}

export function createConversationService(config: AppConfig, logger: Logger): ConversationService {
  const contexts = new Map<string, ConversationContext>()

  return {
    async createContext(params): Promise<ConversationContext> {
      const context: ConversationContext = {
        conversationId: crypto.randomUUID(),
        tenantId: params.tenantId,
        channel: params.channel,
        status: 'active',
      }
      contexts.set(context.conversationId, context)
      return context
    },

    async getContext(conversationId: string): Promise<ConversationContext | null> {
      return contexts.get(conversationId) ?? null
    },

    async updateStatus(conversationId: string, status: string): Promise<void> {
      const ctx = contexts.get(conversationId)
      if (ctx) {
        ctx.status = status
      }
    },
  }
}
