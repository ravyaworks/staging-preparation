import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { CsvExportService } from './csv.export'
import { XlsxExportService } from './xlsx.export'
import { PdfExportService } from './pdf.export'

export class ReportGenerator {
  private readonly csvExport: CsvExportService
  private readonly xlsxExport: XlsxExportService
  private readonly pdfExport: PdfExportService

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.csvExport = new CsvExportService()
    this.xlsxExport = new XlsxExportService()
    this.pdfExport = new PdfExportService()
  }

  async generate(
    data: Record<string, unknown>[],
    format: 'csv' | 'xlsx' | 'pdf',
    columns: string[],
    title?: string,
  ): Promise<Buffer> {
    this.logger.info(`Generating ${format} report with ${data.length} rows`)

    switch (format) {
      case 'csv':
        return this.csvExport.export(data, columns)
      case 'xlsx':
        return this.xlsxExport.export(data, columns, undefined, title)
      case 'pdf':
        return this.pdfExport.export(data, columns, title)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  async generateCampaignReport(
    organizationId?: string,
    startDate?: string,
    endDate?: string,
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    this.logger.info('Generating campaign report', { organizationId, startDate, endDate, format })

    const where: Record<string, unknown> = {}
    if (organizationId) where.organizationId = organizationId
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      select: {
        id: true,
        name: true,
        channel: true,
        status: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      status: c.status,
      createdAt: c.createdAt,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
    }))

    const columns = ['id', 'name', 'channel', 'status', 'createdAt', 'startedAt', 'completedAt']
    const buffer = await this.generate(data, format, columns, 'Campaign Report')

    const dateStr = (startDate ?? new Date().toISOString().split('T')[0])!
    const filename = `campaign-report-${dateStr}.${format}`
    const mimeType = this.getMimeType(format)

    return { buffer, filename, mimeType }
  }

  async generateConversationReport(
    tenantId?: string,
    startDate?: string,
    endDate?: string,
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    this.logger.info('Generating conversation report', { tenantId, startDate, endDate, format })

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      select: {
        id: true,
        status: true,
        channel: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = conversations.map((c) => ({
      id: c.id,
      status: c.status,
      channel: c.channel,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      tenantId: c.tenantId,
    }))

    const columns = ['id', 'status', 'channel', 'createdAt', 'updatedAt', 'tenantId']
    const buffer = await this.generate(data, format, columns, 'Conversation Report')

    const dateStr = (startDate ?? new Date().toISOString().split('T')[0])!
    const filename = `conversation-report-${dateStr}.${format}`
    const mimeType = this.getMimeType(format)

    return { buffer, filename, mimeType }
  }

  async generateDeliveryReport(
    campaignId?: string,
    startDate?: string,
    endDate?: string,
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    this.logger.info('Generating delivery report', { campaignId, startDate, endDate, format })

    const where: Record<string, unknown> = {}
    if (campaignId) where.campaignId = campaignId
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }

    const events = await this.prisma.deliveryEvent.findMany({
      where,
      select: {
        id: true,
        type: true,
        timestamp: true,
        jobId: true,
      },
      orderBy: { timestamp: 'desc' },
    })

    const data = events.map((e) => ({
      id: e.id,
      type: e.type,
      timestamp: e.timestamp,
      jobId: e.jobId,
    }))

    const columns = ['id', 'type', 'timestamp', 'jobId']
    const buffer = await this.generate(data, format, columns, 'Delivery Report')

    const dateStr = (startDate ?? new Date().toISOString().split('T')[0])!
    const filename = `delivery-report-${dateStr}.${format}`
    const mimeType = this.getMimeType(format)

    return { buffer, filename, mimeType }
  }

  async generateOrganizationReport(
    organizationId?: string,
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    this.logger.info('Generating organization report', { organizationId, format })

    const orgWhere: Record<string, unknown> = organizationId ? { id: organizationId } : {}

    const organizations = await this.prisma.organization.findMany({
      where: orgWhere,
      select: {
        id: true,
        name: true,
      },
    })

    const data: Record<string, unknown>[] = []

    for (const org of organizations) {
      const campaignCount = await this.prisma.campaign.count({
        where: { organizationId: org.id },
      })

      const conversationCount = await this.prisma.conversation.count({
        where: { tenantId: org.id },
      })

      const jobCount = await this.prisma.outreachJob.count({
        where: { campaign: { organizationId: org.id } },
      })

      const deliveredCount = await this.prisma.outreachJob.count({
        where: { campaign: { organizationId: org.id }, status: 'delivered' },
      })

      const failedCount = await this.prisma.outreachJob.count({
        where: { campaign: { organizationId: org.id }, status: 'failed' },
      })

      data.push({
        organizationId: org.id,
        organizationName: org.name,
        campaignCount,
        conversationCount,
        totalJobs: jobCount,
        deliveredJobs: deliveredCount,
        failedJobs: failedCount,
        deliveryRate: jobCount > 0 ? Math.round((deliveredCount / jobCount) * 100 * 100) / 100 : 0,
      })
    }

    const columns = [
      'organizationId',
      'organizationName',
      'campaignCount',
      'conversationCount',
      'totalJobs',
      'deliveredJobs',
      'failedJobs',
      'deliveryRate',
    ]

    const buffer = await this.generate(data, format, columns, 'Organization Summary Report')
    const dateStr = new Date().toISOString().split('T')[0]!
    const filename = `organization-report-${dateStr}.${format}`
    const mimeType = this.getMimeType(format)

    return { buffer, filename, mimeType }
  }

  private getMimeType(format: 'csv' | 'xlsx' | 'pdf'): string {
    switch (format) {
      case 'csv':
        return 'text/csv'
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case 'pdf':
        return 'application/pdf'
    }
  }
}
