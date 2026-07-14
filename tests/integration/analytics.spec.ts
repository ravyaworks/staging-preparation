import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, MetricsCollector, ReportGenerator, AnalyticsEvent, TimeRange, MetricType } from '@conversation-platform/analytics';

describe('Analytics Integration', () => {
  let collector: MetricsCollector;
  let reportGenerator: ReportGenerator;
  let analytics: AnalyticsService;

  beforeEach(() => {
    collector = new MetricsCollector();
    reportGenerator = new ReportGenerator();
    analytics = new AnalyticsService(collector, reportGenerator);
  });

  describe('Event Tracking', () => {
    it('should track a single event', async () => {
      const event: AnalyticsEvent = { type: 'message.sent', tenantId: 'tenant-001', timestamp: new Date().toISOString(), properties: { channel: 'whatsapp', userId: 'user-001' } };
      await analytics.track(event);
      const stored = await analytics.getEvents({ tenantId: 'tenant-001', limit: 10 });
      expect(stored.length).toBe(1);
      expect(stored[0].type).toBe('message.sent');
    });

    it('should track multiple events', async () => {
      const events: AnalyticsEvent[] = Array.from({ length: 100 }, (_, i) => ({ type: i % 2 === 0 ? 'message.sent' : 'message.received' as 'message.sent' | 'message.received', tenantId: 'tenant-001', timestamp: new Date(Date.now() + i * 1000).toISOString(), properties: { index: i } }));
      for (const event of events) await analytics.track(event);
      const count = await analytics.count({ tenantId: 'tenant-001', eventType: 'message.sent' });
      expect(count).toBe(50);
    });

    it('should track event with tags', async () => {
      const event: AnalyticsEvent = { type: 'campaign.started', tenantId: 'tenant-001', timestamp: new Date().toISOString(), properties: {}, tags: ['campaign:123', 'source:api'] };
      await analytics.track(event);
      const events = await analytics.getEvents({ tenantId: 'tenant-001', limit: 10 });
      expect(events[0].tags).toContain('campaign:123');
    });
  });

  describe('Metrics Collection', () => {
    it('should record a counter metric', async () => {
      collector.increment('api.requests', { status: '200' });
      const value = collector.get('api.requests', { status: '200' });
      expect(value).toBe(1);
    });

    it('should record a gauge metric', async () => {
      collector.gauge('active.users', 42);
      const value = collector.get('active.users');
      expect(value).toBe(42);
    });

    it('should record a histogram metric', async () => {
      const values = [100, 200, 150, 300, 250];
      for (const v of values) collector.observe('response.time', v);
      const stats = collector.histogram('response.time');
      expect(stats?.count).toBe(5);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(300);
      expect(stats?.avg).toBe(200);
    });

    it('should record a duration metric', async () => {
      collector.startTimer('db.query', { query: 'select' });
      await new Promise((r) => setTimeout(r, 10));
      const duration = collector.endTimer('db.query', { query: 'select' });
      expect(duration).toBeGreaterThan(0);
    });

    it('should reset a metric', async () => {
      collector.increment('test.counter');
      collector.reset('test.counter');
      expect(collector.get('test.counter')).toBe(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate a summary report', async () => {
      for (let i = 0; i < 10; i++) await analytics.track({ type: 'message.sent', tenantId: 'tenant-001', timestamp: new Date().toISOString(), properties: {} });
      const report = await analytics.generateReport({ tenantId: 'tenant-001', timeRange: '24h' as TimeRange, metrics: ['total_messages', 'messages_sent'] });
      expect(report).toBeDefined();
      expect(report.metrics).toBeDefined();
    });

    it('should generate a trend report', async () => {
      const now = Date.now();
      for (let i = 0; i < 5; i++) await analytics.track({ type: 'conversation.started', tenantId: 'tenant-001', timestamp: new Date(now - i * 3600000).toISOString(), properties: { hour: i } });
      const report = await analytics.generateReport({ tenantId: 'tenant-001', timeRange: '7d' as TimeRange, metrics: ['conversations_started'], granularity: 'hour' });
      expect(report).toBeDefined();
    });
  });

  describe('Data Export and Retention', () => {
    it('should export events to CSV format', async () => {
      await analytics.track({ type: 'test.event', tenantId: 'tenant-001', timestamp: new Date().toISOString(), properties: { key: 'value' } });
      const csv = await analytics.export({ tenantId: 'tenant-001', format: 'csv' });
      expect(csv).toContain('type');
      expect(csv).toContain('test.event');
    });

    it('should purge events older than retention period', async () => {
      const oldDate = new Date(Date.now() - 100 * 86400000).toISOString();
      await analytics.track({ type: 'old.event', tenantId: 'tenant-001', timestamp: oldDate, properties: {} });
      const purged = await analytics.purge(90);
      expect(purged).toBe(1);
    });
  });

  describe('Real-time Dashboards', () => {
    it('should provide live event stream', async () => {
      const received: AnalyticsEvent[] = [];
      analytics.on('event', (event) => received.push(event));
      await analytics.track({ type: 'live.test', tenantId: 'tenant-001', timestamp: new Date().toISOString(), properties: {} });
      expect(received.length).toBe(1);
      expect(received[0].type).toBe('live.test');
    });

    it('should compute aggregate metrics', async () => {
      for (let i = 0; i < 5; i++) await analytics.track({ type: 'message.sent', tenantId: 'tenant-001', timestamp: new Date().toISOString(), properties: { channel: 'whatsapp' } });
      const aggregates = await analytics.aggregate('message.sent', '5m');
      expect(aggregates.count).toBe(5);
    });
  });
});
