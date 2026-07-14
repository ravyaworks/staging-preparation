import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@conversation-platform/logger';
import type { EventBus, DomainEvent } from '@conversation-platform/event-bus';
import type { AnalyticsEventData } from '../types';
import { BaseCollector } from './base.collector';

const QUEUE_EVENTS = [
  'worker.online',
  'worker.offline',
  'worker.heartbeat',
  'queue.overflow',
  'queue.drained',
] as const;

interface WorkerPayload {
  workerId?: string;
  tenantId?: string;
  queueName?: string;
  queueSize?: number;
  jobsProcessed?: number;
  status?: string;
}

export class QueueCollector extends BaseCollector {
  private lastPoll: Date;

  constructor(prisma: PrismaClient, logger: Logger, eventBus?: EventBus) {
    super(prisma, logger, eventBus);
    this.lastPoll = new Date();
  }

  getName(): string {
    return 'queue';
  }

  subscribe(eventBus: EventBus): void {
    this.eventBus = eventBus;

    for (const eventType of QUEUE_EVENTS) {
      eventBus.subscribe<WorkerPayload>(eventType, async (event: DomainEvent<WorkerPayload>) => {
        const payload = event.payload;
        await this.ingest({
          type: eventType,
          source: 'queue',
          tenantId: payload.tenantId ?? event.metadata.tenantId,
          data: {
            workerId: payload.workerId,
            queueName: payload.queueName,
            queueSize: payload.queueSize,
            jobsProcessed: payload.jobsProcessed,
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

    this.logger.info(`[queue] Subscribed to ${QUEUE_EVENTS.length} queue events`);
  }

  async poll(): Promise<void> {
    try {
      const workerMetrics = await this.prisma.workerMetric.findMany({
        where: {
          updatedAt: { gt: this.lastPoll },
        },
        select: {
          id: true,
          workerId: true,
          status: true,
          jobsProcessed: true,
          successCount: true,
          failureCount: true,
          averageProcessingMs: true,
          lastHeartbeatAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'asc' },
      });

      this.lastPoll = new Date();

      for (const worker of workerMetrics) {
        await this.ingest({
          type: 'worker.heartbeat',
          source: 'queue',
          data: {
            workerId: worker.workerId,
            status: worker.status,
            jobsProcessed: worker.jobsProcessed,
            successCount: worker.successCount,
            failureCount: worker.failureCount,
            averageProcessingMs: worker.averageProcessingMs,
            lastHeartbeatAt: worker.lastHeartbeatAt.toISOString(),
            polled: true,
          },
          value: worker.jobsProcessed,
          timestamp: worker.updatedAt,
        });
      }

      if (workerMetrics.length > 0) {
        this.logger.debug(`[queue] Polled ${workerMetrics.length} worker metrics`);
      }
    } catch (error) {
      this.logger.error('[queue] Failed to poll worker metrics', error);
    }
  }
}
