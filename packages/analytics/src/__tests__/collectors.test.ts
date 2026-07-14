import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InMemoryEventBus } from '@conversation-platform/event-bus'
import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { CampaignCollector } from '../collectors/campaign.collector'
import { ConversationCollector } from '../collectors/conversation.collector'
import { DeliveryCollector } from '../collectors/delivery.collector'

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
  setLevel: vi.fn(),
  getLevel: vi.fn().mockReturnValue('info'),
} satisfies Logger

function createMockPrisma(): PrismaClient {
  return {
    analyticsEvent: {
      create: vi.fn().mockResolvedValue({ id: 'evt_1' }),
    },
    campaign: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    conversation: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    deliveryEvent: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    message: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    workerMetric: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaClient
}

describe('CampaignCollector', () => {
  it('subscribes to campaign events', () => {
    const eventBus = new InMemoryEventBus()
    const collector = new CampaignCollector(createMockPrisma(), mockLogger)
    collector.subscribe(eventBus)
    expect(collector.getName()).toBe('campaign')
  })

  it('getName returns campaign', () => {
    const collector = new CampaignCollector(createMockPrisma(), mockLogger)
    expect(collector.getName()).toBe('campaign')
  })
})

describe('ConversationCollector', () => {
  it('subscribes to conversation events', () => {
    const eventBus = new InMemoryEventBus()
    const collector = new ConversationCollector(createMockPrisma(), mockLogger)
    collector.subscribe(eventBus)
    expect(collector.getName()).toBe('conversation')
  })

  it('getName returns conversation', () => {
    const collector = new ConversationCollector(createMockPrisma(), mockLogger)
    expect(collector.getName()).toBe('conversation')
  })
})

describe('DeliveryCollector', () => {
  it('subscribes to delivery events', () => {
    const eventBus = new InMemoryEventBus()
    const collector = new DeliveryCollector(createMockPrisma(), mockLogger)
    collector.subscribe(eventBus)
    expect(collector.getName()).toBe('delivery')
  })

  it('getName returns delivery', () => {
    const collector = new DeliveryCollector(createMockPrisma(), mockLogger)
    expect(collector.getName()).toBe('delivery')
  })
})
