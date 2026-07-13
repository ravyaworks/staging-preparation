import type { Logger } from '@conversation-platform/logger';
import {
  getPrismaClient,
  OutreachJobRepository,
} from '@conversation-platform/database';
import {
  InMemoryQueueAdapter,
  QueueServiceImplementation,
} from '@conversation-platform/queue';
import type { OutreachSendPayload } from '../validators';

export interface OutreachSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface IOutreachSender {
  send(recipientPhone: string, message: string, metadata?: Record<string, unknown>): Promise<OutreachSendResult>;
}

export class MockWhatsAppSender implements IOutreachSender {
  constructor(private readonly logger: Logger) {}

  async send(recipientPhone: string, message: string, _metadata?: Record<string, unknown>): Promise<OutreachSendResult> {
    const delay = 50 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    const shouldFail = Math.random() < 0.05;
    if (shouldFail) {
      this.logger.warn({ recipientPhone }, 'Mock sender simulated failure');
      return {
        success: false,
        error: 'Simulated transient error',
        metadata: { simulated: true, delayMs: delay },
      };
    }

    this.logger.info({ recipientPhone, delayMs: delay }, 'Mock sender delivered');
    return {
      success: true,
      messageId: `mock_${crypto.randomUUID()}`,
      metadata: { simulated: true, delayMs: delay },
    };
  }
}

interface OutreachJobPayload {
  jobId: string;
  tenantId: string;
  recipientPhone: string;
  personalizedMessage: string;
  metadata?: Record<string, unknown>;
}

export interface OutreachService {
  enqueue(tenantId: string, data: OutreachSendPayload): Promise<{ jobId: string }>;
  getJob(jobId: string): Promise<{
    id: string;
    status: string;
    recipientName: string;
    recipientPhone: string;
    messageTemplate: string;
    personalizedMessage: string;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    senderResult: unknown;
    processedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null>;
  listJobs(tenantId: string): Promise<{
    items: Array<{
      id: string;
      status: string;
      recipientName: string;
      recipientPhone: string;
      messageTemplate: string;
      personalizedMessage: string;
      attempts: number;
      lastError: string | null;
      processedAt: string | null;
      createdAt: string;
    }>;
    total: number;
  }>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createOutreachService(logger: Logger, sender?: IOutreachSender): OutreachService {
  const prisma = getPrismaClient();
  const repo = new OutreachJobRepository(prisma);
  const actualSender = sender ?? new MockWhatsAppSender(logger);
  const queue = new QueueServiceImplementation(new InMemoryQueueAdapter());

  queue.register('outreach.send', async (job) => {
    const payload = job.payload as OutreachJobPayload;

    try {
      const result = await actualSender.send(
        payload.recipientPhone,
        payload.personalizedMessage,
        payload.metadata,
      );

      await repo.update(payload.jobId, {
        status: result.success ? 'completed' : 'failed',
        senderResult: result.metadata ? JSON.parse(JSON.stringify(result.metadata)) : { success: result.success },
        lastError: result.error ?? null,
        processedAt: new Date(),
        attempts: { increment: 1 },
      } as any);

      if (!result.success) {
        throw new Error(result.error ?? 'Send failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await repo.update(payload.jobId, {
        lastError: errorMessage,
        attempts: { increment: 1 },
      } as any);

      throw error;
    }
  });

  return {
    async enqueue(tenantId: string, data: OutreachSendPayload) {
      const dbJob = await repo.create({
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        messageTemplate: data.messageTemplate,
        personalizedMessage: data.personalizedMessage,
        metadata: data.metadata ?? {},
        status: 'pending',
      } as any);

      const payload: OutreachJobPayload = {
        jobId: dbJob.id,
        tenantId,
        recipientPhone: data.recipientPhone,
        personalizedMessage: data.personalizedMessage,
        metadata: data.metadata,
      };

      await queue.dispatch('outreach.send', payload, {
        maxAttempts: 3,
      });

      return { jobId: dbJob.id };
    },

    async getJob(jobId: string) {
      const job = await repo.findById(jobId);
      if (!job) return null;
      return {
        id: job.id,
        status: job.status,
        recipientName: job.recipientName,
        recipientPhone: job.recipientPhone,
        messageTemplate: job.messageTemplate,
        personalizedMessage: job.personalizedMessage,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        lastError: job.lastError,
        senderResult: job.senderResult,
        processedAt: job.processedAt?.toISOString() ?? null,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      };
    },

    async listJobs(tenantId: string) {
      const items = await repo.findByTenant(tenantId);
      const total = await repo.countByTenant(tenantId);
      return {
        items: items.map(job => ({
          id: job.id,
          status: job.status,
          recipientName: job.recipientName,
          recipientPhone: job.recipientPhone,
          messageTemplate: job.messageTemplate,
          personalizedMessage: job.personalizedMessage,
          attempts: job.attempts,
          lastError: job.lastError,
          processedAt: job.processedAt?.toISOString() ?? null,
          createdAt: job.createdAt.toISOString(),
        })),
        total,
      };
    },

    async start() {
      await queue.start();
      logger.info('Outreach queue started');
    },

    async stop() {
      await queue.stop();
      logger.info('Outreach queue stopped');
    },
  };
}
