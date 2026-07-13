import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { OutreachError } from '../types'
import type { BusinessDetail } from '../types'
import type { OutreachQueryInput } from '../validators'

export class BusinessMappingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async getBusinessById(id: string, organizationId: string): Promise<BusinessDetail> {
    const business = await this.prisma.campaignBusiness.findUnique({
      where: { id },
      include: {
        campaign: { select: { name: true, organizationId: true } },
      },
    })

    if (!business || business.campaign.organizationId !== organizationId) {
      throw new OutreachError('Business not found', 'NOT_FOUND', 404)
    }

    let outreachJobStatus: string | null = null
    if (business.outreachJobId) {
      const job = await this.prisma.outreachJob.findUnique({
        where: { id: business.outreachJobId },
        select: { status: true },
      })
      outreachJobStatus = job?.status ?? null
    }

    return {
      id: business.id,
      businessName: business.businessName,
      phone: business.phone,
      email: business.email,
      industry: business.industry,
      previewUrl: business.previewUrl,
      personalizedMessage: business.personalizedMessage,
      status: business.status,
      campaignId: business.campaignId,
      campaignName: business.campaign.name,
      outreachJobId: business.outreachJobId,
      outreachJobStatus,
      contactId: business.contactId,
      conversationId: business.conversationId,
      createdAt: business.createdAt.toISOString(),
    }
  }

  async listBusinesses(
    organizationId: string,
    params: OutreachQueryInput,
  ): Promise<{ items: BusinessDetail[]; total: number }> {
    const where: Record<string, unknown> = {
      campaign: { organizationId },
    }

    if (params.status) {
      where['status'] = params.status
    }

    if (params.campaignId) {
      where['campaignId'] = params.campaignId
    }

    if (params.search) {
      where['OR'] = [
        { businessName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.campaignBusiness.findMany({
        where: where as any,
        include: {
          campaign: { select: { name: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.campaignBusiness.count({ where: where as any }),
    ])

    return {
      items: items.map(b => ({
        id: b.id,
        businessName: b.businessName,
        phone: b.phone,
        email: b.email,
        industry: b.industry,
        previewUrl: b.previewUrl,
        personalizedMessage: b.personalizedMessage,
        status: b.status,
        campaignId: b.campaignId,
        campaignName: b.campaign.name,
        outreachJobId: b.outreachJobId,
        outreachJobStatus: null,
        contactId: b.contactId,
        conversationId: b.conversationId,
        createdAt: b.createdAt.toISOString(),
      })),
      total,
    }
  }

  async updateBusinessMapping(
    businessId: string,
    updates: {
      contactId?: string
      conversationId?: string
      outreachJobId?: string
      status?: string
    },
  ): Promise<void> {
    await this.prisma.campaignBusiness.update({
      where: { id: businessId },
      data: updates,
    })
  }

  async getBusinessByPhone(phone: string, organizationId: string): Promise<BusinessDetail | null> {
    const business = await this.prisma.campaignBusiness.findFirst({
      where: {
        phone,
        campaign: { organizationId },
      },
      include: {
        campaign: { select: { name: true, organizationId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!business) return null

    return {
      id: business.id,
      businessName: business.businessName,
      phone: business.phone,
      email: business.email,
      industry: business.industry,
      previewUrl: business.previewUrl,
      personalizedMessage: business.personalizedMessage,
      status: business.status,
      campaignId: business.campaignId,
      campaignName: business.campaign.name,
      outreachJobId: business.outreachJobId,
      outreachJobStatus: null,
      contactId: business.contactId,
      conversationId: business.conversationId,
      createdAt: business.createdAt.toISOString(),
    }
  }

  async getTraceability(businessId: string): Promise<{
    business: BusinessDetail
    campaign: { id: string; name: string; status: string; organizationId: string } | null
    outreachJob: { id: string; status: string; createdAt: string } | null
    conversation: { id: string; status: string } | null
    contact: { id: string; name: string | null; phone: string | null } | null
  }> {
    const business = await this.prisma.campaignBusiness.findUnique({
      where: { id: businessId },
      include: {
        campaign: { select: { id: true, name: true, status: true, organizationId: true } },
      },
    })

    if (!business) {
      throw new OutreachError('Business not found', 'NOT_FOUND', 404)
    }

    const orgId = business.campaign.organizationId

    let outreachJob: { id: string; status: string; createdAt: Date } | null = null
    if (business.outreachJobId) {
      outreachJob = await this.prisma.outreachJob.findUnique({
        where: { id: business.outreachJobId },
        select: { id: true, status: true, createdAt: true },
      })
    }

    let conversation: { id: string; status: string } | null = null
    if (business.conversationId) {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: business.conversationId },
        select: { id: true, status: true },
      })
    }

    let contact: { id: string; name: string | null; phone: string | null } | null = null
    if (business.contactId) {
      contact = await this.prisma.contact.findUnique({
        where: { id: business.contactId },
        select: { id: true, name: true, phone: true },
      })
    }

    return {
      business: await this.getBusinessById(business.id, orgId),
      campaign: business.campaign,
      outreachJob: outreachJob
        ? { ...outreachJob, createdAt: outreachJob.createdAt.toISOString() }
        : null,
      conversation,
      contact,
    }
  }
}
