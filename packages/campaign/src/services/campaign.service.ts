import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { CampaignError, type CampaignStatus } from '../types'
import { CampaignRepository } from '../repositories/campaign.repository'
import { CampaignLogRepository } from '../repositories/campaign-log.repository'
import { CampaignStatisticsRepository } from '../repositories/campaign-statistics.repository'
import { CampaignValidationService } from './campaign-validation.service'
import type { CreateCampaignInput, UpdateCampaignInput } from '../validators'

export class CampaignService {
  private readonly campaignRepo: CampaignRepository
  private readonly logRepo: CampaignLogRepository
  private readonly statsRepo: CampaignStatisticsRepository
  private readonly validation: CampaignValidationService

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.campaignRepo = new CampaignRepository(prisma)
    this.logRepo = new CampaignLogRepository(prisma)
    this.statsRepo = new CampaignStatisticsRepository(prisma)
    this.validation = new CampaignValidationService()
  }

  async findAll(
    organizationId: string,
    params: {
      page: number
      limit: number
      status?: string
      channel?: string
      search?: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
    },
  ) {
    const result = await this.campaignRepo.findByOrganization(organizationId, params)

    const items = result.items.map((item) => ({
      id: item.id,
      name: item.name,
      channel: item.channel,
      status: item.status as CampaignStatus,
      createdAt: item.createdAt.toISOString(),
      totalBusinesses: item._count.businesses,
      progress: 0,
    }))

    return { items, total: result.total, page: result.page, limit: result.limit }
  }

  async findById(id: string, organizationId: string) {
    const campaign = await this.campaignRepo.findById(id)

    if (!campaign || campaign.organizationId !== organizationId) {
      throw new CampaignError('Campaign not found', 'NOT_FOUND', 404)
    }

    const stats = await this.statsRepo.findByCampaign(id)
    const totalProcessed = stats
      ? stats.sent + stats.delivered + stats.read + stats.failed + stats.replied
      : 0
    const totalBusinesses = stats?.totalBusinesses ?? 0
    const progress = totalBusinesses > 0 ? Math.round((totalProcessed / totalBusinesses) * 100) : 0

    return {
      ...campaign,
      status: campaign.status as CampaignStatus,
      statistics: stats
        ? {
            ...stats,
            progress,
            totalProcessed,
          }
        : null,
    }
  }

  async create(input: CreateCampaignInput, organizationId: string, userId: string) {
    const campaign = await this.campaignRepo.create({
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      channel: input.channel,
      status: 'draft',
      organization: { connect: { id: organizationId } },
      creator: userId ? { connect: { id: userId } } : undefined,
    })

    await this.statsRepo.upsert(campaign.id, {})

    await this.logRepo.create({
      campaign: { connect: { id: campaign.id } },
      action: 'campaign.created',
      message: `Campaign "${campaign.name}" created`,
      user: userId ? { connect: { id: userId } } : undefined,
    })

    this.logger.info('Campaign created', { campaignId: campaign.id, organizationId })

    return campaign
  }

  async update(id: string, input: UpdateCampaignInput, organizationId: string, userId: string) {
    const existing = await this.campaignRepo.findById(id)

    if (!existing || existing.organizationId !== organizationId) {
      throw new CampaignError('Campaign not found', 'NOT_FOUND', 404)
    }

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name.trim()
    if (input.description !== undefined) data.description = input.description?.trim() ?? null
    if (input.channel !== undefined) data.channel = input.channel

    const campaign = await this.campaignRepo.update(id, data)

    await this.logRepo.create({
      campaign: { connect: { id } },
      action: 'campaign.updated',
      message: input.name
        ? `Campaign renamed to "${input.name}"`
        : 'Campaign details updated',
      user: userId ? { connect: { id: userId } } : undefined,
    })

    this.logger.info('Campaign updated', { campaignId: id })

    return campaign
  }

  async duplicate(id: string, organizationId: string, userId: string) {
    const existing = await this.campaignRepo.findById(id)

    if (!existing || existing.organizationId !== organizationId) {
      throw new CampaignError('Campaign not found', 'NOT_FOUND', 404)
    }

    const campaign = await this.campaignRepo.create({
      name: `${existing.name} (Copy)`,
      description: existing.description,
      channel: existing.channel,
      status: 'draft',
      organization: { connect: { id: organizationId } },
      creator: userId ? { connect: { id: userId } } : undefined,
    })

    await this.statsRepo.upsert(campaign.id, {})

    const businesses = await this.prisma.campaignBusiness.findMany({
      where: { campaignId: id },
    })

    if (businesses.length > 0) {
      await this.prisma.campaignBusiness.createMany({
        data: businesses.map((b) => ({
          campaignId: campaign.id,
          businessName: b.businessName,
          phone: b.phone,
          email: b.email,
          industry: b.industry,
          previewUrl: b.previewUrl,
          personalizedMessage: b.personalizedMessage,
          status: 'pending',
        })),
      })

      await this.statsRepo.upsert(campaign.id, { totalBusinesses: businesses.length, pending: businesses.length })
    }

    await this.logRepo.create({
      campaign: { connect: { id: campaign.id } },
      action: 'campaign.duplicated',
      message: `Campaign duplicated from "${existing.name}"`,
      user: userId ? { connect: { id: userId } } : undefined,
    })

    this.logger.info('Campaign duplicated', { campaignId: campaign.id, sourceId: id })

    return campaign
  }

  async delete(id: string, organizationId: string, userId: string) {
    const existing = await this.campaignRepo.findById(id)

    if (!existing || existing.organizationId !== organizationId) {
      throw new CampaignError('Campaign not found', 'NOT_FOUND', 404)
    }

    if (existing.status === 'running') {
      throw new CampaignError(
        'Cannot delete a running campaign. Pause or complete it first.',
        'CAMPAIGN_RUNNING',
        409,
      )
    }

    await this.campaignRepo.softDelete(id)

    await this.logRepo.create({
      campaign: { connect: { id } },
      action: 'campaign.deleted',
      message: `Campaign "${existing.name}" deleted`,
      user: userId ? { connect: { id: userId } } : undefined,
    })

    this.logger.info('Campaign deleted', { campaignId: id })
  }

  async transitionStatus(
    id: string,
    newStatus: CampaignStatus,
    organizationId: string,
    userId: string,
  ): Promise<{ id: string; status: CampaignStatus; message: string }> {
    const existing = await this.campaignRepo.findById(id)

    if (!existing || existing.organizationId !== organizationId) {
      throw new CampaignError('Campaign not found', 'NOT_FOUND', 404)
    }

    const currentStatus = existing.status as CampaignStatus
    this.validation.validateTransition(currentStatus, newStatus)

    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'running') updateData.startedAt = new Date()
    if (newStatus === 'completed' || newStatus === 'cancelled' || newStatus === 'failed') {
      updateData.completedAt = new Date()
    }

    await this.campaignRepo.update(id, updateData)

    const actionMap: Record<string, string> = {
      ready: 'campaign.updated',
      running: 'campaign.started',
      paused: 'campaign.paused',
      completed: 'campaign.completed',
      cancelled: 'campaign.cancelled',
    }

    const action = actionMap[newStatus] || 'campaign.updated'
    const message =
      newStatus === 'ready'
        ? `Campaign "${existing.name}" marked as ready`
        : `Campaign "${existing.name}" ${newStatus}`

    await this.logRepo.create({
      campaign: { connect: { id } },
      action,
      message,
      user: userId ? { connect: { id: userId } } : undefined,
    })

    this.logger.info('Campaign status changed', {
      campaignId: id,
      from: currentStatus,
      to: newStatus,
    })

    return { id, status: newStatus, message: `Campaign status changed to "${newStatus}"` }
  }
}
