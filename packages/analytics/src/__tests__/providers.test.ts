import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { OverviewProvider } from '../providers/overview.provider'
import { CampaignAnalyticsProvider } from '../providers/campaign.provider'
import { ConversationAnalyticsProvider } from '../providers/conversation.provider'

function createMockPrisma(overrides: Record<string, any> = {}): PrismaClient {
  const defaults = {
    organization: { count: vi.fn().mockResolvedValue(5) },
    campaign: { count: vi.fn().mockResolvedValue(10), findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
    campaignBusiness: { count: vi.fn().mockResolvedValue(100), findMany: vi.fn().mockResolvedValue([]) },
    conversation: { count: vi.fn().mockResolvedValue(50), findMany: vi.fn().mockResolvedValue([]) },
    message: { count: vi.fn().mockResolvedValue(200) },
    analyticsEvent: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    analyticsMetric: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]), aggregate: vi.fn().mockResolvedValue({ _sum: { value: 0 }, _avg: { value: 0 } }) },
    deliveryEvent: { groupBy: vi.fn().mockResolvedValue([]) },
    campaignStatistics: { aggregate: vi.fn().mockResolvedValue({ _sum: { replied: 10 } }) },
    campaignLog: { findMany: vi.fn().mockResolvedValue([]) },
    outreachJob: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    workerMetric: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    jobFailure: { findMany: vi.fn().mockResolvedValue([]) },
    contact: { count: vi.fn().mockResolvedValue(30) },
    user: { count: vi.fn().mockResolvedValue(3), findMany: vi.fn().mockResolvedValue([]) },
    $executeRaw: vi.fn().mockResolvedValue([1]),
  }
  return { ...defaults, ...overrides } as unknown as PrismaClient
}

describe('OverviewProvider', () => {
  it('returns overview stats with correct values', async () => {
    const provider = new OverviewProvider(createMockPrisma())
    const stats = await provider.getStats()
    expect(stats.totalOrganizations).toBe(5)
    expect(stats.totalCampaigns).toBe(10)
    expect(stats.totalBusinessesContacted).toBe(100)
    expect(stats.totalConversations).toBe(50)
    expect(stats.messagesSent).toBe(200)
    expect(stats.openLeads).toBeDefined()
    expect(stats.closedLeads).toBeDefined()
  })

  it('filters by organization when provided', async () => {
    const mockPrisma = createMockPrisma()
    const provider = new OverviewProvider(mockPrisma)
    await provider.getStats('org_1')
    expect(mockPrisma.campaign.count).toHaveBeenCalled()
  })
})

describe('CampaignAnalyticsProvider', () => {
  it('returns campaign analytics with computed rates', async () => {
    const provider = new CampaignAnalyticsProvider(createMockPrisma())
    const analytics = await provider.getAnalytics()
    expect(analytics.totalCampaigns).toBeDefined()
    expect(analytics.successRate).toBeDefined()
    expect(analytics.completionPercent).toBeDefined()
    expect(Array.isArray(analytics.topPerforming)).toBe(true)
    expect(Array.isArray(analytics.trend)).toBe(true)
  })
})

describe('ConversationAnalyticsProvider', () => {
  it('returns conversation analytics', async () => {
    const provider = new ConversationAnalyticsProvider(createMockPrisma())
    const analytics = await provider.getAnalytics()
    expect(analytics.totalConversations).toBeDefined()
    expect(analytics.activeConversations).toBeDefined()
    expect(analytics.closedConversations).toBeDefined()
    expect(Array.isArray(analytics.trend)).toBe(true)
  })
})
