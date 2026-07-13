import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { OutreachError } from '../types'
import type { OutreachApiKeyData, CreateApiKeyInput } from '../types'
import crypto from 'crypto'

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

function generateApiKey(prefix: string = 'oci'): { key: string; keyPrefix: string; keyHash: string } {
  const random = crypto.randomBytes(32).toString('hex')
  const key = `${prefix}_${random}`
  const keyPrefix = key.substring(0, 8)
  const keyHash = hashKey(key)
  return { key, keyPrefix, keyHash }
}

export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async create(input: CreateApiKeyInput, organizationId: string, userId: string): Promise<OutreachApiKeyData & { rawKey: string }> {
    const { key, keyPrefix, keyHash } = generateApiKey()

    const record = await this.prisma.outreachApiKey.create({
      data: {
        name: input.name,
        key: keyHash,
        keyPrefix,
        organizationId,
        createdBy: userId,
        rateLimitPerMinute: input.rateLimitPerMinute ?? 60,
        allowedIps: input.allowedIps ?? [],
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    })

    this.logger.info({ keyPrefix, organizationId }, 'Outreach API key created')

    return {
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      isActive: record.isActive,
      allowedIps: (record.allowedIps as string[]) ?? [],
      rateLimitPerMinute: record.rateLimitPerMinute,
      lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
      expiresAt: record.expiresAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      rawKey: key,
    }
  }

  async validate(key: string): Promise<{ valid: boolean; organizationId?: string; tenantId?: string; reason?: string }> {
    const keyHash = hashKey(key)
    const record = await this.prisma.outreachApiKey.findUnique({ where: { key: keyHash } })

    if (!record) {
      return { valid: false, reason: 'Invalid API key' }
    }

    if (!record.isActive) {
      return { valid: false, reason: 'API key is deactivated' }
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      return { valid: false, reason: 'API key has expired' }
    }

    await this.prisma.outreachApiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    })

    return { valid: true, organizationId: record.organizationId, tenantId: record.tenantId ?? undefined }
  }

  async list(organizationId: string): Promise<OutreachApiKeyData[]> {
    const records = await this.prisma.outreachApiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return records.map(r => ({
      id: r.id,
      name: r.name,
      keyPrefix: r.keyPrefix,
      isActive: r.isActive,
      allowedIps: (r.allowedIps as string[]) ?? [],
      rateLimitPerMinute: r.rateLimitPerMinute,
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  }

  async revoke(id: string, organizationId: string): Promise<void> {
    const record = await this.prisma.outreachApiKey.findUnique({ where: { id } })
    if (!record || record.organizationId !== organizationId) {
      throw new OutreachError('API key not found', 'NOT_FOUND', 404)
    }

    await this.prisma.outreachApiKey.update({
      where: { id },
      data: { isActive: false },
    })

    this.logger.info({ keyId: id, organizationId }, 'Outreach API key revoked')
  }
}
