import { describe, it, expect, vi } from 'vitest'
import { CampaignStatisticsService } from '../services/campaign-statistics.service'
import { CampaignError } from '../types'

function createMockPrisma(overrides: Record<string, any> = {}) {
  const defaultModel = () => ({
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  })

  return {
    campaignStatistics: { ...defaultModel(), ...overrides.campaignStatistics },
    campaignBusiness: { ...defaultModel(), ...overrides.campaignBusiness },
    campaign: { ...defaultModel(), ...overrides.campaign },
  } as any
}

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

describe('CampaignStatisticsService', () => {
  describe('getStatistics', () => {
    it('returns statistics with computed progress and rates', async () => {
      const prisma = createMockPrisma({
        campaignStatistics: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'stats-1',
            campaignId: 'camp-1',
            totalBusinesses: 100,
            jobsCreated: 100,
            pending: 10,
            queued: 0,
            sending: 0,
            sent: 20,
            delivered: 30,
            read: 25,
            failed: 5,
            replied: 10,
            updatedAt: new Date(),
          }),
        },
      })

      const service = new CampaignStatisticsService(prisma, mockLogger)
      const result = await service.getStatistics('camp-1')

      expect(result.totalBusinesses).toBe(100)
      expect(result.totalProcessed).toBe(90)
      expect(result.progress).toBe(90)
      expect(result.successRate).toBe(72)
    })

    it('throws when statistics not found', async () => {
      const prisma = createMockPrisma({
        campaignStatistics: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      })

      const service = new CampaignStatisticsService(prisma, mockLogger)
      await expect(service.getStatistics('nonexistent')).rejects.toThrow(CampaignError)
    })

    it('returns 0 progress when no businesses', async () => {
      const prisma = createMockPrisma({
        campaignStatistics: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'stats-1',
            campaignId: 'camp-1',
            totalBusinesses: 0,
            pending: 0,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            replied: 0,
            updatedAt: new Date(),
          }),
        },
      })

      const service = new CampaignStatisticsService(prisma, mockLogger)
      const result = await service.getStatistics('camp-1')
      expect(result.progress).toBe(0)
      expect(result.successRate).toBe(0)
    })
  })

  describe('recalculate', () => {
    it('counts businesses and upserts statistics', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({})
      const prisma = createMockPrisma({
        campaignBusiness: {
          count: vi.fn()
            .mockResolvedValueOnce(100)
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(20)
            .mockResolvedValueOnce(30)
            .mockResolvedValueOnce(25)
            .mockResolvedValueOnce(5)
            .mockResolvedValueOnce(10),
        },
        campaignStatistics: {
          upsert: mockUpsert,
        },
      })

      const service = new CampaignStatisticsService(prisma, mockLogger)
      await service.recalculate('camp-1')

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { campaignId: 'camp-1' },
        create: expect.objectContaining({
          totalBusinesses: 100,
          pending: 10,
          sent: 20,
          delivered: 30,
          read: 25,
          failed: 5,
          replied: 10,
        }),
        update: expect.objectContaining({
          totalBusinesses: 100,
          pending: 10,
        }),
      })
    })
  })

  describe('incrementStat', () => {
    it('upserts with increment', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({})
      const prisma = createMockPrisma({
        campaignStatistics: { upsert: mockUpsert },
      })

      const service = new CampaignStatisticsService(prisma, mockLogger)
      await service.incrementStat('camp-1', 'sent')

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { campaignId: 'camp-1' },
        create: { campaignId: 'camp-1', sent: 1 },
        update: { sent: { increment: 1 } },
      })
    })

    it('throws for invalid field', async () => {
      const prisma = createMockPrisma()
      const service = new CampaignStatisticsService(prisma, mockLogger)
      await expect(service.incrementStat('camp-1', 'invalid')).rejects.toThrow(CampaignError)
    })
  })
})
