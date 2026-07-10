import { describe, it, expect } from 'vitest';
import { ModelRegistry, getBuiltInModels, getModelsByProvider, findModel, HealthTracker } from '../index';

describe('ModelRegistry', () => {
  it('registers and retrieves models', () => {
    const reg = new ModelRegistry();
    const model = { id: 'custom-model', provider: 'openai' as const, name: 'Custom', capabilities: { streaming: true, functionCalling: false, vision: false, embedding: false, fineTuning: false, jsonMode: false }, contextWindow: 4096, maxOutputTokens: 1024, pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' } };
    reg.register(model);
    expect(reg.get('custom-model')).toBe(model);
    expect(reg.count).toBeGreaterThan(0);
  });

  it('getByProvider filters correctly', () => {
    const reg = new ModelRegistry();
    const openaiModels = reg.getByProvider('openai');
    expect(openaiModels.every(m => m.provider === 'openai')).toBe(true);
  });

  it('hasCapability checks model capabilities', () => {
    const reg = new ModelRegistry();
    const gpt4o = reg.get('gpt-4o');
    expect(gpt4o).toBeDefined();
    expect(reg.hasCapability('gpt-4o', 'vision')).toBe(true);
    expect(reg.hasCapability('gpt-4o', 'embedding')).toBe(false);
    expect(reg.hasCapability('nonexistent', 'streaming')).toBe(false);
  });

  it('remove and clear work', () => {
    const reg = new ModelRegistry();
    expect(reg.remove('nonexistent')).toBe(false);
    const count = reg.count;
    reg.clear();
    expect(reg.count).toBe(0);
  });
});

describe('getBuiltInModels', () => {
  it('returns a copy of all built-in models', () => {
    const models = getBuiltInModels();
    expect(models.length).toBeGreaterThan(20);
    expect(models[0]?.id).toBe('gpt-4o');
  });
});

describe('getModelsByProvider', () => {
  it('filters models by provider', () => {
    const openai = getModelsByProvider('openai');
    expect(openai.every(m => m.provider === 'openai')).toBe(true);
    expect(openai.length).toBe(5);
  });
});

describe('findModel', () => {
  it('finds a model by id', () => {
    expect(findModel('gpt-4o')?.name).toBe('GPT-4o');
    expect(findModel('nonexistent')).toBeUndefined();
  });
});

describe('HealthTracker', () => {
  it('records and retrieves health status', () => {
    const tracker = new HealthTracker();
    tracker.record({ provider: 'openai', healthy: true, latency: 100 });
    const result = tracker.get('openai');
    expect(result?.healthy).toBe(true);
    expect(result?.lastChecked).toBeInstanceOf(Date);
  });

  it('getHealthy and getUnhealthy filters', () => {
    const tracker = new HealthTracker();
    tracker.record({ provider: 'openai', healthy: true, latency: 50 });
    tracker.record({ provider: 'anthropic', healthy: false, latency: 200, error: 'down' });
    expect(tracker.getHealthy()).toHaveLength(1);
    expect(tracker.getUnhealthy()).toHaveLength(1);
    expect(tracker.isHealthy('openai')).toBe(true);
    expect(tracker.isHealthy('anthropic')).toBe(false);
    expect(tracker.isHealthy('gemini')).toBe(false);
  });

  it('clear resets all statuses', () => {
    const tracker = new HealthTracker();
    tracker.record({ provider: 'openai', healthy: true, latency: 0 });
    expect(tracker.getAll()).toHaveLength(1);
    tracker.clear();
    expect(tracker.getAll()).toHaveLength(0);
  });
});
