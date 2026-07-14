export const BUILT_IN_ROLES = ['super_admin', 'org_admin', 'manager', 'operator', 'read_only'] as const
export type BuiltInRole = typeof BUILT_IN_ROLES[number]

export const PERMISSIONS = [
  'admin:access',
  'organization:create', 'organization:read', 'organization:update', 'organization:delete',
  'organization:suspend', 'organization:reactivate',
  'user:create', 'user:read', 'user:update', 'user:delete',
  'user:suspend', 'user:invite', 'user:password-reset', 'user:force-logout', 'user:assign-role',
  'role:create', 'role:read', 'role:update', 'role:delete', 'role:assign',
  'api-key:create', 'api-key:read', 'api-key:update', 'api-key:delete', 'api-key:rotate',
  'feature-flag:create', 'feature-flag:read', 'feature-flag:update', 'feature-flag:delete',
  'configuration:read', 'configuration:update',
  'channel:read', 'channel:update', 'channel:connect', 'channel:disconnect',
  'webhook:create', 'webhook:read', 'webhook:update', 'webhook:delete', 'webhook:test',
  'audit:read',
  'backup:create', 'backup:read', 'backup:restore',
  'maintenance:read', 'maintenance:update',
  'health:read',
] as const
export type Permission = typeof PERMISSIONS[number]

export interface AdminAction {
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    api: HealthCheckResult
    database: HealthCheckResult
    redis: HealthCheckResult
    queue: HealthCheckResult
    workers: HealthCheckResult
    channels: HealthCheckResult
    ai: HealthCheckResult
    storage: HealthCheckResult
    webhooks: HealthCheckResult
  }
  uptime: number
  timestamp: string
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  message?: string
  details?: Record<string, unknown>
}

export interface BackupRecord {
  id: string
  type: 'database' | 'configuration' | 'full'
  status: 'running' | 'completed' | 'failed'
  size: number | null
  path: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  completedAt: string | null
}

export interface MaintenanceStatus {
  isActive: boolean
  message: string | null
  scheduledStart: string | null
  scheduledEnd: string | null
  allowlist: string[]
}

export interface FeatureFlagResponse {
  id: string
  key: string
  name: string
  description: string | null
  enabled: boolean
  isGlobal: boolean
  tenantId: string | null
  updatedAt: string
}
