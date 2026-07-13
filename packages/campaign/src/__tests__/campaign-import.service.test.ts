import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CampaignImportService } from '../services/campaign-import.service'
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

function createMockPrisma() {
  const calls: { method: string; args: any }[] = []

  const track = (method: string) =>
    (...args: any[]) => {
      calls.push({ method, args })
      return Promise.resolve()
    }

  return {
    _calls: calls,
    campaign: {
      findUnique: vi.fn(),
    },
    campaignBusiness: {
      findUnique: vi.fn(),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    campaignStatistics: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    campaignLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  } as any
}

describe('CampaignImportService', () => {
  let prisma: ReturnType<typeof createMockPrisma>
  let service: CampaignImportService

  beforeEach(() => {
    prisma = createMockPrisma()
    service = new CampaignImportService(prisma, mockLogger)
  })

  it('throws when campaign not found', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null)
    await expect(
      service.importBusinesses('nonexistent', [{ businessName: 'Test', phone: '+1234567890', personalizedMessage: 'Hi' }]),
    ).rejects.toThrow(CampaignError)
  })

  it('imports valid businesses', async () => {
    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', name: 'Test Campaign' })
    prisma.campaignBusiness.findUnique.mockResolvedValue(null)
    prisma.campaignBusiness.createMany.mockResolvedValue({ count: 2 })

    const result = await service.importBusinesses('camp-1', [
      { businessName: 'Acme Corp', phone: '+1234567890', personalizedMessage: 'Hello Acme!' },
      { businessName: 'Beta Inc', phone: '+9876543210', personalizedMessage: 'Hello Beta!' },
    ])

    expect(result.imported).toBe(2)
    expect(result.duplicates).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(prisma.campaignBusiness.createMany).toHaveBeenCalled()
    expect(prisma.campaignStatistics.upsert).toHaveBeenCalled()
    expect(prisma.campaignLog.create).toHaveBeenCalled()
  })

  it('rejects invalid phone numbers', async () => {
    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', name: 'Test' })
    prisma.campaignBusiness.findUnique.mockResolvedValue(null)

    const result = await service.importBusinesses('camp-1', [
      { businessName: 'Bad Phone', phone: 'not-a-phone', personalizedMessage: 'Hi' },
    ])

    expect(result.imported).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.field).toBe('phone')
  })

  it('detects duplicates within campaign', async () => {
    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', name: 'Test' })
    prisma.campaignBusiness.findUnique.mockResolvedValue({ id: 'existing', phone: '+1234567890' })

    const result = await service.importBusinesses('camp-1', [
      { businessName: 'Dup', phone: '+1234567890', personalizedMessage: 'Hi' },
    ])

    expect(result.imported).toBe(0)
    expect(result.duplicates).toBe(1)
  })

  it('throws on empty input', async () => {
    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', name: 'Test' })

    await expect(
      service.importBusinesses('camp-1', []),
    ).rejects.toThrow(CampaignError)
  })

  it('rejects missing business name', async () => {
    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', name: 'Test' })
    prisma.campaignBusiness.findUnique.mockResolvedValue(null)

    const result = await service.importBusinesses('camp-1', [
      { businessName: '', phone: '+1234567890', personalizedMessage: 'Hi' },
    ])

    expect(result.imported).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.field).toBe('businessName')
  })

  it('rejects missing personalized message', async () => {
    prisma.campaign.findUnique.mockResolvedValue({ id: 'camp-1', name: 'Test' })
    prisma.campaignBusiness.findUnique.mockResolvedValue(null)

    const result = await service.importBusinesses('camp-1', [
      { businessName: 'Test', phone: '+1234567890', personalizedMessage: '' },
    ])

    expect(result.imported).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.field).toBe('personalizedMessage')
  })
})
