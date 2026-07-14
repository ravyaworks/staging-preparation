import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { EventBus } from '@conversation-platform/event-bus'
import { BaseCollector } from '../collectors/base.collector'
import { CampaignCollector } from '../collectors/campaign.collector'
import { ConversationCollector } from '../collectors/conversation.collector'
import { DeliveryCollector } from '../collectors/delivery.collector'
import { AICollector } from '../collectors/ai.collector'
import { WorkflowCollector } from '../collectors/workflow.collector'
import { QueueCollector } from '../collectors/queue.collector'
import { BaseAggregator } from '../aggregators/base.aggregator'
import { CampaignAggregator } from '../aggregators/campaign.aggregator'
import { ConversationAggregator } from '../aggregators/conversation.aggregator'
import { DeliveryAggregator } from '../aggregators/delivery.aggregator'
import { AIAggregator } from '../aggregators/ai.aggregator'
import { WorkflowAggregator } from '../aggregators/workflow.aggregator'
import { QueueAggregator } from '../aggregators/queue.aggregator'
import { AnalyticsCache } from '../cache/analytics-cache'
import { OverviewProvider } from '../providers/overview.provider'
import { CampaignAnalyticsProvider } from '../providers/campaign.provider'
import { ConversationAnalyticsProvider } from '../providers/conversation.provider'
import { DeliveryAnalyticsProvider } from '../providers/delivery.provider'
import { AIAnalyticsProvider } from '../providers/ai.provider'
import { AgentAnalyticsProvider } from '../providers/agent.provider'
import { WorkflowAnalyticsProvider } from '../providers/workflow.provider'
import { QueueAnalyticsProvider } from '../providers/queue.provider'
import { ChannelAnalyticsProvider } from '../providers/channel.provider'
import { ContactAnalyticsProvider } from '../providers/contact.provider'
import { OrganizationAnalyticsProvider } from '../providers/organization.provider'
import { ReportGenerator } from '../reports/report-generator'
import type { AnalyticsPeriod } from '../types'
import type {
  OverviewStats, CampaignAnalytics, ConversationAnalytics, DeliveryAnalytics,
  AIAnalytics, AgentAnalytics, WorkflowAnalytics, QueueAnalytics,
  ChannelAnalytics, ContactAnalytics, OrganizationAnalytics, ReportFilters,
} from '../types'

export class AnalyticsService {
  public readonly collectors: BaseCollector[]
  public readonly aggregators: BaseAggregator[]
  public readonly cache: AnalyticsCache
  public readonly overviewProvider: OverviewProvider
  public readonly campaignProvider: CampaignAnalyticsProvider
  public readonly conversationProvider: ConversationAnalyticsProvider
  public readonly deliveryProvider: DeliveryAnalyticsProvider
  public readonly aiProvider: AIAnalyticsProvider
  public readonly agentProvider: AgentAnalyticsProvider
  public readonly workflowProvider: WorkflowAnalyticsProvider
  public readonly queueProvider: QueueAnalyticsProvider
  public readonly channelProvider: ChannelAnalyticsProvider
  public readonly contactProvider: ContactAnalyticsProvider
  public readonly organizationProvider: OrganizationAnalyticsProvider
  public readonly reportGenerator: ReportGenerator

