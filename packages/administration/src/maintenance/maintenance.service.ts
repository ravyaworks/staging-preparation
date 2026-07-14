import type { PrismaClient } from '@prisma/client'
import { AuditService } from '../audit/audit.service'

export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async getStatus() {
    const window = await this.prisma.maintenanceWindow.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    if (!window) {
      return { isActive: false, message: null, scheduledStart: null, scheduledEnd: null, allowlist: [] }
    }
    return {
      isActive: window.isActive,
      message: window.message,
      scheduledStart: window.scheduledStart?.toISOString() ?? null,
      scheduledEnd: window.scheduledEnd?.toISOString() ?? null,
      allowlist: window.allowlist,
    }
  }

  async enable(message: string, userId: string, tenantId: string, scheduledStart?: string, scheduledEnd?: string, allowlist?: string[], ip?: string) {
    const existing = await this.prisma.maintenanceWindow.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    if (existing?.isActive) {
      await this.prisma.maintenanceWindow.update({
        where: { id: existing.id },
        data: {
          message,
          scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          allowlist: allowlist ?? [],
        },
      })
    } else {
      await this.prisma.maintenanceWindow.create({
        data: {
          message,
          isActive: true,
          scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          allowlist: allowlist ?? [],
        },
      })
    }
    await this.audit.record({
      action: 'maintenance.enable',
      entity: 'Maintenance',
      metadata: { message, scheduledStart, scheduledEnd },
      userId,
      tenantId,
      ipAddress: ip,
    })
  }

  async disable(userId: string, tenantId: string, ip?: string) {
    const window = await this.prisma.maintenanceWindow.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    if (window) {
      await this.prisma.maintenanceWindow.update({
        where: { id: window.id },
        data: { isActive: false },
      })
    }
    await this.audit.record({
      action: 'maintenance.disable',
      entity: 'Maintenance',
      userId,
      tenantId,
      ipAddress: ip,
    })
  }

  async isAllowed(userId: string, email: string): Promise<boolean> {
    const window = await this.prisma.maintenanceWindow.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!window) {return true}
    if (window.allowlist.includes(userId) || window.allowlist.includes(email)) {return true}
    return false
  }
}
