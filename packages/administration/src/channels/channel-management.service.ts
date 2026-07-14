import type { PrismaClient } from '@prisma/client'

export class ChannelManagementService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(tenantId: string) {
    const channels = await this.prisma.channelConnection.findMany({
      where: { tenantId },
      orderBy: { channelType: 'asc' },
    })
    const integrations = await this.prisma.integration.findMany({
      where: { tenantId },
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    return {
      channels: channels.map(c => ({
        id: c.id,
        type: c.channelType,
        name: c.name,
        status: c.status,
        config: c.config,
        connectedAt: c.connectedAt,
        lastActivity: c.lastActivity,
        error: c.error,
        metadata: c.metadata,
      })),
      integrations: integrations.map(i => ({
        id: i.id,
        channelType: i.channelType,
        name: i.name,
        enabled: i.enabled,
        status: i.status,
        error: i.error,
        connectedAt: i.connectedAt,
        recentLogs: i.logs,
      })),
    }
  }

  async getByType(tenantId: string, channelType: string) {
    const channel = await this.prisma.channelConnection.findUnique({
      where: { tenantId_channelType: { tenantId, channelType } },
    })
    if (!channel) {
      const err = new Error('Channel not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    return channel
  }

  async updateStatus(tenantId: string, channelType: string, status: string, error?: string) {
    const channel = await this.prisma.channelConnection.findUnique({
      where: { tenantId_channelType: { tenantId, channelType } },
    })
    if (!channel) {
      const err = new Error('Channel not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    return this.prisma.channelConnection.update({
      where: { tenantId_channelType: { tenantId, channelType } },
      data: { status, error, lastActivity: new Date() },
    })
  }
}
