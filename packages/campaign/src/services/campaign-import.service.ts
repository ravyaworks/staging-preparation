import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { CampaignError, type ImportResult, type CsvRow } from '../types'
import { csvImportRowSchema } from '../validators'

export class CampaignImportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async importBusinesses(
    campaignId: string,
    rows: CsvRow[],
  ): Promise<ImportResult> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      throw new CampaignError('Campaign not found', 'NOT_FOUND', 404)
    }

    const validBusinesses: {
      campaignId: string
      businessName: string
      phone: string
      email: string | null
      industry: string | null
      previewUrl: string | null
      personalizedMessage: string
      status: string
    }[] = []

    const duplicates: ImportResult['errors'] = []
    const validationErrors: ImportResult['errors'] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1

      const parsed = csvImportRowSchema.safeParse(row)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          validationErrors.push({
            row: rowNum,
            field: issue.path.join('.'),
            message: issue.message,
            value: String(issue.input ?? ''),
          })
        }
        continue
      }

      const existing = await this.prisma.campaignBusiness.findUnique({
        where: { campaignId_phone: { campaignId, phone: parsed.data.phone } },
      })

      if (existing) {
        duplicates.push({
          row: rowNum,
          field: 'phone',
          message: `Duplicate phone number "${parsed.data.phone}" already in campaign`,
          value: parsed.data.phone,
        })
        continue
      }

      validBusinesses.push({
        campaignId,
        businessName: parsed.data.businessName.trim(),
        phone: parsed.data.phone.trim(),
        email: parsed.data.email?.trim() || null,
        industry: parsed.data.industry?.trim() || null,
        previewUrl: parsed.data.previewUrl?.trim() || null,
        personalizedMessage: parsed.data.personalizedMessage.trim(),
        status: 'pending',
      })
    }

    if (validBusinesses.length === 0 && validationErrors.length === 0 && duplicates.length === 0) {
      throw new CampaignError('No valid businesses to import', 'NO_DATA', 400)
    }

    if (validBusinesses.length > 0) {
      await this.prisma.campaignBusiness.createMany({ data: validBusinesses })
      await this.prisma.campaignStatistics.upsert({
        where: { campaignId },
        create: {
          campaignId,
          totalBusinesses: validBusinesses.length,
          pending: validBusinesses.length,
        },
        update: {
          totalBusinesses: { increment: validBusinesses.length },
          pending: { increment: validBusinesses.length },
        },
      })
    }

    await this.prisma.campaignLog.create({
      data: {
        campaign: { connect: { id: campaignId } },
        action: 'businesses.imported',
        message: `Imported ${validBusinesses.length} businesses (${duplicates.length} duplicates, ${validationErrors.length} errors)`,
        metadata: {
          imported: validBusinesses.length,
          duplicates: duplicates.length,
          errors: validationErrors.length,
        },
      },
    })

    this.logger.info('Campaign import completed', {
      campaignId,
      imported: validBusinesses.length,
      duplicates: duplicates.length,
      errors: validationErrors.length,
    })

    return {
      imported: validBusinesses.length,
      duplicates: duplicates.length,
      errors: [...validationErrors, ...duplicates],
    }
  }
}
