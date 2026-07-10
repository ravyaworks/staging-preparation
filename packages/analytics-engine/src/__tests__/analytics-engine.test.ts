import { describe, it, expect } from 'vitest';
import { AnalyticsEngine } from '../index';

describe('AnalyticsEngine', () => {
  it('track stores event', () => {
    const engine = new AnalyticsEngine();
    engine.track({ type: 'user.login', tenantId: 't1', userId: 'u1', source: 'web', data: {} });
    const results = engine.query({ tenantId: 't1' });
    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('user.login');
  });

  it('query filters by event type', () => {
    const engine = new AnalyticsEngine();
    engine.track({ type: 'user.login', tenantId: 't1', source: 'web', data: {} });
    engine.track({ type: 'user.activity', tenantId: 't1', source: 'web', data: {} });
    expect(engine.query({ eventTypes: ['user.login'] })).toHaveLength(1);
  });

  it('query filters by date range', () => {
    const engine = new AnalyticsEngine();
    engine.track({ type: 'user.login', tenantId: 't1', source: 'web', data: {} });
    const results = engine.query({ tenantId: 't1', startDate: new Date(Date.now() - 1000) });
    expect(results).toHaveLength(1);
  });

  it('aggregate returns counts', () => {
    const engine = new AnalyticsEngine();
    engine.track({ type: 'error.occurred', tenantId: 't1', source: 'app', data: { value: 1 } });
    engine.track({ type: 'error.occurred', tenantId: 't1', source: 'app', data: { value: 2 } });
    const agg = engine.aggregate('error.occurred', 'hour');
    expect(agg.count).toBe(2);
    expect(agg.sum).toBe(3);
  });

  it('trackMetric stores metric', () => {
    const engine = new AnalyticsEngine();
    engine.trackMetric({ name: 'cpu_usage', value: 75, labels: { host: 'server1' } });
    const metrics = engine.getMetrics('cpu_usage');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.value).toBe(75);
  });

  it('getConversationStats returns correct counts', () => {
    const engine = new AnalyticsEngine();
    engine.track({ type: 'conversation.created', tenantId: 't1', source: 'api', data: {} });
    engine.track({ type: 'conversation.message', tenantId: 't1', source: 'api', data: {} });
    engine.track({ type: 'conversation.completed', tenantId: 't1', source: 'api', data: {} });
    const stats = engine.getConversationStats('t1');
    expect(stats.total).toBe(1);
    expect(stats.messages).toBe(1);
    expect(stats.completed).toBe(1);
  });

  it('getTokenUsage returns totals by provider', () => {
    const engine = new AnalyticsEngine();
    engine.track({ type: 'tokens.consumed', tenantId: 't1', source: 'ai', data: { tokens: 100, provider: 'openai' } });
    engine.track({ type: 'tokens.consumed', tenantId: 't1', source: 'ai', data: { tokens: 50, provider: 'openai' } });
    const usage = engine.getTokenUsage('t1');
    expect(usage.total).toBe(150);
    expect(usage.byProvider.openai).toBe(150);
  });

  it('getErrorRate returns 0 for no errors', () => {
    const engine = new AnalyticsEngine();
    const rate = engine.getErrorRate('t1');
    expect(rate.total).toBe(0);
    expect(rate.rate).toBe(0);
  });
});
