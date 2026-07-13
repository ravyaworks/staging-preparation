import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { CampaignService, CampaignStatisticsService, CampaignError } from '@conversation-platform/campaign'
import { OutreachError } from '../types'
import type { CampaignData, CampaignIntegrationResult } from '../types'

export type CampaignResolution =
  | { type: 'existing'; campaignId: string }
  | { type: 'auto'; name: string; channel: string }
  | { type: 'named'; name: string; channel: string }

export class CampaignIntegrationService {
  private readonly campaignService: CampaignService
  private readonly statsService: CampaignStatisticsService

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.campaignService = new CampaignService(prisma, logger)
    this.statsService = new CampaignStatisticsService(prisma, logger)
  }

  resolveCampaignConfig(
    campaignName?: string,
    industry?: string,
  ): CampaignResolution {
    if (campaignName) {
      return { type: 'named', name: campaignName, channel: 'whatsapp' }
    }

    if (industry) {
      return { type: 'auto', name: `${industry} Outreach`, channel: 'whatsapp' }
    }

    return { type: 'auto', name: 'General Outreach', channel: 'whatsapp' }
  }

  async resolveCampaign(
    resolution: CampaignResolution,
    organizationId: string,
    userId?: string,
  ): Promise<{ campaignId: string; isNew: boolean }> {
    if (resolution.type === 'existing') {
      return { campaignId: resolution.campaignId, isNew: false }
    }

    const campaignName = resolution.name

    const existing = await this.prisma.campaign.findFirst({
      where: {
        organizationId,
        name: campaignName,
        deletedAt: null,
        status: { notIn: ['completed', 'cancelled'] },
      },
    })

    if (existing) {
      return { campaignId: existing.id, isNew: false }
    }

    try {
      const campaign = await this.campaignService.create(
        { name: campaignName, channel: resolution.channel as any },
        organizationId,
        userId ?? 'system',
      )

      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'ready' },
      })

      this.logger.info({ campaignId: campaign.id, campaignName }, 'Auto-created campaign for outreach')
      return { campaignId: campaign.id, isNew: true }
    } catch (error) {
      if (error instanceof CampaignError) {
        throw new OutreachError(error.message, error.code, error.statusCode)
      }
      throw error
    }
  }

  async importBusinesses(
    campaignId: string,
    businesses: Array<{
      businessName: string
      phone: string
      email?: string
      industry?: string
      previewUrl?: string
      personalizedMessage: string
    }>,
  ): Promise<{
    imported: number
    duplicates: number
    errors: Array<{ row: number; field: string; message: string; value?: string }>
    campaignBusinessIds: string[]
  }> {
    const imported: string[] = []
    let duplicates = 0
    const errors: Array<{ row: number; field: string; message: string; value?: string }> = []

    for (let i = 0; i < businesses.length; i++) {
      const biz = businesses[i]!
      try {
        const existing = await this.prisma.campaignBusiness.findUnique({
          where: { campaignId_phone: { campaignId, phone: biz.phone } },
        })

        if (existing) {
          duplicates++
          continue
        }

        const record = await this.prisma.campaignBusiness.create({
          data: {
            campaignId,
            businessName: biz.businessName,
            phone: biz.phone,
            email: biz.email ?? null,
            industry: biz.industry ?? null,
            previewUrl: biz.previewUrl ?? null,
            personalizedMessage: biz.personalizedMessage,
            status: 'pending',
          },
        })

        imported.push(record.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ row: i + 1, field: 'business', message, value: biz.businessName })
      }
    }

    if (imported.length > 0) {
      await this.statsService.recalculate(campaignId)
    }

    return { imported: imported.length, duplicates, errors, campaignBusinessIds: imported }
  }

  async getOrCreateCampaignAndImport(
    businesses: Array<{
      businessName: string
      phone: string
      email?: string
      industry?: string
      previewUrl?: string
      personalizedMessage: string
    }>,
    organizationId: string,
    campaignName?: string,
    industry?: string,
    userId?: string,
  ): Promise<CampaignIntegrationResult> {
    const resolution = this.resolveCampaignConfig(campaignName, industry)
    const { campaignId } = await this.resolveCampaign(resolution, organizationId, userId)

    const result = await this.importBusinesses(campaignId, businesses)

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    const campaignBusinesses = await this.prisma.campaignBusiness.findMany({
      where: { id: { in: result.campaignBusinessIds } },
    })

    const stats = await this.statsService.getStatistics(campaignId)

    return {
      campaign: campaign ? {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        channel: campaign.channel,
        status: campaign.status,
        organizationId: campaign.organizationId,
        createdBy: campaign.createdBy,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        startedAt: campaign.startedAt?.toISOString() ?? null,
        completedAt: campaign.completedAt?.toISOString() ?? null,
      } : null,
      businesses: campaignBusinesses.map(b => ({
        id: b.id,
        businessName: b.businessName,
        phone: b.phone,
        email: b.email,
        industry: b.industry,
        previewUrl: b.previewUrl,
        personalizedMessage: b.personalizedMessage,
        status: b.status,
        errors: b.errors,
        campaignId: b.campaignId,
        outreachJobId: b.outreachJobId,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
      statistics: stats ? {
        id: stats.id,
        campaignId: stats.campaignId,
        totalBusinesses: stats.totalBusinesses,
        jobsCreated: stats.jobsCreated,
        pending: stats.pending,
        queued: stats.queued,
        sending: stats.sending,
        sent: stats.sent,
        delivered: stats.delivered,
        read: stats.read,
        failed: stats.failed,
        replied: stats.replied,
        updatedAt: stats.updatedAt.toISOString(),
      } : null,
    }
  }
}
