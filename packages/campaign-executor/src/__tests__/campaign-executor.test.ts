import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CampaignExecutor } from '../campaign-executor'
import { ExecutionError } from '../types'
import type { IOutreachSender } from '../types'

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
  setLevel: vi.fn(),
  getLevel: vi.fn().mockReturnValue('info'),
}

const mockSender: IOutreachSender = {
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
}

const executorConfig = {
  queuePollIntervalMs: 500,
  defaultRetryCount: 3,
  defaultRetryDelaysMs: [30000, 120000, 300000],
  defaultRateLimitPerMinute: 30,
  defaultRateLimitPerHour: 500,
  defaultMaxConcurrent: 10,
  defaultDelayBetweenJobsMs: 200,
  workerHeartbeatIntervalMs: 5000,
  workerStaleTimeoutMs: 30000,
  schedulerTickIntervalMs: 2000,
  defaultTimezone: 'UTC',
}

function createPrismaMock(initial: { campaigns?: any[], businesses?: any[], jobs?: any[], analytics?: any[] }) {
  const campaigns = [...(initial.campaigns ?? [])]
  const businesses = [...(initial.businesses ?? [])]
  const jobs = [...(initial.jobs ?? [])]
  const analytics = [...(initial.analytics ?? [])]

  const findCampaign = (id: string, include?: any) => {
    const c = campaigns.find((x: any) => x.id === id) ?? null
    if (!c) return null
    if (include?.businesses) {
      c.businesses = businesses.filter((b: any) => b.campaignId === id)
    }
    if (include?.statistics) {
      c.statistics = analytics.filter((a: any) => a.campaignId === id)
    }
    return c
  }

  return {
    campaign: {
      findUnique: vi.fn(({ where, include }: any) => findCampaign(where.id, include)),
      update: vi.fn(({ where, data }: any) => {
        const idx = campaigns.findIndex((c: any) => c.id === where.id)
        if (idx >= 0) {
          Object.assign(campaigns[idx], data)
          return campaigns[idx]
        }
        return null
      }),
    },
    campaignLog: {
      create: vi.fn(({ data }: any) => ({ id: 'log-1', ...data })),
    },
    outreachJob: {
      create: vi.fn(({ data }: any) => {
        const job = { id: `job-${jobs.length + 1}`, ...data, createdAt: new Date(), updatedAt: new Date(), attempts: 0, maxAttempts: executorConfig.defaultRetryCount, recipientName: data.recipientName ?? '', recipientPhone: data.recipientPhone ?? '', campaignId: data.campaign?.connect?.id ?? null, messageTemplate: data.messageTemplate ?? null, personalizedMessage: data.personalizedMessage ?? null, metadata: data.metadata ?? {}, lastError: null, processedAt: null, scheduledAt: data.scheduledAt ?? null, lockedAt: null, lockedBy: null }
        jobs.push(job)
        return job
      }),
      findUnique: vi.fn(({ where }: any) => jobs.find((j: any) => j.id === where.id) ?? null),
      findMany: vi.fn(({ where, orderBy, take, select }: any) => {
        let results = [...jobs]
        if (where) {
          for (const key of Object.keys(where)) {
            if (where[key] && typeof where[key] === 'object' && !Array.isArray(where[key])) {
              for (const op of Object.keys(where[key])) {
                if (op === 'lte') {
                  results = results.filter((j: any) => j[key] !== null && j[key] <= where[key][op])
                } else if (op === 'in') {
                  results = results.filter((j: any) => where[key][op].includes(j[key]))
                } else if (op === 'not') {
                  results = results.filter((j: any) => j[key] !== where[key][op])
                }
              }
            } else {
              results = results.filter((j: any) => j[key] === where[key])
            }
          }
        }
        if (orderBy?.updatedAt === 'desc') {
          results.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        }
        if (take) results = results.slice(0, take)
        if (select) {
          results = results.map((j: any) => {
            const out: Record<string, any> = {}
            for (const key of Object.keys(select)) {
              out[key] = j[key]
            }
            return out
          })
        }
        return results
      }),
      count: vi.fn(({ where }: any) => {
        let results = [...jobs]
        if (where) {
          for (const key of Object.keys(where)) {
            if (where[key] && typeof where[key] === 'object' && !Array.isArray(where[key])) {
              for (const op of Object.keys(where[key])) {
                if (op === 'lte') {
                  results = results.filter((j: any) => j[key] !== null && j[key] <= where[key][op])
                }
              }
            } else {
              results = results.filter((j: any) => j[key] === where[key])
            }
          }
        }
        return results.length
      }),
      update: vi.fn(({ where, data }: any) => {
        const idx = jobs.findIndex((j: any) => j.id === where.id)
        if (idx >= 0) {
          Object.assign(jobs[idx], data)
          return jobs[idx]
        }
        return null
      }),
      updateMany: vi.fn(({ where, data }: any) => {
        let count = 0
        for (const j of jobs) {
          let match = true
          for (const key of Object.keys(where)) {
            if (where[key] && typeof where[key] === 'object' && !Array.isArray(where[key])) {
              for (const op of Object.keys(where[key])) {
                if (op === 'in') {
                  if (!where[key][op].includes(j[key])) { match = false; break }
                } else if (op === 'not') {
                  if (j[key] === where[key][op]) { match = false; break }
                }
              }
              if (!match) break
            } else {
              if (j[key] !== where[key]) { match = false; break }
            }
          }
          if (match) {
            Object.assign(j, data)
            count++
          }
        }
        return { count }
      }),
    },
    campaignBusiness: {
      findMany: vi.fn(),
      update: vi.fn(({ where, data }: any) => {
        const idx = businesses.findIndex((b: any) => b.id === where.id)
        if (idx >= 0) {
          businesses[idx] = { ...businesses[idx], ...data }
          return businesses[idx]
        }
        return null
      }),
      updateMany: vi.fn(({ where, data }: any) => {
        let count = 0
        for (const b of businesses) {
          let match = true
          for (const key of Object.keys(where)) {
            if (where[key] && typeof where[key] === 'object' && !Array.isArray(where[key])) {
              for (const op of Object.keys(where[key])) {
                if (op === 'in') {
                  if (!where[key][op].includes(b[key])) { match = false; break }
                }
              }
              if (!match) break
            } else {
              if (b[key] !== where[key]) { match = false; break }
            }
          }
          if (match) {
            Object.assign(b, data)
            count++
          }
        }
        return { count }
      }),
    },
    campaignStatistics: {
      upsert: vi.fn(({ where, create, update }: any) => {
        const existing = analytics.find((a: any) => a.campaignId === where.campaignId)
        if (existing) {
          for (const key of Object.keys(update)) {
            if (typeof update[key] === 'object' && update[key] !== null && 'increment' in update[key]) {
              existing[key] = (existing[key] ?? 0) + update[key].increment
            } else {
              existing[key] = update[key]
            }
          }
          return existing
        }
        analytics.push(create)
        return create
      }),
    },
    $transaction: vi.fn(async (cb: any) => cb({
      outreachJob: {
        create: vi.fn(({ data }: any) => {
          const job = { id: `tx-job-${jobs.length + 1}`, ...data, createdAt: new Date(), updatedAt: new Date(), attempts: 0, maxAttempts: executorConfig.defaultRetryCount }
          jobs.push(job)
          return job
        }),
        update: vi.fn(({ where, data }: any) => {
          const idx = jobs.findIndex((j: any) => j.id === where.id)
          if (idx >= 0) { jobs[idx] = { ...jobs[idx], ...data }; return jobs[idx] }
          return null
        }),
        findFirst: vi.fn(({ where, orderBy }: any) => {
          let results = [...jobs]
          if (where) {
            for (const key of Object.keys(where)) {
              if (where[key] && typeof where[key] === 'object' && !Array.isArray(where[key])) {
                for (const op of Object.keys(where[key])) {
                  if (op === 'equals') results = results.filter((j: any) => j[key] === where[key][op])
                  else if (op === 'not') results = results.filter((j: any) => j[key] !== where[key][op])
                  else if (op === 'lte') results = results.filter((j: any) => j[key] !== null && j[key] <= where[key][op])
                }
              } else {
                results = results.filter((j: any) => j[key] === where[key])
              }
            }
          }
          if (orderBy?.createdAt) {
            results.sort((a: any, b: any) => orderBy.createdAt === 'desc' ? b.createdAt.getTime() - a.createdAt.getTime() : a.createdAt.getTime() - b.createdAt.getTime())
          }
          return results[0] ?? null
        }),
      },
    })),
    $disconnect: vi.fn(),
    _getJobs: () => jobs,
    _getCampaigns: () => campaigns,
  }
}

