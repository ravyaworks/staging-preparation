import type { PrismaClient } from '@prisma/client'
import { AuditService } from '../audit/audit.service'

export class FeatureFlagService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId?: string) {
    const where: Record<string, unknown> = {}
    if (tenantId) {
      where.OR = [
        { isGlobal: true },
        { tenantId },
      ]
    }
    return this.prisma.featureFlag.findMany({ where, orderBy: { key: 'asc' } })
  }

  async getById(id: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } })
    if (!flag) {
      const err = new Error('Feature flag not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    return flag
  }

  async getByKey(key: string, tenantId?: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } })
    if (!flag) { return false }
    if (flag.isGlobal) { return flag.enabled }
    if (tenantId && flag.tenantId === tenantId) { return flag.enabled }
    return false
  }

  async create(data: {
    key: string
    name: string
    description?: string
    enabled?: boolean
    isGlobal?: boolean
    tenantId?: string
  }, userId: string, ip?: string) {
    const flag = await this.prisma.featureFlag.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? false,
        isGlobal: data.isGlobal ?? true,
        tenantId: data.tenantId,
      },
    })
    await this.audit.record({
      action: 'feature-flag.create',
      entity: 'FeatureFlag',
      entityId: flag.id,
      metadata: { key: data.key, enabled: flag.enabled },
      userId,
      tenantId: data.tenantId ?? '',
      ipAddress: ip,
    })
    return flag
  }

  async update(id: string, data: {
    name?: string
    description?: string
    enabled?: boolean
    isGlobal?: boolean
  }, userId: string, tenantId: string, ip?: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } })
    if (!flag) {
      const err = new Error('Feature flag not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const updated = await this.prisma.featureFlag.update({ where: { id }, data })
    await this.audit.record({
      action: 'feature-flag.update',
      entity: 'FeatureFlag',
      entityId: id,
      metadata: { previous: { enabled: flag.enabled }, current: data },
      userId,
      tenantId,
      ipAddress: ip,
    })
    return updated
  }

  async delete(id: string, userId: string, tenantId: string, ip?: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } })
    if (!flag) {
      const err = new Error('Feature flag not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    await this.prisma.featureFlag.delete({ where: { id } })
    await this.audit.record({
      action: 'feature-flag.delete',
      entity: 'FeatureFlag',
      entityId: id,
      metadata: { key: flag.key },
      userId,
      tenantId,
      ipAddress: ip,
    })
  }
}
