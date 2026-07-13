import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { OutreachError } from '../types'
import type { ImportJobStatus, ImportRecordData, SingleOutreachRequest, ImportFileType } from '../types'
import { singleOutreachSchema } from '../validators'
import { CampaignIntegrationService } from './campaign-integration.service'
import { parse as csvParse } from 'csv-parse/sync'

interface ImportResult {
  importJobId: string
  status: string
  totalRecords: number
  successCount: number
  failedCount: number
  campaignId: string | null
}

export class ImportService {
  private readonly campaignIntegration: CampaignIntegrationService

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.campaignIntegration = new CampaignIntegrationService(prisma, logger)
  }

  async createImportJob(
    type: ImportFileType,
    organizationId: string,
    campaignName?: string,
    campaignId?: string,
    userId?: string,
  ): Promise<{ id: string }> {
    const job = await this.prisma.importJob.create({
      data: {
        type,
        status: 'pending',
        organizationId,
        campaignId: campaignId ?? null,
        createdBy: userId,
      },
    })

    return { id: job.id }
  }

  async processJsonImport(
    importJobId: string,
    businesses: SingleOutreachRequest[],
    organizationId: string,
    userId?: string,
  ): Promise<ImportResult> {
    const job = await this.prisma.importJob.findUnique({ where: { id: importJobId } })
    if (!job) throw new OutreachError('Import job not found', 'NOT_FOUND', 404)

    await this.prisma.importJob.update({
      where: { id: importJobId },
      data: { status: 'processing', totalRecords: businesses.length },
    })

    await this.prisma.importRecord.createMany({
      data: businesses.map((b, i) => ({
        importJobId,
        rowNumber: i + 1,
        businessName: b.businessName,
        phone: b.phone,
        email: b.email,
        industry: b.industry,
        previewUrl: b.previewUrl,
        personalizedMessage: b.personalizedMessage,
        rawData: b as any,
        status: 'pending',
      })),
    })

    const validated: Array<{
      businessName: string
      phone: string
      email?: string
      industry?: string
      previewUrl?: string
      personalizedMessage: string
    }> = []
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i]
      const result = singleOutreachSchema.safeParse(b)
      if (result.success) {
        validated.push({
          businessName: result.data.businessName,
          phone: result.data.phone,
          email: result.data.email || undefined,
          industry: result.data.industry || undefined,
          previewUrl: result.data.previewUrl || undefined,
          personalizedMessage: result.data.personalizedMessage,
        })
      } else {
        const zIssues = result.error.issues
        const fieldErrors = zIssues.map(e => e.message).join('; ')
        errors.push({ row: i + 1, message: fieldErrors })
        await this.prisma.importRecord.updateMany({
          where: { importJobId, rowNumber: i + 1 },
          data: {
            status: 'invalid',
            errors: zIssues.map(e => ({ field: e.path.join('.'), message: e.message })),
          },
        })
      }
    }

    if (validated.length === 0) {
      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: {
          status: 'failed',
          failedCount: businesses.length,
          errorSummary: errors,
          completedAt: new Date(),
        },
      })
      return { importJobId, status: 'failed', totalRecords: businesses.length, successCount: 0, failedCount: businesses.length, campaignId: job.campaignId }
    }

    try {
      const campaignName = businesses[0]?.campaignName ?? undefined
      const industry = validated.find(b => b.industry)?.industry
      const result = await this.campaignIntegration.getOrCreateCampaignAndImport(
        validated,
        organizationId,
        campaignName ?? undefined,
        industry,
        userId,
      )

      const recordIds = await this.prisma.importRecord.findMany({
        where: { importJobId, status: 'pending' },
        select: { id: true, rowNumber: true, phone: true },
      })

      const businessByPhone = new Map(result.businesses.map(b => [b.phone, b]))

      for (const record of recordIds) {
        const matched = record.phone ? businessByPhone.get(record.phone) : null
        if (matched) {
          await this.prisma.importRecord.update({
            where: { id: record.id },
            data: {
              status: 'imported',
              campaignBusinessId: matched.id,
            },
          })
        }
      }

      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: {
          status: 'completed',
          successCount: result.businesses.length,
          failedCount: errors.length,
          campaignId: result.campaign?.id ?? job.campaignId,
          errorSummary: errors.length > 0 ? errors : [],
          completedAt: new Date(),
        },
      })

      return {
        importJobId,
        status: 'completed',
        totalRecords: businesses.length,
        successCount: result.businesses.length,
        failedCount: errors.length,
        campaignId: result.campaign?.id ?? job.campaignId,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import processing failed'
      this.logger.error({ importJobId, error: message }, 'Import processing failed')

      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: {
          status: 'failed',
          errorSummary: [{ row: 0, message }],
          completedAt: new Date(),
        },
      })

      return {
        importJobId,
        status: 'failed',
        totalRecords: businesses.length,
        successCount: 0,
        failedCount: businesses.length,
        campaignId: null,
      }
    }
  }

  async processCsvImport(
    importJobId: string,
    csvContent: string,
    organizationId: string,
    userId?: string,
  ): Promise<ImportResult> {
    const job = await this.prisma.importJob.findUnique({ where: { id: importJobId } })
    if (!job) throw new OutreachError('Import job not found', 'NOT_FOUND', 404)

    let records: Record<string, string>[]
    try {
      records = csvParse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV parse failed'
      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: { status: 'failed', errorSummary: [{ row: 0, message }], completedAt: new Date() },
      })
      return { importJobId, status: 'failed', totalRecords: 0, successCount: 0, failedCount: 0, campaignId: null }
    }

    const businesses: SingleOutreachRequest[] = records.map((r, i) => ({
      businessName: r['businessName'] ?? r['BusinessName'] ?? r['business_name'] ?? '',
      phone: r['phone'] ?? r['Phone'] ?? '',
      email: r['email'] ?? r['Email'] ?? undefined,
      industry: r['industry'] ?? r['Industry'] ?? undefined,
      previewUrl: r['previewUrl'] ?? r['PreviewUrl'] ?? r['preview_url'] ?? undefined,
      personalizedMessage: r['personalizedMessage'] ?? r['PersonalizedMessage'] ?? r['personalized_message'] ?? '',
      contactPerson: r['contactPerson'] ?? undefined,
      campaignName: r['campaignName'] ?? undefined,
      tags: r['tags'] ? r['tags'].split(',').map(t => t.trim()) : undefined,
    }))

    return this.processJsonImport(importJobId, businesses, organizationId, userId)
  }

  async getImportJob(id: string, organizationId: string): Promise<ImportJobStatus> {
    const job = await this.prisma.importJob.findUnique({ where: { id } })
    if (!job || job.organizationId !== organizationId) {
      throw new OutreachError('Import job not found', 'NOT_FOUND', 404)
    }

    return {
      id: job.id,
      type: job.type as ImportFileType,
      status: job.status as any,
      totalRecords: job.totalRecords,
      successCount: job.successCount,
      failedCount: job.failedCount,
      errorSummary: (job.errorSummary as Array<{ row: number; message: string }>) ?? [],
      campaignId: job.campaignId,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
    }
  }

  async listImportJobs(organizationId: string, page: number = 1, limit: number = 20): Promise<{ items: ImportJobStatus[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.importJob.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.importJob.count({ where: { organizationId } }),
    ])

    return {
      items: items.map(job => ({
        id: job.id,
        type: job.type as ImportFileType,
        status: job.status as any,
        totalRecords: job.totalRecords,
        successCount: job.successCount,
        failedCount: job.failedCount,
        errorSummary: (job.errorSummary as Array<{ row: number; message: string }>) ?? [],
        campaignId: job.campaignId,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString() ?? null,
      })),
      total,
    }
  }

  async getImportRecords(
    importJobId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ items: ImportRecordData[]; total: number }> {
    const job = await this.prisma.importJob.findUnique({ where: { id: importJobId } })
    if (!job || job.organizationId !== organizationId) {
      throw new OutreachError('Import job not found', 'NOT_FOUND', 404)
    }

    const [items, total] = await Promise.all([
      this.prisma.importRecord.findMany({
        where: { importJobId },
        orderBy: { rowNumber: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.importRecord.count({ where: { importJobId } }),
    ])

    return {
      items: items.map(r => ({
        id: r.id,
        rowNumber: r.rowNumber,
        businessName: r.businessName,
        phone: r.phone,
        email: r.email,
        status: r.status,
        errors: (r.errors as Array<{ field: string; message: string }>) ?? [],
        campaignBusinessId: r.campaignBusinessId,
      })),
      total,
    }
  }
}