describe('CampaignExecutor', () => {
  let executor: CampaignExecutor
  let prisma: ReturnType<typeof createPrismaMock>

  beforeEach(() => {
    vi.clearAllMocks()
    prisma = createPrismaMock({
      campaigns: [{
        id: 'camp-1',
        name: 'Test Campaign',
        channel: 'whatsapp',
        status: 'ready',
        organizationId: 'org-1',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        deletedAt: null,
        description: null,
      }],
      businesses: [
        { id: 'biz-1', campaignId: 'camp-1', businessName: 'Biz 1', phone: '+12345678901', personalizedMessage: 'Hello {{businessName}}', status: 'pending', createdAt: new Date(), updatedAt: new Date(), outreachJobId: null },
        { id: 'biz-2', campaignId: 'camp-1', businessName: 'Biz 2', phone: '+12345678902', personalizedMessage: 'Hello {{businessName}}', status: 'pending', createdAt: new Date(), updatedAt: new Date(), outreachJobId: null },
      ],
      analytics: [],
    })
    executor = new CampaignExecutor(prisma as any, mockSender, executorConfig, mockLogger)
  })

  describe('executeCampaign', () => {
    it('should create outreach jobs and set campaign to running', async () => {
      const result = await executor.executeCampaign('camp-1', {})
      expect(result.jobsCreated).toBe(2)
      const campaigns = prisma._getCampaigns()
      expect(campaigns.find((c: any) => c.id === 'camp-1').status).toBe('running')
      expect(prisma._getJobs().length).toBe(2)
    })

    it('should throw if campaign is not in ready status', async () => {
      const campaigns = prisma._getCampaigns()
      const c = campaigns.find((x: any) => x.id === 'camp-1')
      c.status = 'draft'
      await expect(executor.executeCampaign('camp-1', {})).rejects.toThrow(ExecutionError)
    })

    it('should throw if campaign not found', async () => {
      await expect(executor.executeCampaign('nonexistent', {})).rejects.toThrow(ExecutionError)
    })
  })

  describe('pauseCampaign', () => {
    it('should set campaign to paused', async () => {
      const campaigns = prisma._getCampaigns()
      campaigns.find((c: any) => c.id === 'camp-1').status = 'running'
      await executor.pauseCampaign('camp-1')
      expect(campaigns.find((c: any) => c.id === 'camp-1').status).toBe('paused')
      expect(prisma.campaignLog.create).toHaveBeenCalled()
    })

    it('should throw if campaign not running', async () => {
      await expect(executor.pauseCampaign('camp-1')).rejects.toThrow(ExecutionError)
    })
  })

  describe('resumeCampaign', () => {
    it('should set paused campaign to running', async () => {
      const campaigns = prisma._getCampaigns()
      campaigns.find((c: any) => c.id === 'camp-1').status = 'paused'
      await executor.resumeCampaign('camp-1')
      expect(campaigns.find((c: any) => c.id === 'camp-1').status).toBe('running')
      expect(prisma.campaignLog.create).toHaveBeenCalled()
    })

    it('should throw if campaign not paused', async () => {
      await expect(executor.resumeCampaign('camp-1')).rejects.toThrow(ExecutionError)
    })
  })

  describe('cancelCampaign', () => {
    it('should set campaign to cancelled', async () => {
      const campaigns = prisma._getCampaigns()
      campaigns.find((c: any) => c.id === 'camp-1').status = 'running'
      await executor.cancelCampaign('camp-1')
      expect(campaigns.find((c: any) => c.id === 'camp-1').status).toBe('cancelled')
      expect(prisma.campaignLog.create).toHaveBeenCalled()
    })
  })

  describe('retryJob', () => {
    it('should retry a failed job', async () => {
      prisma._getJobs().push({
        id: 'job-1', campaignId: 'camp-1', status: 'failed', attempts: 1,
        to: '+12345678901', message: 'Hello', sender: 'whatsapp',
        metadata: {}, createdAt: new Date(), updatedAt: new Date(),
        lastError: null, processedAt: null, recipientName: 'Biz 1',
        recipientPhone: '+12345678901', messageTemplate: null,
        personalizedMessage: null, maxAttempts: 3, scheduledAt: null,
        lockedAt: null, lockedBy: null,
      } as any)
      await executor.retryJob('job-1')
      const updated = prisma._getJobs().find((j: any) => j.id === 'job-1')
      expect(updated.status).toBe('queued')
    })

    it('should throw if job not found', async () => {
      await expect(executor.retryJob('nonexistent')).rejects.toThrow(ExecutionError)
    })
  })

  describe('skipJob', () => {
    it('should skip a job', async () => {
      prisma._getJobs().push({
        id: 'job-1', campaignId: 'camp-1', status: 'queued',
        to: '+12345678901', message: 'Hello', sender: 'whatsapp',
        metadata: {}, createdAt: new Date(), updatedAt: new Date(),
        lastError: null, processedAt: null, recipientName: 'Biz 1',
        recipientPhone: '+12345678901', messageTemplate: null,
        personalizedMessage: null, maxAttempts: 3, scheduledAt: null,
        lockedAt: null, lockedBy: null,
      } as any)
      await executor.skipJob('job-1')
      const updated = prisma._getJobs().find((j: any) => j.id === 'job-1')
      expect(updated.status).toBe('cancelled')
    })
  })

  describe('retryFailedJobs', () => {
    it('should retry all failed jobs for a campaign', async () => {
      prisma._getJobs().push(
        { id: 'job-1', campaignId: 'camp-1', status: 'failed', attempts: 1, to: '+1', message: 'Hi', sender: 'whatsapp', metadata: {}, createdAt: new Date(), updatedAt: new Date(), lastError: 'err', processedAt: null, recipientName: 'A', recipientPhone: '+1', messageTemplate: null, personalizedMessage: null, maxAttempts: 3, scheduledAt: null, lockedAt: null, lockedBy: null },
        { id: 'job-2', campaignId: 'camp-1', status: 'failed', attempts: 1, to: '+2', message: 'Hi', sender: 'whatsapp', metadata: {}, createdAt: new Date(), updatedAt: new Date(), lastError: 'err', processedAt: null, recipientName: 'B', recipientPhone: '+2', messageTemplate: null, personalizedMessage: null, maxAttempts: 3, scheduledAt: null, lockedAt: null, lockedBy: null },
        { id: 'job-3', campaignId: 'camp-1', status: 'completed', attempts: 1, to: '+3', message: 'Hi', sender: 'whatsapp', metadata: {}, createdAt: new Date(), updatedAt: new Date(), lastError: null, processedAt: null, recipientName: 'C', recipientPhone: '+3', messageTemplate: null, personalizedMessage: null, maxAttempts: 3, scheduledAt: null, lockedAt: null, lockedBy: null },
      )
      const count = await executor.retryFailedJobs('camp-1')
      expect(count).toBe(2)
    })
  })

  describe('getCampaignProgress', () => {
    it('should return progress for a campaign', async () => {
      const progress = await executor.getCampaignProgress('camp-1')
      expect(progress).not.toBeNull()
      expect(progress!.campaignId).toBe('camp-1')
      expect(progress!.total).toBeGreaterThanOrEqual(0)
    })

    it('should return null for nonexistent campaign', async () => {
      const result = await executor.getCampaignProgress('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getQueueStatus', () => {
    it('should return queue counts', async () => {
      prisma._getJobs().push(
        { id: 'j1', status: 'queued', to: '+1', message: 'Hi', sender: 'whatsapp', metadata: {}, createdAt: new Date(), updatedAt: new Date(), campaignId: 'camp-1', recipientName: 'A', recipientPhone: '+1', messageTemplate: null, personalizedMessage: null, maxAttempts: 3, lastError: null, processedAt: null, scheduledAt: null, lockedAt: null, lockedBy: null },
        { id: 'j2', status: 'completed', to: '+2', message: 'Hi', sender: 'whatsapp', metadata: {}, createdAt: new Date(), updatedAt: new Date(), campaignId: 'camp-1', recipientName: 'B', recipientPhone: '+2', messageTemplate: null, personalizedMessage: null, maxAttempts: 3, lastError: null, processedAt: null, scheduledAt: null, lockedAt: null, lockedBy: null },
        { id: 'j3', status: 'failed', to: '+3', message: 'Hi', sender: 'whatsapp', metadata: {}, createdAt: new Date(), updatedAt: new Date(), campaignId: 'camp-1', recipientName: 'C', recipientPhone: '+3', messageTemplate: null, personalizedMessage: null, maxAttempts: 3, lastError: null, processedAt: null, scheduledAt: null, lockedAt: null, lockedBy: null },
      )
      const status = await executor.getQueueStatus()
      expect(status.queued).toBe(1)
      expect(status.completed).toBe(1)
      expect(status.failed).toBe(1)
    })
  })

  describe('getDeadLetterQueue', () => {
    it('should return dead letter entries', async () => {
      prisma._getJobs().push({
        id: 'j1', campaignId: 'camp-1', status: 'dead_letter', attempts: 3, lastError: 'Max retries',
        to: '+1', message: 'Hi', sender: 'whatsapp', metadata: {}, createdAt: new Date(), updatedAt: new Date(),
        recipientName: 'Biz 1', recipientPhone: '+12345678901', messageTemplate: null, personalizedMessage: null,
        maxAttempts: 3, processedAt: new Date(), scheduledAt: null, lockedAt: null, lockedBy: null,
      } as any)
      const entries = await executor.getDeadLetterQueue()
      expect(entries).toHaveLength(1)
      expect(entries[0].jobId).toBe('j1')
    })
  })

  describe('getWorkers', () => {
    it('should return empty array when not started', () => {
      expect(executor.getWorkers()).toEqual([])
    })
  })

  describe('getSchedulerState', () => {
    it('should return scheduler state', () => {
      const state = executor.getSchedulerState()
      expect(state.isRunning).toBe(false)
    })
  })

  describe('start/stop', () => {
    it('should start and stop without error', async () => {
      await executor.start()
      expect(executor.getIsStarted()).toBe(true)
      await executor.stop()
      expect(executor.getIsStarted()).toBe(false)
    })
  })
})
