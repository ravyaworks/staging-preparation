import type { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { AuditService } from '../audit/audit.service'

export class ApiKeyManagementService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where: { tenantId },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          isActive: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiKey.count({ where: { tenantId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async create(data: { name: string; expiresAt?: string }, tenantId: string, userId: string, ip?: string) {
    const key = `cp_${crypto.randomBytes(32).toString('hex')}`
    const prefix = key.substring(0, 10)
    const hash = crypto.createHash('sha256').update(key).digest('hex')

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyPrefix: prefix,
        hash,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        tenantId,
        userId,
      },
    })

    await this.audit.record({
      action: 'api-key.create',
      entity: 'ApiKey',
      entityId: apiKey.id,
      metadata: { name: data.name },
      userId,
      tenantId,
      ipAddress: ip,
    })

    return { id: apiKey.id, name: apiKey.name, keyPrefix: apiKey.keyPrefix, key, expiresAt: apiKey.expiresAt }
  }

  async rotate(id: string, tenantId: string, userId: string, ip?: string) {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      const err = new Error('API key not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const key = `cp_${crypto.randomBytes(32).toString('hex')}`
    const prefix = key.substring(0, 10)
    const hash = crypto.createHash('sha256').update(key).digest('hex')

    await this.prisma.apiKey.update({
      where: { id },
      data: { keyPrefix: prefix, hash, lastUsedAt: null },
    })

    await this.audit.record({
      action: 'api-key.rotate',
      entity: 'ApiKey',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })

    return { id, keyPrefix: prefix, key }
  }

  async revoke(id: string, tenantId: string, userId: string, ip?: string) {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      const err = new Error('API key not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    })
    await this.audit.record({
      action: 'api-key.revoke',
      entity: 'ApiKey',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })
  }
}
