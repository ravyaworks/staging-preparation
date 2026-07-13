import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { DeliveryEventData, DeliveryEventType, JobTimelineEntry } from './types'

export class DeliveryTracker {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async recordEvent(
    jobId: string,
    eventType: DeliveryEventType | string,
    currentStatus: string,
    previousStatus: string | null = null,
    options: {
      workerId?: string | null
      channel?: string | null
      metadata?: Record<string, unknown>
    } = {},
  ): Promise<DeliveryEventData> {
    const event = await this.prisma.deliveryEvent.create({
      data: {
        jobId,
        type: eventType,
        previousStatus,
        currentStatus,
        workerId: options.workerId ?? null,
        channel: options.channel ?? null,
        metadata: (options.metadata ?? {}) as any,
      },
    })

    this.logger.info(
      { jobId, eventType, previousStatus, currentStatus, workerId: options.workerId },
      `Delivery event: ${eventType}`,
    )

    return this.toEventData(event)
  }

  async recordTransition(
    jobId: string,
    fromStatus: string,
    toStatus: string,
    workerId?: string | null,
    channel?: string | null,
  ): Promise<DeliveryEventData> {
    const eventType = this.getEventTypeForTransition(fromStatus, toStatus)
    return this.recordEvent(jobId, eventType, toStatus, fromStatus, { workerId, channel })
  }

  async getJobTimeline(jobId: string): Promise<JobTimelineEntry[]> {
    const events = await this.prisma.deliveryEvent.findMany({
      where: { jobId },
      orderBy: { timestamp: 'asc' },
    })

    const entries: JobTimelineEntry[] = []
    for (let i = 0; i < events.length; i++) {
      const prev = i > 0 ? events[i - 1] : null
      const duration = prev ? events[i].timestamp.getTime() - prev.timestamp.getTime() : null
      entries.push({
        timestamp: events[i].timestamp,
        type: events[i].type,
        previousStatus: events[i].previousStatus,
        currentStatus: events[i].currentStatus,
        workerId: events[i].workerId,
        durationFromPreviousMs: duration,
      })
    }
    return entries
  }

  async getJobEvents(
    jobId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ events: DeliveryEventData[]; total: number }> {
    const [events, total] = await Promise.all([
      this.prisma.deliveryEvent.findMany({
        where: { jobId },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.deliveryEvent.count({ where: { jobId } }),
    ])

    return { events: events.map(e => this.toEventData(e)), total }
  }

  async getJobLatestEvent(jobId: string): Promise<DeliveryEventData | null> {
    const event = await this.prisma.deliveryEvent.findFirst({
      where: { jobId },
      orderBy: { timestamp: 'desc' },
    })
    return event ? this.toEventData(event) : null
  }

  private getEventTypeForTransition(from: string, to: string): string {
    if (from === 'pending' && to === 'queued') return 'job.queued'
    if (from === 'queued' && to === 'processing') return 'job.processing'
    if (from === 'processing' && to === 'sent') return 'job.sent'
    if (from === 'sent' && to === 'completed') return 'job.completed'
    if (from === 'processing' && to === 'failed') return 'job.failed'
    if (from === 'failed' && to === 'retrying') return 'job.retrying'
    if (from === 'retrying' && to === 'queued') return 'job.retry_scheduled'
    if (from === 'retrying' && to === 'dead_letter') return 'job.dead_letter'
    if (to === 'cancelled') return 'job.cancelled'
    return `job.${to}`
  }

  private toEventData(event: any): DeliveryEventData {
    return {
      id: event.id,
      jobId: event.jobId,
      type: event.type,
      previousStatus: event.previousStatus,
      currentStatus: event.currentStatus,
      timestamp: event.timestamp,
      workerId: event.workerId,
      channel: event.channel,
      metadata: (event.metadata ?? {}) as Record<string, unknown>,
    }
  }
}
