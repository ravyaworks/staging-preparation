import type { PrismaClient } from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import type { BackupRecord } from '../types'

export class BackupService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(page = 1, limit = 20) {
    return {
      data: [] as BackupRecord[],
      total: 0,
      page,
      limit,
      totalPages: 0,
      message: 'Backup service requires database-level backup tooling (e.g. pg_dump). This provides metadata tracking.',
    }
  }

  async create(type: 'database' | 'configuration' | 'full', userId: string, tenantId: string, ip?: string) {
    await this.audit.record({
      action: 'backup.create',
      entity: 'Backup',
      entityId: type,
      metadata: { type },
      userId,
      tenantId,
      ipAddress: ip,
    })
    return {
      id: crypto.randomUUID(),
      type,
      status: 'running' as const,
      size: null,
      path: null,
      metadata: { note: 'Backup initiated. Actual backup execution depends on infrastructure-level tooling.' },
      createdAt: new Date().toISOString(),
      completedAt: null,
    }
  }

  async exportMetadata(tenantId: string) {
    const orgs = await this.prisma.organization.count({ where: { tenantId } })
    const users = await this.prisma.user.count({ where: { tenantId } })
    const campaigns = await this.prisma.campaign.count()
    const conversations = await this.prisma.conversation.count({ where: { tenantId } })
    return { tenantId, orgs, users, campaigns, conversations, exportedAt: new Date().toISOString() }
  }

  async validate() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { valid: true, message: 'Database connection is healthy' }
    } catch (err) {
      return { valid: false, message: err instanceof Error ? err.message : 'Validation failed' }
    }
  }
}
