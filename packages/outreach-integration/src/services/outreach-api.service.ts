import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { CampaignExecutor, loadExecutorConfig } from '@conversation-platform/campaign-executor'
import type { IOutreachSender } from '@conversation-platform/campaign-executor'
import { OutreachError } from '../types'
import type { SingleOutreachRequest, OutreachSubmitResult, BusinessDetail, ImportJobStatus, ImportFileType } from '../types'
import type { OutreachQueryInput } from '../validators'
import { singleOutreachSchema } from '../validators'
import { CampaignIntegrationService } from './campaign-integration.service'
import { BusinessMappingService } from './business-mapping.service'
import { ImportService } from './import.service'
import { ApiKeyService } from './api-key.service'

export class OutreachApiService {
  public readonly campaignIntegration: CampaignIntegrationService
  public readonly businessMapping: BusinessMappingService
  public readonly importService: ImportService
  public readonly apiKeyService: ApiKeyService
  private executor: CampaignExecutor | null = null

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
    private readonly sender?: IOutreachSender,
  ) {
    this.campaignIntegration = new CampaignIntegrationService(prisma, logger)
    this.businessMapping = new BusinessMappingService(prisma, logger)
    this.importService = new ImportService(prisma, logger)
    this.apiKeyService = new ApiKeyService(prisma, logger)
  }

  getExecutor(): CampaignExecutor {
    if (!this.executor) {
      const config = loadExecutorConfig()
      this.executor = new CampaignExecutor(this.prisma, this.sender!, config, this.logger)
    }
    return this.executor
  }

  async start(): Promise<void> {
    if (this.executor) {
      await this.executor.start()
    }
  }

  async stop(): Promise<void> {
    if (this.executor) {
      await this.executor.stop()
    }
  }

  async submitSingle(
    request: SingleOutreachRequest,
    organizationId: string,
    userId?: string,
  ): Promise<OutreachSubmitResult> {
    const parsed = singleOutreachSchema.safeParse(request)
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.issues.map(e => ({
          row: 0,
          field: e.path.join('.'),
          message: e.message,
          value: String(e.path),
        })),
      }
    }

    const result = await this.campaignIntegration.getOrCreateCampaignAndImport(
      [{
        businessName: parsed.data.businessName,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        industry: parsed.data.industry || undefined,
        previewUrl: parsed.data.previewUrl || undefined,
        personalizedMessage: parsed.data.personalizedMessage,
      }],
      organizationId,
      parsed.data.campaignName || undefined,
      parsed.data.industry || undefined,
      userId,
    )

    if (result.businesses.length === 0) {
      return {
        success: false,
        errors: [{ row: 0, field: 'business', message: 'Business already exists in campaign or creation failed' }],
      }
    }

    const business = result.businesses[0]!
    return {
      success: true,
      campaignId: result.campaign?.id,
      businesses: [{
        businessName: business.businessName,
        phone: business.phone,
        status: 'imported',
        campaignBusinessId: business.id,
      }],
    }
  }

  async submitBulk(
    businesses: SingleOutreachRequest[],
    organizationId: string,
    userId?: string,
  ): Promise<OutreachSubmitResult> {
    const importJob = await this.importService.createImportJob(
      'json',
      organizationId,
      undefined,
      undefined,
      userId,
    )

    try {
      const result = await this.importService.processJsonImport(
        importJob.id,
        businesses,
        organizationId,
        userId,
      )

      const items = await this.importService.getImportRecords(importJob.id, organizationId, 1, result.totalRecords)

      return {
        success: result.status === 'completed',
        importJobId: importJob.id,
        campaignId: result.campaignId ?? undefined,
        businesses: items.items
          .filter(r => r.status === 'imported')
          .map(r => ({
            businessName: r.businessName ?? '',
            phone: r.phone ?? '',
            status: 'imported' as const,
            campaignBusinessId: r.campaignBusinessId ?? undefined,
          })),
        errors: items.items
          .filter(r => r.status === 'invalid' || r.status === 'failed')
          .map(r => ({
            row: r.rowNumber ?? 0,
            field: 'business',
            message: r.errors.map(e => e.message).join('; '),
            value: r.businessName ?? undefined,
          })),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk submission failed'
      this.logger.error({ importJobId: importJob.id, error: message }, 'Bulk submission failed')
      return { success: false, errors: [{ row: 0, field: 'import', message }] }
    }
  }

  async submitImport(
    type: ImportFileType,
    data: SingleOutreachRequest[] | string,
    organizationId: string,
    campaignName?: string,
    campaignId?: string,
    userId?: string,
  ): Promise<OutreachSubmitResult> {
    const importJob = await this.importService.createImportJob(
      type,
      organizationId,
      campaignName,
      campaignId,
      userId,
    )

    try {
      const result = type === 'csv'
        ? await this.importService.processCsvImport(importJob.id, data as string, organizationId, userId)
        : await this.importService.processJsonImport(importJob.id, data as SingleOutreachRequest[], organizationId, userId)

      return {
        success: result.status === 'completed',
        importJobId: importJob.id,
        campaignId: result.campaignId ?? undefined,
        errors: result.status === 'failed' ? [{ row: 0, field: 'import', message: 'Import processing failed' }] : undefined,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed'
      this.logger.error({ importJobId: importJob.id, error: message }, 'Import failed')
      return { success: false, importJobId: importJob.id, errors: [{ row: 0, field: 'import', message }] }
    }
  }

  async getImportJobStatus(id: string, organizationId: string): Promise<ImportJobStatus> {
    return this.importService.getImportJob(id, organizationId)
  }

  async listImportJobs(organizationId: string, page: number = 1, limit: number = 20) {
    return this.importService.listImportJobs(organizationId, page, limit)
  }

  async getImportJobRecords(id: string, organizationId: string, page: number = 1, limit: number = 50) {
    return this.importService.getImportRecords(id, organizationId, page, limit)
  }

  async getBusiness(id: string, organizationId: string): Promise<BusinessDetail> {
    return this.businessMapping.getBusinessById(id, organizationId)
  }

  async listBusinesses(organizationId: string, params: OutreachQueryInput) {
    return this.businessMapping.listBusinesses(organizationId, params)
  }

  async getTraceability(businessId: string) {
    const business = await this.prisma.campaignBusiness.findUnique({
      where: { id: businessId },
      include: { campaign: { select: { organizationId: true } } },
    })
    if (!business) throw new OutreachError('Business not found', 'NOT_FOUND', 404)
    return this.businessMapping.getTraceability(businessId)
  }

  async submitToCampaign(
    campaignId: string,
    businesses: SingleOutreachRequest[],
    organizationId: string,
    userId?: string,
  ): Promise<OutreachSubmitResult> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign || campaign.organizationId !== organizationId) {
      return { success: false, errors: [{ row: 0, field: 'campaignId', message: 'Campaign not found' }] }
    }

    const result = await this.campaignIntegration.importBusinesses(
      campaignId,
      businesses.map(b => ({
        businessName: b.businessName,
        phone: b.phone,
        email: b.email || undefined,
        industry: b.industry || undefined,
        previewUrl: b.previewUrl || undefined,
        personalizedMessage: b.personalizedMessage,
      })),
    )

    return {
      success: result.errors.length === 0,
      campaignId,
      businesses: result.campaignBusinessIds.map(id => ({
        businessName: '',
        phone: '',
        status: 'imported' as const,
        campaignBusinessId: id,
      })),
      errors: result.errors.map(e => ({ row: e.row, field: e.field, message: e.message, value: e.value })),
    }
  }
}
