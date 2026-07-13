import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportService } from '../services/import.service'
import type { PrismaClient } from '@prisma/client'

const mockPrisma = {
  importJob: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  importRecord: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  campaignBusiness: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  campaign: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  campaignStatistics: {
    upsert: vi.fn(),
    findUnique: vi.fn().mockResolvedValue({
      id: 'stats-1', campaignId: 'camp-1', totalBusinesses: 1,
      jobsCreated: 0, pending: 1, queued: 0, sending: 0, sent: 0,
      delivered: 0, read: 0, failed: 0, replied: 0, updatedAt: new Date(),
    }),
  },
  campaignLog: { create: vi.fn() },
} as unknown as PrismaClient

const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any

function getMockImportJob(overrides?: Record<string, unknown>) {
  return {
    id: 'import-1',
    type: 'json',
    status: 'pending',
    organizationId: 'org-1',
    campaignId: null,
    createdBy: 'user-1',
    totalRecords: 0,
    successCount: 0,
    failedCount: 0,
    errorSummary: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    ...overrides,
  }
}

function getMockCampaign(overrides?: Record<string, unknown>) {
  return {
    id: 'camp-1',
    name: 'General Outreach',
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
    ...overrides,
  }
}

function getMockCampaignBusiness(overrides?: Record<string, unknown>) {
  return {
    id: 'cb-1',
    businessName: 'Test Biz',
    phone: '+1234567890',
    email: null,
    industry: null,
    previewUrl: null,
    personalizedMessage: 'Test message',
    status: 'pending',
    errors: null,
    campaignId: 'camp-1',
    outreachJobId: null,
    contactId: null,
    conversationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('ImportService', () => {
  let service: ImportService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ImportService(mockPrisma, mockLogger)
  })

  describe('createImportJob', () => {
    it('creates an import job record', async () => {
      vi.mocked(mockPrisma.importJob.create).mockResolvedValue(getMockImportJob() as any)

      const result = await service.createImportJob('json', 'org-1', undefined, undefined, 'user-1')

      expect(result.id).toBe('import-1')
      expect(mockPrisma.importJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'json',
            organizationId: 'org-1',
            status: 'pending',
          }),
        }),
      )
    })
  })

  describe('processJsonImport', () => {
    it('processes valid businesses successfully', async () => {
      vi.mocked(mockPrisma.importJob.findUnique).mockResolvedValue(getMockImportJob() as any)
      vi.mocked(mockPrisma.importJob.update).mockResolvedValue(getMockImportJob({ status: 'processing' }) as any)
      vi.mocked(mockPrisma.importRecord.createMany).mockResolvedValue({ count: 1 })
      vi.mocked(mockPrisma.campaign.findFirst).mockResolvedValue(null)
      vi.mocked(mockPrisma.campaign.create).mockResolvedValue(getMockCampaign() as any)
      vi.mocked(mockPrisma.campaign.update).mockResolvedValue(getMockCampaign({ status: 'ready' }) as any)
      vi.mocked(mockPrisma.campaign.findUnique).mockResolvedValue(getMockCampaign({ status: 'ready' }) as any)
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValue(null)
      vi.mocked(mockPrisma.campaignBusiness.create).mockResolvedValue(getMockCampaignBusiness() as any)
      vi.mocked(mockPrisma.campaignBusiness.findMany).mockResolvedValue([getMockCampaignBusiness()])
      vi.mocked(mockPrisma.importRecord.findMany).mockResolvedValue([
        { id: 'rec-1', rowNumber: 1, phone: '+1234567890' },
      ] as any)
      vi.mocked(mockPrisma.importRecord.update).mockResolvedValue({} as any)
      vi.mocked(mockPrisma.campaignStatistics.upsert).mockResolvedValue({ id: 'stats-1', campaignId: 'camp-1', totalBusinesses: 1, pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, replied: 0, queued: 0, sending: 0, jobsCreated: 0, updatedAt: new Date() } as any)
      vi.mocked(mockPrisma.campaignStatistics.findUnique).mockResolvedValue({ id: 'stats-1', campaignId: 'camp-1', totalBusinesses: 1, pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, replied: 0, queued: 0, sending: 0, jobsCreated: 0, updatedAt: new Date() } as any)
      vi.mocked(mockPrisma.campaignLog.create).mockResolvedValue({} as any)

      const result = await service.processJsonImport('import-1', [
        { businessName: 'Test Biz', phone: '+1234567890', personalizedMessage: 'Test message' },
      ], 'org-1')

      expect(result.status).toBe('completed')
      expect(result.successCount).toBe(1)
    })

    it('handles validation failures', async () => {
      vi.mocked(mockPrisma.importJob.findUnique).mockResolvedValue(getMockImportJob() as any)
      vi.mocked(mockPrisma.importJob.update).mockResolvedValue(getMockImportJob() as any)
      vi.mocked(mockPrisma.importRecord.createMany).mockResolvedValue({ count: 2 })
      vi.mocked(mockPrisma.importRecord.updateMany).mockResolvedValue({ count: 2 })

      const result = await service.processJsonImport('import-1', [
        { businessName: '', phone: 'invalid', personalizedMessage: '' },
      ], 'org-1')

      expect(result.status).toBe('failed')
      expect(result.failedCount).toBe(1)
    })
  })

  describe('processCsvImport', () => {
    it('parses CSV content and processes it', async () => {
      vi.mocked(mockPrisma.importJob.findUnique).mockResolvedValue(getMockImportJob({ type: 'csv' }) as any)
      vi.mocked(mockPrisma.importJob.update).mockResolvedValue(getMockImportJob({ type: 'csv', status: 'processing' }) as any)
      vi.mocked(mockPrisma.importRecord.createMany).mockResolvedValue({ count: 1 })
      vi.mocked(mockPrisma.campaign.findFirst).mockResolvedValue(null)
      vi.mocked(mockPrisma.campaign.create).mockResolvedValue(getMockCampaign() as any)
      vi.mocked(mockPrisma.campaign.update).mockResolvedValue(getMockCampaign({ status: 'ready' }) as any)
      vi.mocked(mockPrisma.campaign.findUnique).mockResolvedValue(getMockCampaign({ status: 'ready' }) as any)
      vi.mocked(mockPrisma.campaignBusiness.findUnique).mockResolvedValue(null)
      vi.mocked(mockPrisma.campaignBusiness.create).mockResolvedValue(getMockCampaignBusiness({ businessName: 'CSV Biz', personalizedMessage: 'CSV message' }) as any)
      vi.mocked(mockPrisma.campaignBusiness.findMany).mockResolvedValue([getMockCampaignBusiness({ businessName: 'CSV Biz', personalizedMessage: 'CSV message' })])
      vi.mocked(mockPrisma.importRecord.findMany).mockResolvedValue([
        { id: 'rec-1', rowNumber: 1, phone: '+1234567890' },
      ] as any)
      vi.mocked(mockPrisma.importRecord.update).mockResolvedValue({} as any)
      vi.mocked(mockPrisma.campaignStatistics.upsert).mockResolvedValue({ id: 'stats-1', campaignId: 'camp-1', totalBusinesses: 1, pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, replied: 0, queued: 0, sending: 0, jobsCreated: 0, updatedAt: new Date() } as any)
      vi.mocked(mockPrisma.campaignStatistics.findUnique).mockResolvedValue({ id: 'stats-1', campaignId: 'camp-1', totalBusinesses: 1, pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, replied: 0, queued: 0, sending: 0, jobsCreated: 0, updatedAt: new Date() } as any)
      vi.mocked(mockPrisma.campaignLog.create).mockResolvedValue({} as any)

      const csvContent = 'businessName,phone,personalizedMessage\nCSV Biz,+1234567890,CSV message'
      const result = await service.processCsvImport('import-1', csvContent, 'org-1')

      expect(result.status).toBe('completed')
      expect(result.successCount).toBe(1)
    })

    it('handles CSV parse errors', async () => {
      vi.mocked(mockPrisma.importJob.findUnique).mockResolvedValue({
        id: 'import-1', type: 'csv', status: 'pending', organizationId: 'org-1',
        campaignId: null, createdBy: 'user-1', totalRecords: 0,
        successCount: 0, failedCount: 0, errorSummary: null,
        createdAt: new Date(), updatedAt: new Date(), completedAt: null,
      })
      vi.mocked(mockPrisma.importJob.update).mockResolvedValue({} as any)

      const result = await service.processCsvImport('import-1', 'not,valid,csv\nline', 'org-1')

      expect(result.status).toBe('failed')
    })
  })

  describe('getImportJob', () => {
    it('returns import job for the organization', async () => {
      const now = new Date()
      vi.mocked(mockPrisma.importJob.findUnique).mockResolvedValue({
        id: 'import-1', type: 'json', status: 'completed',
        organizationId: 'org-1', campaignId: 'camp-1',
        totalRecords: 10, successCount: 8, failedCount: 2,
        errorSummary: [{ row: 3, message: 'Invalid phone' }],
        createdBy: 'user-1', createdAt: now, updatedAt: now,
        completedAt: now,
      })

      const result = await service.getImportJob('import-1', 'org-1')

      expect(result.status).toBe('completed')
      expect(result.totalRecords).toBe(10)
      expect(result.successCount).toBe(8)
      expect(result.failedCount).toBe(2)
    })

    it('throws when organization does not match', async () => {
      vi.mocked(mockPrisma.importJob.findUnique).mockResolvedValue({
        id: 'import-1', organizationId: 'other-org',
      } as any)

      await expect(service.getImportJob('import-1', 'org-1')).rejects.toThrow('Import job not found')
    })
  })

  describe('listImportJobs', () => {
    it('paginates import jobs', async () => {
      vi.mocked(mockPrisma.importJob.findMany).mockResolvedValue([
        { id: 'import-1', type: 'json', status: 'completed',
          organizationId: 'org-1', campaignId: null, createdBy: null,
          totalRecords: 5, successCount: 3, failedCount: 2,
          errorSummary: null, createdAt: new Date(), updatedAt: new Date(),
          completedAt: new Date() },
      ])
      vi.mocked(mockPrisma.importJob.count).mockResolvedValue(1)

      const result = await service.listImportJobs('org-1')

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })
})
