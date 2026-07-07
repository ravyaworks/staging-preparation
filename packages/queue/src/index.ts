export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobHandler<T = unknown> {
  (job: Job<T>): Promise<void>;
}

export interface QueueAdapter {
  enqueue<T>(type: string, payload: T, options?: { priority?: JobPriority; delay?: number; maxAttempts?: number }): Promise<string>;
  dequeue<T>(queueName: string): Promise<Job<T> | null>;
  complete(jobId: string): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
  retry(jobId: string): Promise<void>;
  getStatus(jobId: string): Promise<JobStatus | null>;
  getStats(): Promise<{ pending: number; processing: number; failed: number; completed: number }>;
}

export interface QueueService {
  register<T>(type: string, handler: JobHandler<T>): void;
  dispatch<T>(type: string, payload: T, options?: { priority?: JobPriority; delay?: number; maxAttempts?: number }): Promise<string>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStats(): Promise<{ pending: number; processing: number; failed: number; completed: number }>;
}

export class InMemoryQueueAdapter implements QueueAdapter {
  private jobs: Map<string, Job> = new Map();

  async enqueue<T>(type: string, payload: T, options?: { priority?: JobPriority; delay?: number; maxAttempts?: number }): Promise<string> {
    const id = crypto.randomUUID();
    const job: Job<T> = {
      id,
      type,
      payload,
      status: 'pending',
      priority: options?.priority ?? 'normal',
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      scheduledAt: options?.delay ? new Date(Date.now() + options.delay) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job as Job);
    return id;
  }

  async dequeue<T>(_queueName: string): Promise<Job<T> | null> {
    for (const [id, job] of this.jobs) {
      if (job.status === 'pending' && (!job.scheduledAt || job.scheduledAt <= new Date())) {
        this.jobs.set(id, { ...job, status: 'processing', updatedAt: new Date() });
        return { ...job, status: 'processing' } as Job<T>;
      }
    }
    return null;
  }

  async complete(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, status: 'completed', updatedAt: new Date() });
    }
  }

  async fail(jobId: string, error: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      const attempts = job.attempts + 1;
      const status = attempts >= job.maxAttempts ? 'failed' : 'retrying';
      this.jobs.set(jobId, { ...job, status, attempts, lastError: error, updatedAt: new Date() });
    }
  }

  async retry(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, status: 'pending', updatedAt: new Date() });
    }
  }

  async getStatus(jobId: string): Promise<JobStatus | null> {
    return this.jobs.get(jobId)?.status ?? null;
  }

  async getStats(): Promise<{ pending: number; processing: number; failed: number; completed: number }> {
    const stats = { pending: 0, processing: 0, failed: 0, completed: 0 };
    for (const job of this.jobs.values()) {
      stats[job.status as keyof typeof stats]++;
    }
    return stats;
  }
}

export class QueueServiceImplementation implements QueueService {
  private handlers: Map<string, JobHandler> = new Map();
  private processing = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private adapter: QueueAdapter) {}

  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  async dispatch<T>(type: string, payload: T, options?: { priority?: JobPriority; delay?: number; maxAttempts?: number }): Promise<string> {
    return this.adapter.enqueue(type, payload, options);
  }

  async start(): Promise<void> {
    this.processing = true;
    this.timer = setInterval(() => this.processNext(), 1000);
  }

  async stop(): Promise<void> {
    this.processing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async getStats(): Promise<{ pending: number; processing: number; failed: number; completed: number }> {
    return this.adapter.getStats();
  }

  private async processNext(): Promise<void> {
    if (!this.processing) return;

    for (const type of this.handlers.keys()) {
      const job = await this.adapter.dequeue<unknown>(type);

      if (!job) continue;

      const handler = this.handlers.get(job.type);
      if (!handler) {
        await this.adapter.fail(job.id, `No handler registered for type: ${job.type}`);
        continue;
      }

      try {
        await handler(job);
        await this.adapter.complete(job.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.adapter.fail(job.id, errorMessage);
      }
    }
  }
}
