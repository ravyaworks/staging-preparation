import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@conversation-platform/logger';
import type { EventBus, DomainEvent } from '@conversation-platform/event-bus';
import type { AnalyticsEventData } from '../types';
import { BaseCollector } from './base.collector';

const CAMPAIGN_EVENTS = [
  'campaign.created',
  'campaign.started',
  'campaign.completed',
  'campaign.paused',
  'campaign.resumed',
  'campaign.cancelled',
  'campaign.failed',
] as const;

const STATUS_MAP: Record<string, AnalyticsEventData['type']> = {
  created: 'campaign.created',
  active: 'campaign.started',
  completed: 'campaign.completed',
  paused: 'campaign.paused',
  cancelled: 'campaign.cancelled',
  failed: 'campaign.failed',
};

interface CampaignPayload {
  id?: string;
  name?: string;
  status?: string;
  channel?: string;
  tenantId?: string;
  organizationId?: string;
  createdBy?: string;
}

export class CampaignCollector extends BaseCollector {
  private lastPoll: Date;

  constructor(prisma: PrismaClient, logger: Logger, eventBus?: EventBus) {
    super(prisma, logger, eventBus);
    this.lastPoll = new Date();
  }

  getName(): string {
    return 'campaign';
  }

  subscribe(eventBus: EventBus): void {
    this.eventBus = eventBus;

    for (const eventType of CAMPAIGN_EVENTS) {
      eventBus.subscribe<CampaignPayload>(eventType, async (event: DomainEvent<CampaignPayload>) => {
        const payload = event.payload;
        await this.ingest({
          type: eventType,
          source: 'campaign',
          tenantId: payload.tenantId ?? event.metadata.tenantId,
          organizationId: payload.organizationId,
          userId: payload.createdBy ?? event.metadata.userId,
          campaignId: payload.id,
          channel: payload.channel,
          data: {
            campaignName: payload.name,
            status: payload.status,
          },
          metadata: {
            correlationId: event.metadata.correlationId,
            eventId: event.id,
          },
          timestamp: event.metadata.timestamp,
        });
      });
    }

    this.logger.info(`[campaign] Subscribed to ${CAMPAIGN_EVENTS.length} campaign events`);
  }

  async poll(): Promise<void> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          updatedAt: { gt: this.lastPoll },
        },
        select: {
          id: true,
          name: true,
          status: true,
          channel: true,
          updatedAt: true,
          organizationId: true,
        },
        orderBy: { updatedAt: 'asc' },
      });

      this.lastPoll = new Date();

      for (const campaign of campaigns) {
        const eventType = STATUS_MAP[campaign.status];
        if (!eventType) continue;

        await this.ingest({
          type: eventType,
          source: 'campaign',
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          channel: campaign.channel,
          data: {
            campaignName: campaign.name,
            status: campaign.status,
            polled: true,
          },
          timestamp: campaign.updatedAt,
        });
      }

      if (campaigns.length > 0) {
        this.logger.debug(`[campaign] Polled ${campaigns.length} updated campaigns`);
      }
    } catch (error) {
      this.logger.error('[campaign] Failed to poll campaigns', error);
    }
  }
}
