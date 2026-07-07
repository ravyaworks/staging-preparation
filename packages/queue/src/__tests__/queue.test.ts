import { describe, it, expect } from 'vitest';
import { InMemoryQueueAdapter } from '../index';

describe('InMemoryQueueAdapter', () => {
  let adapter: InMemoryQueueAdapter;

  beforeEach(() => {
    adapter = new InMemoryQueueAdapter();
  });

  it('enqueues a job and returns an id', async () => {
    const id = await adapter.enqueue('test', { foo: 'bar' });
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('dequeues a pending job', async () => {
    await adapter.enqueue('test', { foo: 'bar' });
    const job = await adapter.dequeue('test');
    expect(job).not.toBeNull();
    expect(job!.type).toBe('test');
    expect(job!.payload).toEqual({ foo: 'bar' });
    expect(job!.status).toBe('processing');
  });

  it('completes a job', async () => {
    const id = await adapter.enqueue('test', {});
    await adapter.dequeue('test');
    await adapter.complete(id);
    const status = await adapter.getStatus(id);
    expect(status).toBe('completed');
  });

  it('fails a job and retries', async () => {
    const id = await adapter.enqueue('test', {}, { maxAttempts: 3 });
    await adapter.dequeue('test');
    await adapter.fail(id, 'Something went wrong');
    const statusAfterFail = await adapter.getStatus(id);
    expect(statusAfterFail).toBe('retrying');

    await adapter.retry(id);
    const statusAfterRetry = await adapter.getStatus(id);
    expect(statusAfterRetry).toBe('pending');
  });

  it('marks job as failed after max attempts', async () => {
    const id = await adapter.enqueue('test', {}, { maxAttempts: 1 });
    await adapter.dequeue('test');
    await adapter.fail(id, 'Fatal error');
    const status = await adapter.getStatus(id);
    expect(status).toBe('failed');
  });

  it('returns null when no pending jobs', async () => {
    const job = await adapter.dequeue('test');
    expect(job).toBeNull();
  });

  it('returns correct stats', async () => {
    const id1 = await adapter.enqueue('test', {});
    const id2 = await adapter.enqueue('test', {});
    await adapter.dequeue('test');
    await adapter.complete(id1);

    const stats = await adapter.getStats();
    expect(stats.pending).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(0);
  });

  it('supports delayed jobs', async () => {
    const id = await adapter.enqueue('test', {}, { delay: 10000 });
    const noJob = await adapter.dequeue('test');
    expect(noJob).toBeNull();

    const delayedJob = await adapter.dequeue('test');
    if (delayedJob) {
      expect(delayedJob.id).toBe(id);
    }
  });
});
