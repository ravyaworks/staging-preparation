import type { PrismaClient } from '@prisma/client'
import type { Permission, BuiltInRole } from '../types'
import { PERMISSIONS } from '../types'

const DEFAULT_ROLE_PERMISSIONS: Record<BuiltInRole, Permission[]> = {
  super_admin: [...PERMISSIONS],
  org_admin: [
    'admin:access',
    'organization:read', 'organization:update',
    'user:create', 'user:read', 'user:update', 'user:delete',
    'user:suspend', 'user:invite', 'user:password-reset', 'user:force-logout', 'user:assign-role',
    'role:read', 'role:assign',
    'api-key:create', 'api-key:read', 'api-key:update', 'api-key:delete', 'api-key:rotate',
    'feature-flag:read', 'feature-flag:update',
    'configuration:read', 'configuration:update',
    'channel:read', 'channel:update', 'channel:connect', 'channel:disconnect',
    'webhook:create', 'webhook:read', 'webhook:update', 'webhook:delete', 'webhook:test',
    'audit:read',
    'backup:read',
    'maintenance:read',
    'health:read',
  ],
  manager: [
    'admin:access',
    'organization:read',
    'user:read', 'user:create',
    'role:read',
    'api-key:read', 'api-key:create',
    'feature-flag:read',
    'configuration:read',
    'channel:read',
    'webhook:read', 'webhook:create', 'webhook:update',
    'audit:read',
    'health:read',
  ],
  operator: [
    'admin:access',
    'organization:read',
    'user:read',
    'api-key:read',
    'channel:read',
    'webhook:read',
    'health:read',
  ],
  read_only: [
    'admin:access',
    'organization:read',
    'user:read',
    'role:read',
    'api-key:read',
    'feature-flag:read',
    'configuration:read',
    'channel:read',
    'webhook:read',
    'audit:read',
    'health:read',
  ],
}

export class RbacService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserPermissions(userId: string, _tenantId: string): Promise<Permission[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    })

    const permissions = new Set<Permission>()
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.slug as Permission)
      }
    }
    return Array.from(permissions)
  }

  async hasPermission(userId: string, tenantId: string, permission: Permission): Promise<boolean> {
    const perms = await this.getUserPermissions(userId, tenantId)
    return perms.includes(permission)
  }

  async requirePermission(userId: string, tenantId: string, permission: Permission): Promise<void> {
    const has = await this.hasPermission(userId, tenantId, permission)
    if (!has) {
      const err = new Error('Forbidden: insufficient permissions') as Error & { statusCode?: number }
      err.statusCode = 403
      throw err
    }
  }

  async getRoleWithPermissions(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    })
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    })
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    })
  }

  async seedDefaultRoles(tenantId: string): Promise<void> {
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, isSystem: true },
    })
    if (existing) {return}

    const allPermissions = await this.prisma.permission.findMany()

    const permMap = new Map<string, string>()
    for (const p of allPermissions) {
      permMap.set(p.slug, p.id)
    }

    for (const [roleSlug, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await this.prisma.role.create({
        data: {
          name: roleSlug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          slug: roleSlug,
          description: `Built-in ${roleSlug.replace(/_/g, ' ')} role`,
          isSystem: true,
          tenantId,
        },
      })

      for (const permSlug of perms) {
        const permId = permMap.get(permSlug)
        if (permId) {
          await this.prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permId,
            },
          })
        }
      }
    }
  }

  getDefaultPermissionsForRole(roleSlug: string): Permission[] {
    return DEFAULT_ROLE_PERMISSIONS[roleSlug as BuiltInRole] ?? ['health:read']
  }
}
