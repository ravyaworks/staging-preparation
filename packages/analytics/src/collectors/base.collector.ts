import type { PrismaClient, Prisma } from '@prisma/client';
import type { Logger } from '@conversation-platform/logger';
import type { EventBus } from '@conversation-platform/event-bus';
import type { AnalyticsEventData } from '../types';

export abstract class BaseCollector {
  protected readonly prisma: PrismaClient;
  protected readonly logger: Logger;
  protected eventBus?: EventBus;

  constructor(prisma: PrismaClient, logger: Logger, eventBus?: EventBus) {
    this.prisma = prisma;
    this.logger = logger;
    this.eventBus = eventBus;
  }

  abstract getName(): string;
  abstract subscribe(eventBus: EventBus): void;

  protected async ingest(data: AnalyticsEventData): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          type: data.type,
          source: data.source,
          tenantId: data.tenantId ?? null,
          organizationId: data.organizationId ?? null,
          userId: data.userId ?? null,
          campaignId: data.campaignId ?? null,
          conversationId: data.conversationId ?? null,
          contactId: data.contactId ?? null,
          channel: data.channel ?? null,
          value: data.value ?? null,
          data: data.data as Prisma.InputJsonValue,
          metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
          timestamp: data.timestamp,
        },
      });

      if (this.eventBus) {
        await this.eventBus.publish('analytics.event.ingested', {
          type: data.type,
          source: data.source,
          timestamp: data.timestamp,
        });
      }
    } catch (error) {
      this.logger.error(`[${this.getName()}] Failed to ingest analytics event`, error);
    }
  }
}
