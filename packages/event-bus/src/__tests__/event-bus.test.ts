import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryEventBus } from '../index';

describe('InMemoryEventBus', () => {
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
  });

  it('publishes and delivers an event to a subscriber', async () => {
    const handler = vi.fn();
    bus.subscribe('user.created', handler);

    await bus.publish('user.created', { id: '123', email: 'test@test.com' });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]![0]!;
    expect(event.type).toBe('user.created');
    expect(event.payload).toEqual({ id: '123', email: 'test@test.com' });
    expect(event.metadata.timestamp).toBeInstanceOf(Date);
  });

  it('does not deliver to subscribers of other event types', async () => {
    const handler = vi.fn();
    bus.subscribe('user.created', handler);

    await bus.publish('user.deleted', { id: '123' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers for the same event', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.subscribe('user.created', handler1);
    bus.subscribe('user.created', handler2);

    await bus.publish('user.created', { id: '123' });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('allows unsubscribing', async () => {
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('user.created', handler);

    unsubscribe();
    await bus.publish('user.created', { id: '123' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('publishes multiple events', async () => {
    const handler = vi.fn();
    bus.subscribe('user.created', handler);

    await bus.publishMany([
      { type: 'user.created', payload: { id: '1' } },
      { type: 'user.created', payload: { id: '2' } },
    ]);

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('clears all subscribers', async () => {
    const handler = vi.fn();
    bus.subscribe('user.created', handler);

    bus.clear();
    await bus.publish('user.created', { id: '123' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('attaches metadata to events', async () => {
    const handler = vi.fn();
    bus.subscribe('test.event', handler);

    await bus.publish('test.event', { value: 42 }, { tenantId: 'tenant-1', userId: 'user-1', correlationId: 'corr-1' });

    const event = handler.mock.calls[0]![0]!;
    expect(event.metadata.tenantId).toBe('tenant-1');
    expect(event.metadata.userId).toBe('user-1');
    expect(event.metadata.correlationId).toBe('corr-1');
    expect(event.metadata.version).toBe(1);
  });

  it('handles subscriber errors gracefully', async () => {
    const failingHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const goodHandler = vi.fn();
    bus.subscribe('test.event', failingHandler);
    bus.subscribe('test.event', goodHandler);

    await expect(bus.publish('test.event', {})).resolves.not.toThrow();
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });
});
