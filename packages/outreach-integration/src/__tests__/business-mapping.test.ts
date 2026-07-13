import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BusinessMappingService } from '../services/business-mapping.service'
import type { PrismaClient } from '@prisma/client'

const mockPrisma = {
  campaignBusiness: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  outreachJob: {
    findUnique: vi.fn(),
  },
  conversation: {
    findUnique: vi.fn(),
  },
  contact: {
    findUnique: vi.fn(),
  },
  campaign: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient

const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any

describe('BusinessMappingService', () => {
  let service: BusinessMappingService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new BusinessMappingService(mockPrisma, mockLogger)
  })

  describe('getBusinessById', () => {
    it('returns business detail for valid ID', async () => {
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValue({
        id: 'cb-1',
        businessName: 'Test Biz',
        phone: '+1234567890',
        email: 'test@example.com',
        industry: 'Restaurant',
        previewUrl: 'https://example.com/preview',
        personalizedMessage: 'Hello',
        status: 'pending',
        campaignId: 'camp-1',
        outreachJobId: null,
        contactId: null,
        conversationId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        campaign: { name: 'Test Campaign', organizationId: 'org-1' },
      })

      const result = await service.getBusinessById('cb-1', 'org-1')

      expect(result.businessName).toBe('Test Biz')
      expect(result.phone).toBe('+1234567890')
      expect(result.campaignName).toBe('Test Campaign')
    })

    it('throws when business not found in organization', async () => {
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValue({
        id: 'cb-1',
        campaign: { name: 'Other Campaign', organizationId: 'other-org' },
      } as any)

      await expect(service.getBusinessById('cb-1', 'org-1')).rejects.toThrow('Business not found')
    })

    it('fetches outreach job status when outreachJobId exists', async () => {
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValue({
        id: 'cb-1',
        businessName: 'Test Biz',
        phone: '+1234567890',
        email: null,
        industry: null,
        previewUrl: null,
        personalizedMessage: 'Hello',
        status: 'pending',
        campaignId: 'camp-1',
        outreachJobId: 'job-1',
        contactId: null,
        conversationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: { name: 'Campaign', organizationId: 'org-1' },
      })
      vi.mocked(mockPrisma.outreachJob.findUnique).mockResolvedValue({
        id: 'job-1', status: 'completed',
      } as any)

      const result = await service.getBusinessById('cb-1', 'org-1')

      expect(result.outreachJobStatus).toBe('completed')
    })
  })

  describe('listBusinesses', () => {
    it('returns paginated businesses', async () => {
      vi.mocked(mockPrisma.campaignBusiness.findMany).mockResolvedValue([
        {
          id: 'cb-1', businessName: 'Biz A', phone: '+1111111111',
          email: null, industry: null, previewUrl: null,
          personalizedMessage: 'Msg A', status: 'pending',
          campaignId: 'camp-1', outreachJobId: null,
          contactId: null, conversationId: null,
          createdAt: new Date(), updatedAt: new Date(),
          campaign: { name: 'Campaign A' },
        },
      ])
      vi.mocked(mockPrisma.campaignBusiness.count).mockResolvedValue(1)

      const result = await service.listBusinesses('org-1', {
        page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc',
      })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.items[0]!.businessName).toBe('Biz A')
    })
  })

  describe('updateBusinessMapping', () => {
    it('updates business fields', async () => {
      vi.mocked(mockPrisma.campaignBusiness.update).mockResolvedValue({} as any)

      await service.updateBusinessMapping('cb-1', {
        contactId: 'contact-1',
        conversationId: 'conv-1',
        outreachJobId: 'job-1',
      })

      expect(mockPrisma.campaignBusiness.update).toHaveBeenCalledWith({
        where: { id: 'cb-1' },
        data: { contactId: 'contact-1', conversationId: 'conv-1', outreachJobId: 'job-1' },
      })
    })
  })

  describe('getTraceability', () => {
    it('returns full traceability chain', async () => {
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValueOnce({
        id: 'cb-1',
        businessName: 'Test Biz',
        phone: '+1234567890',
        email: null,
        industry: null,
        previewUrl: null,
        personalizedMessage: 'Hello',
        status: 'pending',
        campaignId: 'camp-1',
        outreachJobId: 'job-1',
        contactId: 'contact-1',
        conversationId: 'conv-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: { id: 'camp-1', name: 'Campaign', status: 'running', organizationId: 'org-1' },
      })
      vi.mocked(mockPrisma.outreachJob.findUnique).mockResolvedValue({
        id: 'job-1', status: 'completed', createdAt: new Date(),
      })
      vi.mocked(mockPrisma.conversation.findUnique).mockResolvedValue({
        id: 'conv-1', status: 'active',
      })
      vi.mocked(mockPrisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1', name: 'John Doe', phone: '+1234567890',
      })
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValueOnce({
        id: 'cb-1',
        businessName: 'Test Biz',
        phone: '+1234567890',
        email: null,
        industry: null,
        previewUrl: null,
        personalizedMessage: 'Hello',
        status: 'pending',
        campaignId: 'camp-1',
        outreachJobId: 'job-1',
        contactId: 'contact-1',
        conversationId: 'conv-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: { name: 'Campaign', organizationId: 'org-1' },
      })

      const result = await service.getTraceability('cb-1')

      expect(result.business).toBeTruthy()
      expect(result.campaign?.name).toBe('Campaign')
      expect(result.outreachJob?.status).toBe('completed')
      expect(result.conversation?.status).toBe('active')
      expect(result.contact?.name).toBe('John Doe')
    })
  })
})
