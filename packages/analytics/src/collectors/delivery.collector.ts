import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@conversation-platform/logger';
import type { EventBus, DomainEvent } from '@conversation-platform/event-bus';
import type { AnalyticsEventData } from '../types';
import { BaseCollector } from './base.collector';

const DELIVERY_EVENTS = [
  'job.created',
  'job.queued',
  'job.sent',
  'job.delivered',
  'job.read',
  'job.failed',
  'job.retrying',
  'job.dead_letter',
  'job.cancelled',
] as const;

interface JobPayload {
  jobId?: string;
  id?: string;
  tenantId?: string;
  campaignId?: string;
  channel?: string;
  status?: string;
  error?: string;
  attempt?: number;
}

export class DeliveryCollector extends BaseCollector {
  private lastPoll: Date;

  constructor(prisma: PrismaClient, logger: Logger, eventBus?: EventBus) {
    super(prisma, logger, eventBus);
    this.lastPoll = new Date();
  }

  getName(): string {
    return 'delivery';
  }

  subscribe(eventBus: EventBus): void {
    this.eventBus = eventBus;

    for (const eventType of DELIVERY_EVENTS) {
      eventBus.subscribe<JobPayload>(eventType, async (event: DomainEvent<JobPayload>) => {
        const payload = event.payload;
        const jobId = payload.jobId ?? payload.id;
        await this.ingest({
          type: eventType,
          source: 'delivery',
          tenantId: payload.tenantId ?? event.metadata.tenantId,
          campaignId: payload.campaignId,
          channel: payload.channel,
          data: {
            jobId,
            status: payload.status,
            error: payload.error,
            attempt: payload.attempt,
          },
          metadata: {
            correlationId: event.metadata.correlationId,
            eventId: event.id,
          },
          timestamp: event.metadata.timestamp,
        });
      });
    }

    this.logger.info(`[delivery] Subscribed to ${DELIVERY_EVENTS.length} delivery events`);
  }

  async poll(): Promise<void> {
    try {
      const deliveryEvents = await this.prisma.deliveryEvent.findMany({
        where: {
          timestamp: { gt: this.lastPoll },
        },
        select: {
          id: true,
          type: true,
          currentStatus: true,
          channel: true,
          timestamp: true,
          jobId: true,
          job: {
            select: {
              tenantId: true,
              campaignId: true,
            },
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      this.lastPoll = new Date();

      for (const event of deliveryEvents) {
        const eventType = `job.${event.type}` as AnalyticsEventData['type'];
        if (!DELIVERY_EVENTS.includes(eventType as (typeof DELIVERY_EVENTS)[number])) continue;

        await this.ingest({
          type: eventType,
          source: 'delivery',
          tenantId: event.job?.tenantId ?? undefined,
          campaignId: event.job?.campaignId ?? undefined,
          channel: event.channel ?? undefined,
          data: {
            deliveryEventId: event.id,
            currentStatus: event.currentStatus,
            polled: true,
          },
          timestamp: event.timestamp,
        });
      }

      if (deliveryEvents.length > 0) {
        this.logger.debug(`[delivery] Polled ${deliveryEvents.length} delivery events`);
      }
    } catch (error) {
      this.logger.error('[delivery] Failed to poll delivery events', error);
    }
  }
}
