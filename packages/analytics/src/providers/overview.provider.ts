import type { PrismaClient } from '@prisma/client'
import type { OverviewStats } from '../types'

export class OverviewProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getStats(organizationId?: string, tenantId?: string): Promise<OverviewStats> {
    const campaignBusinessWhere = organizationId
      ? { campaign: { organizationId } }
      : {}

    const conversationWhere = tenantId ? { tenantId } : {}

    const [
      totalOrganizations,
      totalCampaigns,
      activeCampaigns,
      totalBusinessesContacted,
      totalConversations,
      activeConversations,
      messagesSent,
      messagesDeliveredMetric,
      messagesReadMetric,
      customerReplies,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.campaign.count({
        where: organizationId ? { organizationId } : undefined,
      }),
      this.prisma.campaign.count({
        where: { status: 'running', ...(organizationId ? { organizationId } : {}) },
      }),
      this.prisma.campaignBusiness.count({
        where: organizationId ? { campaign: { organizationId } } : undefined,
      }),
      this.prisma.conversation.count({
        where: tenantId ? { tenantId } : undefined,
      }),
      this.prisma.conversation.count({ where: { status: 'active' } }),
      this.prisma.message.count({ where: { direction: 'outbound' } }),
      this.prisma.analyticsMetric.findFirst({
        where: {
          metric: 'messages_delivered',
          ...(organizationId ? { organizationId } : {}),
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { bucket: 'desc' },
        select: { value: true },
      }),
      this.prisma.analyticsMetric.findFirst({
        where: {
          metric: 'messages_read',
          ...(organizationId ? { organizationId } : {}),
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { bucket: 'desc' },
        select: { value: true },
      }),
      this.prisma.message.count({ where: { direction: 'inbound' } }),
    ])

    const messagesDelivered = messagesDeliveredMetric ? messagesDeliveredMetric.value : 0
    const messagesRead = messagesReadMetric ? messagesReadMetric.value : 0
    const openLeads = activeConversations
    const closedLeads = totalConversations - activeConversations

    return {
      totalOrganizations,
      totalCampaigns,
      activeCampaigns,
      totalBusinessesContacted,
      totalConversations,
      activeConversations,
      messagesSent,
      messagesDelivered,
      messagesRead,
      customerReplies,
      openLeads,
      closedLeads,
    }
  }
}
