import type { PrismaClient } from '@prisma/client'
import { RbacService } from './rbac/rbac.service'
import { OrganizationService } from './organizations/organization.service'
import { UserManagementService } from './users/user-management.service'
import { ApiKeyManagementService } from './api-keys/api-key.service'
import { FeatureFlagService } from './feature-flags/feature-flag.service'
import { ConfigurationService } from './configuration/configuration.service'
import { ChannelManagementService } from './channels/channel-management.service'
import { WebhookManagementService } from './webhooks/webhook-management.service'
import { AuditService } from './audit/audit.service'
import { BackupService } from './backups/backup.service'
import { MaintenanceService } from './maintenance/maintenance.service'
import { HealthService } from './health/health.service'

export class AdministrationService {
  readonly rbac: RbacService
  readonly organizations: OrganizationService
  readonly users: UserManagementService
  readonly apiKeys: ApiKeyManagementService
  readonly featureFlags: FeatureFlagService
  readonly configuration: ConfigurationService
  readonly channels: ChannelManagementService
  readonly webhooks: WebhookManagementService
  readonly audit: AuditService
  readonly backups: BackupService
  readonly maintenance: MaintenanceService
  readonly health: HealthService

  constructor(private readonly prisma: PrismaClient) {
    this.audit = new AuditService(this.prisma)
    this.rbac = new RbacService(this.prisma)
    this.organizations = new OrganizationService(this.prisma, this.audit)
    this.users = new UserManagementService(this.prisma, this.audit)
    this.apiKeys = new ApiKeyManagementService(this.prisma, this.audit)
    this.featureFlags = new FeatureFlagService(this.prisma, this.audit)
    this.configuration = new ConfigurationService(this.prisma, this.audit)
    this.channels = new ChannelManagementService(this.prisma)
    this.webhooks = new WebhookManagementService(this.prisma, this.audit)
    this.backups = new BackupService(this.prisma, this.audit)
    this.maintenance = new MaintenanceService(this.prisma, this.audit)
    this.health = new HealthService(this.prisma)
  }
}
