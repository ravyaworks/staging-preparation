import type { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { AuditService } from '../audit/audit.service'

export class WebhookManagementService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.webhook.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhook.count({ where: { tenantId } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string, tenantId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, tenantId },
    })
    if (!webhook) {
      const err = new Error('Webhook not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    return webhook
  }

  async create(data: { name: string; url: string; events: string[] }, tenantId: string, userId: string, ip?: string) {
    const secret = crypto.randomBytes(32).toString('hex')
    const webhook = await this.prisma.webhook.create({
      data: {
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        tenantId,
      },
    })
    await this.audit.record({
      action: 'webhook.create',
      entity: 'Webhook',
      entityId: webhook.id,
      metadata: { name: data.name, url: data.url, events: data.events },
      userId,
      tenantId,
      ipAddress: ip,
    })
    return { ...webhook, secret }
  }

  async update(id: string, data: { name?: string; url?: string; events?: string[]; isActive?: boolean }, tenantId: string, userId: string, ip?: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, tenantId } })
    if (!webhook) {
      const err = new Error('Webhook not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const updated = await this.prisma.webhook.update({ where: { id }, data })
    await this.audit.record({
      action: 'webhook.update',
      entity: 'Webhook',
      entityId: id,
      metadata: data,
      userId,
      tenantId,
      ipAddress: ip,
    })
    return updated
  }

  async delete(id: string, tenantId: string, userId: string, ip?: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, tenantId } })
    if (!webhook) {
      const err = new Error('Webhook not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    await this.prisma.webhook.delete({ where: { id } })
    await this.audit.record({
      action: 'webhook.delete',
      entity: 'Webhook',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })
  }

  async rotateSecret(id: string, tenantId: string, userId: string, ip?: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, tenantId } })
    if (!webhook) {
      const err = new Error('Webhook not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const newSecret = crypto.randomBytes(32).toString('hex')
    await this.prisma.webhook.update({ where: { id }, data: { secret: newSecret } })
    await this.audit.record({
      action: 'webhook.rotate-secret',
      entity: 'Webhook',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })
    return { secret: newSecret }
  }

  async test(id: string, tenantId: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, tenantId } })
    if (!webhook) {
      const err = new Error('Webhook not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const payload = { event: 'webhook.test', timestamp: new Date().toISOString(), data: { test: true } }
    const signature = crypto.createHmac('sha256', webhook.secret ?? '').update(JSON.stringify(payload)).digest('hex')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      return { success: response.ok, statusCode: response.status, message: `Webhook responded with ${response.status}` }
    } catch (err) {
      return { success: false, statusCode: 0, message: err instanceof Error ? err.message : 'Webhook test failed' }
    }
  }
}
