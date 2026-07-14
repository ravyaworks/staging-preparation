import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@conversation-platform/logger';
import type { EventBus, DomainEvent } from '@conversation-platform/event-bus';
import type { AnalyticsEventData } from '../types';
import { BaseCollector } from './base.collector';

const WORKFLOW_EVENTS = [
  'workflow.executed',
  'workflow.completed',
  'workflow.failed',
] as const;

interface WorkflowPayload {
  workflowId?: string;
  workflowName?: string;
  tenantId?: string;
  organizationId?: string;
  conversationId?: string;
  triggerType?: string;
  duration?: number;
  error?: string;
}

export class WorkflowCollector extends BaseCollector {
  constructor(prisma: PrismaClient, logger: Logger, eventBus?: EventBus) {
    super(prisma, logger, eventBus);
  }

  getName(): string {
    return 'workflow';
  }

  subscribe(eventBus: EventBus): void {
    this.eventBus = eventBus;

    for (const eventType of WORKFLOW_EVENTS) {
      eventBus.subscribe<WorkflowPayload>(eventType, async (event: DomainEvent<WorkflowPayload>) => {
        const payload = event.payload;
        await this.ingest({
          type: eventType,
          source: 'workflow',
          tenantId: payload.tenantId ?? event.metadata.tenantId,
          organizationId: payload.organizationId,
          conversationId: payload.conversationId,
          data: {
            workflowId: payload.workflowId,
            workflowName: payload.workflowName,
            triggerType: payload.triggerType,
            duration: payload.duration,
            error: payload.error,
          },
          metadata: {
            correlationId: event.metadata.correlationId,
            eventId: event.id,
          },
          timestamp: event.metadata.timestamp,
        });
      });
    }

    this.logger.info(`[workflow] Subscribed to ${WORKFLOW_EVENTS.length} workflow events`);
  }
}
