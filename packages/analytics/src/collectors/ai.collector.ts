import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@conversation-platform/logger';
import type { EventBus, DomainEvent } from '@conversation-platform/event-bus';
import type { AnalyticsEventData } from '../types';
import { BaseCollector } from './base.collector';

const AI_EVENTS = [
  'ai.response',
  'ai.escalation',
  'ai.feedback',
] as const;

interface AIPayload {
  conversationId?: string;
  tenantId?: string;
  organizationId?: string;
  userId?: string;
  contactId?: string;
  channel?: string;
  provider?: string;
  model?: string;
  tokenCount?: number;
  latency?: number;
  content?: string;
  feedback?: string;
  rating?: number;
}

export class AICollector extends BaseCollector {
  private lastPoll: Date;

  constructor(prisma: PrismaClient, logger: Logger, eventBus?: EventBus) {
    super(prisma, logger, eventBus);
    this.lastPoll = new Date();
  }

  getName(): string {
    return 'ai';
  }

  subscribe(eventBus: EventBus): void {
    this.eventBus = eventBus;

    for (const eventType of AI_EVENTS) {
      eventBus.subscribe<AIPayload>(eventType, async (event: DomainEvent<AIPayload>) => {
        const payload = event.payload;
        await this.ingest({
          type: eventType,
          source: 'ai',
          tenantId: payload.tenantId ?? event.metadata.tenantId,
          organizationId: payload.organizationId,
          userId: payload.userId ?? event.metadata.userId,
          conversationId: payload.conversationId,
          contactId: payload.contactId,
          channel: payload.channel,
          data: {
            provider: payload.provider,
            model: payload.model,
            tokenCount: payload.tokenCount,
            latency: payload.latency,
            content: payload.content,
            feedback: payload.feedback,
            rating: payload.rating,
          },
          metadata: {
            correlationId: event.metadata.correlationId,
            eventId: event.id,
          },
          timestamp: event.metadata.timestamp,
        });
      });
    }

    this.logger.info(`[ai] Subscribed to ${AI_EVENTS.length} AI events`);
  }

  async poll(): Promise<void> {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          provider: { not: null },
          createdAt: { gt: this.lastPoll },
          role: 'assistant',
        },
        select: {
          id: true,
          provider: true,
          model: true,
          tokenCount: true,
          latency: true,
          createdAt: true,
          conversationId: true,
          conversation: {
            select: {
              tenantId: true,
              channel: true,
              contactId: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      this.lastPoll = new Date();

      for (const message of messages) {
        await this.ingest({
          type: 'ai.response',
          source: 'ai',
          tenantId: message.conversation?.tenantId ?? undefined,
          conversationId: message.conversationId,
          contactId: message.conversation?.contactId ?? undefined,
          channel: message.conversation?.channel ?? undefined,
          value: message.tokenCount ?? undefined,
          data: {
            messageId: message.id,
            provider: message.provider,
            model: message.model,
            tokenCount: message.tokenCount,
            latency: message.latency,
            polled: true,
          },
          timestamp: message.createdAt,
        });
      }

      if (messages.length > 0) {
        this.logger.debug(`[ai] Polled ${messages.length} AI messages`);
      }
    } catch (error) {
      this.logger.error('[ai] Failed to poll AI messages', error);
    }
  }
}
