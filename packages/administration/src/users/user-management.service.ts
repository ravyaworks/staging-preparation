import type { PrismaClient } from '@prisma/client'
import { AuditService } from '../audit/audit.service'

export class UserManagementService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, organizationId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { tenantId, deletedAt: null }
    if (organizationId) {where.organizationId = organizationId}

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
          organizationId: true,
          organization: { select: { name: true } },
          userRoles: {
            include: { role: { select: { name: true, slug: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        organizationId: true,
        organization: { select: { name: true } },
        userRoles: {
          include: { role: { select: { id: true, name: true, slug: true } } },
        },
        sessions: {
          where: { isActive: true },
          select: { id: true, ipAddress: true, userAgent: true, lastActivity: true, createdAt: true },
          orderBy: { lastActivity: 'desc' },
          take: 20,
        },
      },
    })
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    return user
  }

  async invite(data: {
    email: string
    firstName: string
    lastName: string
    organizationId?: string
    roleSlug?: string
  }, tenantId: string, invitedBy: string, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      const err = new Error('User with this email already exists') as Error & { statusCode?: number }
      err.statusCode = 409
      throw err
    }

    const verificationToken = crypto.randomUUID()
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: '',
        tenantId,
        organizationId: data.organizationId,
        isVerified: false,
        verificationToken,
        verificationTokenExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    if (data.roleSlug) {
      const role = await this.prisma.role.findFirst({
        where: { slug: data.roleSlug, tenantId },
      })
      if (role) {
        await this.prisma.userRole.create({
          data: { userId: user.id, roleId: role.id },
        })
      }
    }

    await this.audit.record({
      action: 'user.invite',
      entity: 'User',
      entityId: user.id,
      metadata: { email: data.email, organizationId: data.organizationId },
      userId: invitedBy,
      tenantId,
      ipAddress: ip,
    })
    return user
  }

  async suspend(id: string, tenantId: string, userId: string, ip?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } })
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    })
    await this.prisma.session.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    })
    await this.audit.record({
      action: 'user.suspend',
      entity: 'User',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })
    return updated
  }

  async forceLogout(id: string, tenantId: string, userId: string, ip?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } })
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    await this.prisma.session.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    })
    await this.audit.record({
      action: 'user.force-logout',
      entity: 'User',
      entityId: id,
      userId,
      tenantId,
      ipAddress: ip,
    })
  }

  async assignRole(userId: string, roleSlug: string, tenantId: string, actorId: string, ip?: string) {
    const role = await this.prisma.role.findFirst({
      where: { slug: roleSlug, tenantId },
    })
    if (!role) {
      const err = new Error('Role not found') as Error & { statusCode?: number }
      err.statusCode = 404
      throw err
    }
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    })
    await this.audit.record({
      action: 'user.assign-role',
      entity: 'User',
      entityId: userId,
      metadata: { role: roleSlug },
      userId: actorId,
      tenantId,
      ipAddress: ip,
    })
  }

  async getActivity(id: string, tenantId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId: id, ...({} as Record<string, unknown>) },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        isActive: true,
        lastActivity: true,
        createdAt: true,
      },
      orderBy: { lastActivity: 'desc' },
      take: 50,
    })
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { userId: id, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return { sessions, auditLogs }
  }
}
