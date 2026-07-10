export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  tenantId: string;
  userId?: string;
  source: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type AnalyticsEventType =
  | 'conversation.created'
  | 'conversation.completed'
  | 'conversation.message'
  | 'workflow.executed'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'knowledge.accessed'
  | 'knowledge.created'
  | 'knowledge.searched'
  | 'tool.executed'
  | 'tool.completed'
  | 'tool.failed'
  | 'provider.used'
  | 'tokens.consumed'
  | 'latency.measured'
  | 'error.occurred'
  | 'user.login'
  | 'user.activity'
  | 'tenant.activity'
  | 'business.metric';

export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface AnalyticsAggregation {
  eventType: AnalyticsEventType;
  count: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  period: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsQuery {
  eventTypes?: AnalyticsEventType[];
  tenantId?: string;
  userId?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
  period?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
}

export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private metrics: Metric[] = [];

  track(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: `aev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };
    this.events.push(analyticsEvent);
  }

  trackMetric(metric: Omit<Metric, 'timestamp'>): void {
    this.metrics.push({ ...metric, timestamp: new Date() });
  }

  query(query: AnalyticsQuery): AnalyticsEvent[] {
    let results = [...this.events];

    if (query.eventTypes && query.eventTypes.length > 0) {
      results = results.filter(e => query.eventTypes!.includes(e.type));
    }
    if (query.tenantId) {
      results = results.filter(e => e.tenantId === query.tenantId);
    }
    if (query.userId) {
      results = results.filter(e => e.userId === query.userId);
    }
    if (query.source) {
      results = results.filter(e => e.source === query.source);
    }
    if (query.startDate) {
      results = results.filter(e => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      results = results.filter(e => e.timestamp <= query.endDate!);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;
    return results.slice(offset, offset + limit);
  }

  aggregate(eventType: AnalyticsEventType, period: 'hour' | 'day' | 'week' | 'month'): AnalyticsAggregation {
    const relevantEvents = this.events.filter(e => e.type === eventType);
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);

    const periodEvents = relevantEvents.filter(e => (now - e.timestamp.getTime()) <= periodMs);
    const values = periodEvents.map(e => e.data.value as number).filter(v => typeof v === 'number');

    return {
      eventType,
      count: periodEvents.length,
      sum: values.length > 0 ? values.reduce((a, b) => a + b, 0) : undefined,
      avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : undefined,
      min: values.length > 0 ? Math.min(...values) : undefined,
      max: values.length > 0 ? Math.max(...values) : undefined,
      period,
    };
  }

  getMetrics(name?: string): Metric[] {
    if (name) return this.metrics.filter(m => m.name === name);
    return [...this.metrics];
  }

  getConversationStats(tenantId: string): { total: number; active: number; completed: number; messages: number } {
    const convEvents = this.events.filter(e =>
      e.tenantId === tenantId && e.type.startsWith('conversation.')
    );
    return {
      total: convEvents.filter(e => e.type === 'conversation.created').length,
      active: convEvents.filter(e => e.type === 'conversation.created').length - convEvents.filter(e => e.type === 'conversation.completed').length,
      completed: convEvents.filter(e => e.type === 'conversation.completed').length,
      messages: convEvents.filter(e => e.type === 'conversation.message').length,
    };
  }

  getTokenUsage(tenantId: string): { total: number; byProvider: Record<string, number> } {
    const tokenEvents = this.events.filter(e =>
      e.tenantId === tenantId && e.type === 'tokens.consumed'
    );
    const byProvider: Record<string, number> = {};
    let total = 0;
    for (const ev of tokenEvents) {
      const tokens = (ev.data.tokens as number) ?? 0;
      const provider = (ev.data.provider as string) ?? 'unknown';
      total += tokens;
      byProvider[provider] = (byProvider[provider] ?? 0) + tokens;
    }
    return { total, byProvider };
  }

  getErrorRate(tenantId: string): { total: number; errors: number; rate: number } {
    const allEvents = this.events.filter(e => e.tenantId === tenantId);
    const errorEvents = allEvents.filter(e => e.type === 'error.occurred');
    return {
      total: allEvents.length,
      errors: errorEvents.length,
      rate: allEvents.length > 0 ? errorEvents.length / allEvents.length : 0,
    };
  }

  private getPeriodMs(period: 'hour' | 'day' | 'week' | 'month'): number {
    switch (period) {
      case 'hour': return 3600000;
      case 'day': return 86400000;
      case 'week': return 604800000;
      case 'month': return 2592000000;
    }
  }
}
