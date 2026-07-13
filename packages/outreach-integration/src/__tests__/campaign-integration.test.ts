import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CampaignIntegrationService } from '../services/campaign-integration.service'
import type { PrismaClient } from '@prisma/client'

const mockPrisma = {
  campaign: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  campaignBusiness: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  campaignLog: { create: vi.fn() },
  campaignStatistics: {
    upsert: vi.fn(),
    findUnique: vi.fn().mockResolvedValue({
      id: 'stats-1', campaignId: 'camp-1', totalBusinesses: 1,
      jobsCreated: 0, pending: 1, queued: 0, sending: 0, sent: 0,
      delivered: 0, read: 0, failed: 0, replied: 0, updatedAt: new Date(),
    }),
  },
} as unknown as PrismaClient

const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any

describe('CampaignIntegrationService', () => {
  let service: CampaignIntegrationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CampaignIntegrationService(mockPrisma, mockLogger)
  })

  describe('resolveCampaignConfig', () => {
    it('returns named resolution when campaign name provided', () => {
      const result = service.resolveCampaignConfig('My Campaign', 'Restaurant')
      expect(result).toEqual({ type: 'named', name: 'My Campaign', channel: 'whatsapp' })
    })

    it('returns auto resolution with industry when no campaign name', () => {
      const result = service.resolveCampaignConfig(undefined, 'Restaurant')
      expect(result).toEqual({ type: 'auto', name: 'Restaurant Outreach', channel: 'whatsapp' })
    })

    it('returns generic auto resolution when neither provided', () => {
      const result = service.resolveCampaignConfig(undefined, undefined)
      expect(result).toEqual({ type: 'auto', name: 'General Outreach', channel: 'whatsapp' })
    })
  })

  describe('getOrCreateCampaignAndImport', () => {
    const businesses = [
      { businessName: 'Biz A', phone: '+1111111111', personalizedMessage: 'Msg A' },
    ]
    const organizationId = 'org-1'

    it('creates new campaign when none exists', async () => {
      vi.mocked(mockPrisma.campaign.findFirst).mockResolvedValue(null)
      vi.mocked(mockPrisma.campaign.create).mockResolvedValue({
        id: 'camp-1',
        name: 'Test Campaign',
        description: null,
        channel: 'whatsapp',
        status: 'draft',
        organizationId: 'org-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        deletedAt: null,
      })
      vi.mocked(mockPrisma.campaign.update).mockResolvedValue({} as any)
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValue(null)
      vi.mocked(mockPrisma.campaignBusiness.create).mockResolvedValue({
        id: 'cb-1',
        businessName: 'Biz A',
        phone: '+1111111111',
        email: null,
        industry: null,
        previewUrl: null,
        personalizedMessage: 'Msg A',
        status: 'pending',
        errors: null,
        campaignId: 'camp-1',
        outreachJobId: null,
        contactId: null,
        conversationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(mockPrisma.campaignBusiness.findMany).mockResolvedValue([])
      vi.mocked(mockPrisma.campaign.findUnique).mockResolvedValue({
        id: 'camp-1',
        name: 'Test Campaign',
        description: null,
        channel: 'whatsapp',
        status: 'draft',
        organizationId: 'org-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
      })
      vi.mocked(mockPrisma.campaignStatistics.upsert).mockResolvedValue({} as any)

      const result = await service.getOrCreateCampaignAndImport(businesses, organizationId, 'Test Campaign')

      expect(result.campaign).toBeTruthy()
      expect(result.campaign?.name).toBe('Test Campaign')
      expect(mockPrisma.campaign.create).toHaveBeenCalledOnce()
    })

    it('reuses existing campaign', async () => {
      vi.mocked(mockPrisma.campaign.findFirst).mockResolvedValue({
        id: 'camp-1', organizationId: 'org-1', name: 'Existing Campaign',
        deletedAt: null, status: 'draft',
      } as any)
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValue(null)
      vi.mocked(mockPrisma.campaignBusiness.create).mockResolvedValue({
        id: 'cb-1',
        businessName: 'Biz A',
        phone: '+1111111111',
        email: null,
        industry: null,
        previewUrl: null,
        personalizedMessage: 'Msg A',
        status: 'pending',
        errors: null,
        campaignId: 'camp-1',
        outreachJobId: null,
        contactId: null,
        conversationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(mockPrisma.campaignBusiness.findMany).mockResolvedValue([])
      vi.mocked(mockPrisma.campaign.findUnique).mockResolvedValue({
        id: 'camp-1',
        name: 'Existing Campaign',
        description: null,
        channel: 'whatsapp',
        status: 'draft',
        organizationId: 'org-1',
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
      })
      vi.mocked(mockPrisma.campaignStatistics.upsert).mockResolvedValue({} as any)

      const result = await service.getOrCreateCampaignAndImport(businesses, organizationId, 'Existing Campaign')

      expect(result.campaign?.name).toBe('Existing Campaign')
      expect(mockPrisma.campaign.create).not.toHaveBeenCalled()
    })
  })

  describe('importBusinesses', () => {
    it('imports new businesses and skips duplicates', async () => {
      vi.mocked(mockPrisma.campaignBusiness.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing' } as any)
      vi.mocked(mockPrisma.campaignBusiness.create).mockResolvedValue({
        id: 'cb-1',
        businessName: 'New Biz',
        phone: '+1111111111',
        email: null,
        industry: null,
        previewUrl: null,
        personalizedMessage: 'Msg',
        status: 'pending',
        errors: null,
        campaignId: 'camp-1',
        outreachJobId: null,
        contactId: null,
        conversationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(mockPrisma.campaignStatistics.upsert).mockResolvedValue({} as any)

      const result = await service.importBusinesses('camp-1', [
        { businessName: 'New Biz', phone: '+1111111111', personalizedMessage: 'Msg' },
        { businessName: 'Existing Biz', phone: '+2222222222', personalizedMessage: 'Msg2' },
      ])

      expect(result.imported).toBe(1)
      expect(result.duplicates).toBe(1)
      expect(result.campaignBusinessIds).toHaveLength(1)
    })
  })
})
