import type { PrismaClient, Prisma } from '@prisma/client'
import { AuditService } from '../audit/audit.service'

export class ConfigurationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, category?: string) {
    const where: Record<string, unknown> = { tenantId }
    if (category) {where.category = category}
    return this.prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    })
  }

  async get(tenantId: string, key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key } },
    })
    if (!setting) {
      const err = new Error('Configuration key not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    return setting
  }

  async set(tenantId: string, key: string, value: unknown, category: string, userId: string, ip?: string) {
    const existing = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key } },
    })
    const setting = await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value: value as Prisma.InputJsonValue, category },
      create: { tenantId, key, value: value as Prisma.InputJsonValue, category },
    })
    await this.audit.record({
      action: 'configuration.update',
      entity: 'Configuration',
      entityId: key,
      metadata: { category, previousValue: existing?.value, newValue: value },
      userId,
      tenantId,
      ipAddress: ip,
    })
    return setting
  }

  async delete(tenantId: string, key: string, userId: string, ip?: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key } },
    })
    if (!setting) {
      const err = new Error('Configuration key not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    await this.prisma.setting.delete({
      where: { tenantId_key: { tenantId, key } },
    })
    await this.audit.record({
      action: 'configuration.delete',
      entity: 'Configuration',
      entityId: key,
      userId,
      tenantId,
      ipAddress: ip,
    })
  }

  async getDefaults() {
    return {
      queue: { maxRetries: 3, retryDelayMs: 5000, concurrency: 10 },
      scheduler: { pollIntervalMs: 5000, maxBatchSize: 100 },
      rateLimits: { api: 100, auth: 20, webhook: 30, message: 200 },
      ai: { defaultModel: 'gpt-4', maxTokens: 2048, temperature: 0.7 },
      channels: { defaultProvider: 'whatsapp', retryAttempts: 3 },
      timeouts: { session: 3600, request: 30000, idle: 600000 },
      retry: { maxAttempts: 3, backoffBase: 1000, backoffMultiplier: 2 },
    }
  }
}
