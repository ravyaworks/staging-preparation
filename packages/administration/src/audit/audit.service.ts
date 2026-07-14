import type { PrismaClient, Prisma } from '@prisma/client'
import type { AdminAction } from '../types'

export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  async record(action: AdminAction & { userId?: string; tenantId: string }) {
    return this.prisma.auditLog.create({
      data: {
        action: action.action,
        entity: action.entity,
        entityId: action.entityId,
        metadata: (action.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: action.ipAddress,
        userId: action.userId,
        tenantId: action.tenantId,
      },
    })
  }

  async query(params: {
    tenantId: string
    userId?: string
    action?: string
    entity?: string
    entityId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    const where: Record<string, unknown> = { tenantId: params.tenantId }
    if (params.userId) {where.userId = params.userId}
    if (params.action) {where.action = params.action}
    if (params.entity) {where.entity = params.entity}
    if (params.entityId) {where.entityId = params.entityId}
    if (params.startDate || params.endDate) {
      const createdAt: Record<string, string | Date> = {}
      if (params.startDate) {createdAt.gte = new Date(params.startDate)}
      if (params.endDate) {createdAt.lte = new Date(params.endDate)}
      where.createdAt = createdAt
    }

    const page = params.page ?? 1
    const limit = params.limit ?? 50
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getByEntity(entity: string, entityId: string, tenantId: string, page = 1, limit = 50) {
    return this.query({ tenantId, entity, entityId, page, limit })
  }

  async getByUser(userId: string, tenantId: string, page = 1, limit = 50) {
    return this.query({ tenantId, userId, page, limit })
  }
}