  private pollInterval: ReturnType<typeof setInterval> | null = null
  private aggregateInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
    private readonly eventBus?: EventBus,
  ) {
    this.cache = new AnalyticsCache()
    this.collectors = [
      new CampaignCollector(prisma, logger),
      new ConversationCollector(prisma, logger),
      new DeliveryCollector(prisma, logger),
      new AICollector(prisma, logger),
      new WorkflowCollector(prisma, logger),
      new QueueCollector(prisma, logger),
    ]
    this.aggregators = [
      new CampaignAggregator(prisma, logger),
      new ConversationAggregator(prisma, logger),
      new DeliveryAggregator(prisma, logger),
      new AIAggregator(prisma, logger),
      new WorkflowAggregator(prisma, logger),
      new QueueAggregator(prisma, logger),
    ]
    this.overviewProvider = new OverviewProvider(prisma)
    this.campaignProvider = new CampaignAnalyticsProvider(prisma)
    this.conversationProvider = new ConversationAnalyticsProvider(prisma)
    this.deliveryProvider = new DeliveryAnalyticsProvider(prisma)
    this.aiProvider = new AIAnalyticsProvider(prisma)
    this.agentProvider = new AgentAnalyticsProvider(prisma)
    this.workflowProvider = new WorkflowAnalyticsProvider(prisma)
    this.queueProvider = new QueueAnalyticsProvider(prisma)
    this.channelProvider = new ChannelAnalyticsProvider(prisma)
    this.contactProvider = new ContactAnalyticsProvider(prisma)
    this.organizationProvider = new OrganizationAnalyticsProvider(prisma)
    this.reportGenerator = new ReportGenerator(prisma, logger)
  }

  async start(): Promise<void> {
    this.logger.info('Analytics service starting')

    if (this.eventBus) {
      for (const collector of this.collectors) {
        collector.subscribe(this.eventBus)
        this.logger.info({ collector: collector.getName() }, 'Analytics collector subscribed to events')
      }
    }

    this.pollInterval = setInterval(() => this.poll(), 30000)
    this.aggregateInterval = setInterval(() => this.aggregate(), 60000)

    await this.poll()
    await this.aggregate()

    this.logger.info('Analytics service started')
  }

  async stop(): Promise<void> {
    if (this.pollInterval) clearInterval(this.pollInterval)
    if (this.aggregateInterval) clearInterval(this.aggregateInterval)
    this.logger.info('Analytics service stopped')
  }

  private async poll(): Promise<void> {
    for (const collector of this.collectors) {
      try {
        if ('poll' in collector && typeof (collector as any).poll === 'function') {
          await (collector as any).poll()
        }
      } catch (error) {
        this.logger.error({ collector: collector.getName(), error }, 'Analytics collector poll failed')
      }
    }
  }

  private async aggregate(): Promise<void> {
    const periods: AnalyticsPeriod[] = ['hour', 'day']
    const now = new Date()

    for (const aggregator of this.aggregators) {
      try {
        await aggregator.aggregateAll(periods, now)
      } catch (error) {
        this.logger.error({ aggregator: aggregator.constructor.name, error }, 'Analytics aggregation failed')
      }
    }
  }

  getOverview(organizationId?: string, tenantId?: string): Promise<OverviewStats> {
    const key = this.cache.getCacheKey('overview', { organizationId, tenantId })
    return this.cache.wrap(key, () => this.overviewProvider.getStats(organizationId, tenantId))
  }

  getCampaignAnalytics(organizationId?: string, startDate?: string, endDate?: string, channel?: string): Promise<CampaignAnalytics> {
    const key = this.cache.getCacheKey('campaigns', { organizationId, startDate, endDate, channel })
    return this.cache.wrap(key, () => this.campaignProvider.getAnalytics(organizationId, startDate, endDate, channel))
  }

  getConversationAnalytics(tenantId?: string, organizationId?: string, channel?: string, startDate?: string, endDate?: string): Promise<ConversationAnalytics> {
    const key = this.cache.getCacheKey('conversations', { tenantId, organizationId, channel, startDate, endDate })
    return this.cache.wrap(key, () => this.conversationProvider.getAnalytics(tenantId, organizationId, channel, startDate, endDate))
  }

  getDeliveryAnalytics(campaignId?: string, startDate?: string, endDate?: string): Promise<DeliveryAnalytics> {
    const key = this.cache.getCacheKey('delivery', { campaignId, startDate, endDate })
    return this.cache.wrap(key, () => this.deliveryProvider.getAnalytics(campaignId, startDate, endDate))
  }

  getAIAnalytics(tenantId?: string): Promise<AIAnalytics> {
    const key = this.cache.getCacheKey('ai', { tenantId })
    return this.cache.wrap(key, () => this.aiProvider.getAnalytics(tenantId))
  }

  getAgentAnalytics(tenantId?: string): Promise<AgentAnalytics> {
    const key = this.cache.getCacheKey('agents', { tenantId })
    return this.cache.wrap(key, () => this.agentProvider.getAnalytics(tenantId))
  }

  getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
    const key = this.cache.getCacheKey('workflows', {})
    return this.cache.wrap(key, () => this.workflowProvider.getAnalytics())
  }

  getQueueAnalytics(): Promise<QueueAnalytics> {
    const key = this.cache.getCacheKey('queue', {})
    return this.cache.wrap(key, () => this.queueProvider.getAnalytics())
  }

  getChannelAnalytics(organizationId?: string): Promise<ChannelAnalytics[]> {
    const key = this.cache.getCacheKey('channels', { organizationId })
    return this.cache.wrap(key, () => this.channelProvider.getAnalytics(organizationId))
  }

  getContactAnalytics(tenantId?: string): Promise<ContactAnalytics> {
    const key = this.cache.getCacheKey('contacts', { tenantId })
    return this.cache.wrap(key, () => this.contactProvider.getAnalytics(tenantId))
  }

  getOrganizationAnalytics(organizationId?: string): Promise<OrganizationAnalytics> {
    const key = this.cache.getCacheKey('organizations', { organizationId })
    return this.cache.wrap(key, () => this.organizationProvider.getAnalytics(organizationId))
  }

  invalidateCache(pattern?: string): void {
    this.cache.invalidate(pattern)
  }
}
