import type { PrismaClient } from '@prisma/client'
import type { ChannelAnalytics } from '../types'

export class ChannelAnalyticsProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalytics(organizationId?: string): Promise<ChannelAnalytics[]> {
    const channelConversations = await this.prisma.conversation.groupBy({
      by: ['channel'],
      where: {
        channel: { not: null },
      },
      _count: { id: true },
    })

    const channels = channelConversations
      .filter((c) => c.channel !== null)
      .map((c) => ({ channel: c.channel!, count: c._count.id }))

    const results: ChannelAnalytics[] = []

    for (const ch of channels) {
      const conversationWhere: Record<string, unknown> = { channel: ch.channel }

      const [messagesCount, deliveriesCount, repliesCount, failuresCount, activeConversations] =
        await Promise.all([
          this.prisma.message.count({
            where: {
              conversation: conversationWhere,
            },
          }),
          this.prisma.deliveryEvent.count({
            where: {
              channel: ch.channel,
            },
          }),
          this.prisma.message.count({
            where: {
              conversation: conversationWhere,
              direction: 'inbound',
            },
          }),
          this.prisma.outreachJob.count({
            where: {
              status: 'failed',
              campaign: { channel: ch.channel },
            },
          }),
          this.prisma.conversation.count({
            where: {
              channel: ch.channel,
              status: 'active',
            },
          }),
        ])

      results.push({
        channel: ch.channel,
        messages: messagesCount,
        deliveries: deliveriesCount,
        replies: repliesCount,
        failures: failuresCount,
        activeConversations,
      })
    }

    return results
  }
}
