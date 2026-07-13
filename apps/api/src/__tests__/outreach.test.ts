import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Logger } from '@conversation-platform/logger';
import { MockWhatsAppSender, createOutreachService } from '../services/outreach.service';
import type { IOutreachSender } from '../services/outreach.service';

vi.mock('@conversation-platform/database', () => {
  const jobs: Record<string, any> = {};
  let counter = 0;

  return {
    getPrismaClient: () => ({
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      $disconnect: vi.fn(),
      outreachJob: {
        findUnique: vi.fn().mockImplementation(({ where: { id } }: any) => jobs[id] ?? null),
        findMany: vi.fn().mockImplementation(() => Promise.resolve(Object.values(jobs))),
        create: vi.fn().mockImplementation((data: any) => {
          counter++;
          const id = `job_${counter}`;
          const job = { id, ...data.data, status: 'pending', attempts: 0, maxAttempts: 3, createdAt: new Date(), updatedAt: new Date() };
          jobs[id] = job;
          return job;
        }),
        update: vi.fn().mockImplementation(({ where: { id }, data }: any) => {
          if (jobs[id]) jobs[id] = { ...jobs[id], ...data, updatedAt: new Date() };
          return jobs[id] ?? null;
        }),
        count: vi.fn().mockImplementation(() => Promise.resolve(Object.keys(jobs).length)),
      },
    }),
    PrismaClient: vi.fn(),
    OutreachJobRepository: class {
      constructor(_prisma: any) {}
      findById = vi.fn().mockImplementation((id: string) => jobs[id] ?? null);
      findByTenant = vi.fn().mockImplementation(() => Promise.resolve(Object.values(jobs)));
      create = vi.fn().mockImplementation((data: any) => {
        counter++;
        const id = `job_${counter}`;
        const job = { id, ...data, status: 'pending', attempts: 0, maxAttempts: 3, createdAt: new Date(), updatedAt: new Date() };
        jobs[id] = job;
        return job;
      });
      update = vi.fn().mockImplementation((id: string, data: any) => {
        if (jobs[id]) jobs[id] = { ...jobs[id], ...data, updatedAt: new Date() };
        return jobs[id] ?? null;
      });
      countByTenant = vi.fn().mockImplementation(() => Promise.resolve(Object.keys(jobs).length));
    },
    BaseRepository: class {
      constructor(_prisma: any) {}
    },
  };
});

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnValue({} as Logger),
  setLevel: vi.fn(),
  getLevel: vi.fn().mockReturnValue('info'),
};

describe('MockWhatsAppSender', () => {
  let sender: MockWhatsAppSender;

  beforeEach(() => {
    vi.clearAllMocks();
    sender = new MockWhatsAppSender(mockLogger);
  });

  it('returns success with a messageId', async () => {
    const result = await sender.send('+1234567890', 'Hello from test');
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.messageId).toMatch(/^mock_/);
    expect(result.metadata).toBeDefined();
    expect((result.metadata as any)?.simulated).toBe(true);
  });

  it('accepts metadata argument', async () => {
    const meta = { campaign: 'test', userId: 'u1' };
    const result = await sender.send('+1234567890', 'Hello', meta);
    expect(result.success).toBe(true);
  });

  it('simulates failures probabilistically', { timeout: 15000 }, async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 50; i++) {
      const result = await sender.send('+1234567890', 'Hello');
      results.push(result.success);
    }
    const failures = results.filter(r => !r).length;
    expect(failures).toBeGreaterThan(0);
    expect(failures).toBeLessThan(15);
  });
});

describe('OutreachService', () => {
  let service: ReturnType<typeof createOutreachService>;

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('enqueue returns a job ID', async () => {
    const mockSender: IOutreachSender = {
      send: vi.fn().mockResolvedValue({ success: true, messageId: 'mock_m1' }),
    };

    service = createOutreachService(mockLogger, mockSender);
    await service.start();

    const result = await service.enqueue('tenant_1', {
      recipientName: 'John Doe',
      recipientPhone: '+1234567890',
      messageTemplate: 'Hi {{name}}, check out our new product!',
      personalizedMessage: 'Hi John, check out our new product!',
    });

    expect(result.jobId).toBeDefined();
    expect(result.jobId).toMatch(/^job_\d+$/);

    await service.stop();
  });

  it('getJob returns null for non-existent job', async () => {
    service = createOutreachService(mockLogger);
    const job = await service.getJob('non-existent-id');
    expect(job).toBeNull();
  });

  it('listJobs returns results', async () => {
    service = createOutreachService(mockLogger);
    const result = await service.listJobs('tenant_1');
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });
});
