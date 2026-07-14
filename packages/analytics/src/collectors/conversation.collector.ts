import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@conversation-platform/logger';
import type { EventBus, DomainEvent } from '@conversation-platform/event-bus';
import type { AnalyticsEventData } from '../types';
import { BaseCollector } from './base.collector';

const CONVERSATION_EVENTS = [
  'conversation.created',
  'conversation.closed',
  'conversation.reopened',
  'conversation.escalated',
  'message.sent',
  'message.received',
  'message.failed',
] as const;

const STATUS_MAP: Record<string, AnalyticsEventData['type']> = {
  active: 'conversation.created',
  closed: 'conversation.closed',
};

interface ConversationPayload {
  id?: string;
  title?: string;
  status?: string;
  channel?: string;
  tenantId?: string;
  organizationId?: string;
  userId?: string;
  contactId?: string;
  messageId?: string;
  direction?: string;
}

export class ConversationCollector extends BaseCollector {
  private lastPoll: Date;

  constructor(prisma: PrismaClient, logger: Logger, eventBus?: EventBus) {
    super(prisma, logger, eventBus);
    this.lastPoll = new Date();
  }

  getName(): string {
    return 'conversation';
  }

  subscribe(eventBus: EventBus): void {
    this.eventBus = eventBus;

    for (const eventType of CONVERSATION_EVENTS) {
      eventBus.subscribe<ConversationPayload>(eventType, async (event: DomainEvent<ConversationPayload>) => {
        const payload = event.payload;
        await this.ingest({
          type: eventType,
          source: 'conversation',
          tenantId: payload.tenantId ?? event.metadata.tenantId,
          userId: payload.userId ?? event.metadata.userId,
          conversationId: payload.id,
          contactId: payload.contactId,
          campaignId: payload.id,
          channel: payload.channel,
          data: {
            title: payload.title,
            status: payload.status,
            messageId: payload.messageId,
            direction: payload.direction,
          },
          metadata: {
            correlationId: event.metadata.correlationId,
            eventId: event.id,
          },
          timestamp: event.metadata.timestamp,
        });
      });
    }

    this.logger.info(`[conversation] Subscribed to ${CONVERSATION_EVENTS.length} conversation events`);
  }

  async poll(): Promise<void> {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          updatedAt: { gt: this.lastPoll },
        },
        select: {
          id: true,
          title: true,
          status: true,
          channel: true,
          updatedAt: true,
          tenantId: true,
          contactId: true,
        },
        orderBy: { updatedAt: 'asc' },
      });

      this.lastPoll = new Date();

      for (const conversation of conversations) {
        const eventType = STATUS_MAP[conversation.status];
        if (!eventType) continue;

        await this.ingest({
          type: eventType,
          source: 'conversation',
          tenantId: conversation.tenantId,
          conversationId: conversation.id,
          contactId: conversation.contactId ?? undefined,
          channel: conversation.channel ?? undefined,
          data: {
            title: conversation.title,
            status: conversation.status,
            polled: true,
          },
          timestamp: conversation.updatedAt,
        });
      }

      if (conversations.length > 0) {
        this.logger.debug(`[conversation] Polled ${conversations.length} updated conversations`);
      }
    } catch (error) {
      this.logger.error('[conversation] Failed to poll conversations', error);
    }
  }
}
