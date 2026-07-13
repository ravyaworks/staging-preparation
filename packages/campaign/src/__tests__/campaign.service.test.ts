import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CampaignService } from '../services/campaign.service'
import { CampaignError } from '../types'

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

const baseCampaign = {
  id: 'camp-1',
  name: 'Test Campaign',
  description: null,
  channel: 'whatsapp',
  status: 'draft',
  organizationId: 'org-1',
  createdBy: 'user-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  startedAt: null,
  completedAt: null,
  deletedAt: null,
}

function createMockPrisma() {
  const mockDb: Record<string, any> = {}

  function store(table: string, data: any) {
    const arr = (mockDb[table] ??= [])
    const existing = arr.findIndex((r: any) => r.id === data.id)
    if (existing >= 0) arr[existing] = { ...arr[existing], ...data }
    else arr.push(data)
    return data
  }

  function findById(table: string, id: string) {
    const arr = (mockDb[table] ??= [])
    return arr.find((r: any) => r.id === id) ?? null
  }

  function findBy(table: string, field: string, value: string) {
    const arr = (mockDb[table] ??= [])
    return arr.filter((r: any) => r[field] === value)
  }

  function countBy(table: string, field: string, value: string) {
    return findBy(table, field, value).length
  }

  store('campaign', { ...baseCampaign })

  return {
    _mockDb: mockDb,
    _store: store,
    campaign: {
      findUnique: vi.fn(({ where: { id } }: any) => {
        const c = findById('campaign', id)
        return c?.deletedAt ? null : c
      }),
      findMany: vi.fn(({ where, skip, take, orderBy }: any) => {
        let items = Object.values(mockDb.campaign ?? [])
          .filter((c: any) => !c.deletedAt && (!where?.organizationId || c.organizationId === where.organizationId))
        const total = items.length
        if (skip) items = items.slice(skip)
        if (take) items = items.slice(0, take)
        return Promise.resolve(items.map((c: any) => ({ ...c, _count: { businesses: countBy('campaignBusiness', 'campaignId', c.id) } })))
      }),
      count: vi.fn(({ where }: any) => {
        return Object.values(mockDb.campaign ?? []).filter((c: any) =>
          !c.deletedAt && (!where?.organizationId || c.organizationId === where.organizationId)
        ).length
      }),
      create: vi.fn(({ data }: any) => {
        const c = { id: `camp_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() }
        store('campaign', c)
        return c
      }),
      update: vi.fn(({ where: { id }, data }: any) => {
        const c = findById('campaign', id)
        if (!c) return null
        Object.assign(c, data, { updatedAt: new Date() })
        return c
      }),
    },
    campaignBusiness: {
      findUnique: vi.fn(({ where }: any) => null),
      findMany: vi.fn(({ where }: any) => {
        return findBy('campaignBusiness', 'campaignId', where?.campaignId)
      }),
      count: vi.fn(({ where }: any) => {
        return countBy('campaignBusiness', 'campaignId', where?.campaignId)
      }),
      createMany: vi.fn(({ data }: any) => {
        for (const d of data) store('campaignBusiness', d)
        return { count: data.length }
      }),
    },
    campaignStatistics: {
      findUnique: vi.fn(({ where: { campaignId } }: any) => {
        const stats = findById('campaignStatistics', campaignId) ?? findById('campaignStatistics', `stats_${campaignId}`)
        return stats ? { ...stats } : null
      }),
      upsert: vi.fn(({ where: { campaignId }, create, update: _update }: any) => {
        const existing = findById('campaignStatistics', campaignId) ?? findById('campaignStatistics', `stats_${campaignId}`)
        if (existing) {
          Object.assign(existing, _update, { updatedAt: new Date() })
          return existing
        }
        const s = { id: `stats_${campaignId}`, ...create, updatedAt: new Date() }
        store('campaignStatistics', s)
        return s
      }),
    },
    campaignLog: {
      create: vi.fn(({ data }: any) => {
        const l = { id: `log_${Date.now()}`, ...data, createdAt: new Date() }
        store('campaignLog', l)
        return l
      }),
      findMany: vi.fn(() => Promise.resolve([])),
    },
  } as any
}

describe('CampaignService', () => {
  let prisma: ReturnType<typeof createMockPrisma>
  let service: CampaignService

  beforeEach(() => {
    prisma = createMockPrisma()
    service = new CampaignService(prisma, mockLogger)
  })

  describe('create', () => {
    it('creates a campaign with draft status', async () => {
      const result = await service.create(
        { name: 'New Campaign', channel: 'email' },
        'org-1',
        'user-1',
      )

      expect(result.name).toBe('New Campaign')
      expect(result.channel).toBe('email')
      expect(result.status).toBe('draft')
    })

    it('creates statistics and log entry', async () => {
      await service.create(
        { name: 'New Campaign', channel: 'whatsapp', description: 'A test' },
        'org-1',
        'user-1',
      )

      expect(prisma.campaignStatistics.upsert).toHaveBeenCalled()
      expect(prisma.campaignLog.create).toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('returns paginated campaigns', async () => {
      const result = await service.findAll('org-1', {
        page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc',
      })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
    })

    it('returns empty array for unknown org', async () => {
      const result = await service.findAll('org-unknown', {
        page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc',
      })

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('findById', () => {
    it('returns campaign with statistics', async () => {
      const result = await service.findById('camp-1', 'org-1')

      expect(result.id).toBe('camp-1')
      expect(result.name).toBe('Test Campaign')
      expect(result.status).toBe('draft')
    })

    it('throws when campaign belongs to different org', async () => {
      await expect(service.findById('camp-1', 'org-other')).rejects.toThrow(CampaignError)
    })

    it('throws for non-existent campaign', async () => {
      await expect(service.findById('nonexistent', 'org-1')).rejects.toThrow(CampaignError)
    })
  })

  describe('update', () => {
    it('updates campaign name', async () => {
      const result = await service.update('camp-1', { name: 'Updated Name' }, 'org-1', 'user-1')

      expect(result.name).toBe('Updated Name')
      expect(prisma.campaignLog.create).toHaveBeenCalled()
    })

    it('throws when not found', async () => {
      await expect(service.update('nonexistent', { name: 'x' }, 'org-1', 'user-1')).rejects.toThrow(CampaignError)
    })
  })

  describe('delete', () => {
    it('soft-deletes a draft campaign', async () => {
      await service.delete('camp-1', 'org-1', 'user-1')
      await expect(service.findById('camp-1', 'org-1')).rejects.toThrow(CampaignError)
    })

    it('throws for non-existent', async () => {
      await expect(service.delete('nonexistent', 'org-1', 'user-1')).rejects.toThrow(CampaignError)
    })
  })

  describe('duplicate', () => {
    it('creates a copy with (Copy) suffix', async () => {
      const result = await service.duplicate('camp-1', 'org-1', 'user-1')

      expect(result.name).toBe('Test Campaign (Copy)')
      expect(result.status).toBe('draft')
    })

    it('throws when not found', async () => {
      await expect(service.duplicate('nonexistent', 'org-1', 'user-1')).rejects.toThrow(CampaignError)
    })
  })

  describe('transitionStatus', () => {
    it('transitions draft to ready', async () => {
      const result = await service.transitionStatus('camp-1', 'ready', 'org-1', 'user-1')
      expect(result.status).toBe('ready')
    })

    it('transitions ready to running', async () => {
      const camp = await service.update('camp-1', { name: 'Test Campaign' }, 'org-1', 'user-1')
      await service.transitionStatus('camp-1', 'ready', 'org-1', 'user-1')
      const result = await service.transitionStatus('camp-1', 'running', 'org-1', 'user-1')
      expect(result.status).toBe('running')
    })

    it('rejects invalid transition', async () => {
      await expect(
        service.transitionStatus('camp-1', 'running', 'org-1', 'user-1'),
      ).rejects.toThrow(CampaignError)
    })

    it('allows same status', async () => {
      const result = await service.transitionStatus('camp-1', 'draft', 'org-1', 'user-1')
      expect(result.status).toBe('draft')
    })
  })
})
