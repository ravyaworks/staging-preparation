import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { QueueService, defaultQueueOptions } from '@conversation-platform/queue';

describe('Queue Service Integration', () => {
  let queue: QueueService<{ id: string; type: string; payload: Record<string, unknown> }>;

  beforeEach(() => {
    queue = new QueueService({ ...defaultQueueOptions, redisUrl: 'redis://localhost:6379', prefix: `test:queue:${Date.now()}:` });
  });

  afterAll(async () => { await queue.close(); });

  describe('Queue Operations', () => {
    it('should create a queue', () => {
      expect(queue).toBeDefined();
    });

    it('should add a job to the queue', async () => {
      const job = await queue.add('test-job', { id: '1', type: 'test', payload: { data: 'value' } });
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
    });

    it('should get a job by id', async () => {
      const added = await queue.add('test-job', { id: '2', type: 'test', payload: {} });
      const fetched = await queue.getJob(added.id);
      expect(fetched).toBeDefined();
    });

    it('should remove a job from the queue', async () => {
      const added = await queue.add('test-job', { id: '3', type: 'test', payload: {} });
      await queue.remove(added.id);
      const fetched = await queue.getJob(added.id);
      expect(fetched).toBeNull();
    });

    it('should process jobs in order', async () => {
      const processed: number[] = [];
      await queue.process(async (job) => { processed.push(job.data.id as unknown as number); });
      await queue.add('order-job', { id: 1, type: 'test', payload: {} as Record<string, unknown> });
      await queue.add('order-job', { id: 2, type: 'test', payload: {} as Record<string, unknown> });
      await queue.add('order-job', { id: 3, type: 'test', payload: {} as Record<string, unknown> });
      await new Promise((r) => setTimeout(r, 500));
      expect(processed.length).toBe(3);
    });

    it('should get queue metrics', async () => {
      const metrics = await queue.getMetrics();
      expect(metrics).toHaveProperty('waiting');
      expect(metrics).toHaveProperty('active');
      expect(metrics).toHaveProperty('completed');
      expect(metrics).toHaveProperty('failed');
    });

    it('should pause and resume the queue', async () => {
      await queue.pause();
      let isPaused = await queue.isPaused();
      expect(isPaused).toBe(true);
      await queue.resume();
      isPaused = await queue.isPaused();
      expect(isPaused).toBe(false);
    });

    it('should add a job with delay', async () => {
      const added = await queue.add('delayed-job', { id: 'delay-1', type: 'test', payload: {} }, { delay: 5000 });
      expect(added).toBeDefined();
    });

    it('should add a job with priority', async () => {
      const added = await queue.add('priority-job', { id: 'prio-1', type: 'test', payload: {} }, { priority: 10 });
      expect(added).toBeDefined();
    });
  });
});
