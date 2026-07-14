import type { PrismaClient } from '@prisma/client'
import { AuditService } from '../audit/audit.service'

export class OrganizationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        where: { tenantId, deletedAt: null },
        skip,
        take: limit,
        include: {
          _count: { select: { users: true, campaigns: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where: { tenantId, deletedAt: null } }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string, tenantId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { users: true, campaigns: true } },
      },
    })
    if (!org) {
      const err = new Error('Organization not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    return org
  }

  async create(data: { name: string; slug: string }, tenantId: string, userId: string, ip?: string) {
    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        tenantId,
      },
    })
    await this.audit.record({
      action: 'organization.create',
      entity: 'Organization',
      entityId: org.id,
      metadata: { name: data.name, slug: data.slug },
      userId,
      tenantId,
      ipAddress: ip,
    })
    return org
  }

  async update(id: string, data: { name?: string; slug?: string }, tenantId: string, userId: string, ip?: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!org) {
      const err = new Error('Organization not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const updated = await this.prisma.organization.update({
      where: { id },
      data,
    })
    await this.audit.record({
      action: 'organization.update',
      entity: 'Organization',
      entityId: id,
      metadata: data,
      userId,
      tenantId,
      ipAddress: ip,
    })
    return updated
  }

  async suspend(id: string, tenantId: string, userId: string, ip?: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!org) {
      const err = new Error('Organization not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { isActive: false },
    })
    await this.audit.record({
      action: 'organization.suspend',
      entity: 'Organization',
      entityId: id,
      metadata: { previousState: { isActive: org.isActive } },
      userId,
      tenantId,
      ipAddress: ip,
    })
    return updated
  }

  async reactivate(id: string, tenantId: string, userId: string, ip?: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!org) {
      const err = new Error('Organization not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { isActive: true },
    })
    await this.audit.record({
      action: 'organization.reactivate',
      entity: 'Organization',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })
    return updated
  }

  async softDelete(id: string, tenantId: string, userId: string, ip?: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!org) {
      const err = new Error('Organization not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    await this.audit.record({
      action: 'organization.delete',
      entity: 'Organization',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })
    return updated
  }

  async getStats(id: string, tenantId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { users: true, campaigns: true } },
        campaigns: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    if (!org) {
      const err = new Error('Organization not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const campaignStats = {
      total: org._count.campaigns,
      draft: org.campaigns.filter(c => c.status === 'draft').length,
      active: org.campaigns.filter(c => c.status === 'active').length,
      completed: org.campaigns.filter(c => c.status === 'completed').length,
      recent: org.campaigns.slice(0, 5),
    }
    const channelConnections = await this.prisma.channelConnection.findMany({
      where: { tenantId },
      select: {
        channelType: true,
        status: true,
        lastActivity: true,
      },
    })
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      isActive: org.isActive,
      userCount: org._count.users,
      campaignStats,
      channelConnections,
      createdAt: org.createdAt,
    }
  }
}
