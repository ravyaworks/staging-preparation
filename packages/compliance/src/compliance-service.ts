import type {
  ConsentRecord, ConsentPurpose, ConsentStatus,
  DataRetentionPolicy, DataResourceType,
  DataExportRequest, DataDeletionRequest, PrivacySettings,
} from './types'
import { ComplianceError } from './types'

export class ComplianceService {
  private consents: ConsentRecord[] = []
  private retentionPolicies: DataRetentionPolicy[] = []
  private exportRequests: DataExportRequest[] = []
  private deletionRequests: DataDeletionRequest[] = []
  private privacySettings = new Map<string, PrivacySettings>()

  // Consent Management

  recordConsent(
    tenantId: string,
    userId: string,
    purpose: ConsentPurpose,
    status: ConsentStatus,
    metadata?: Record<string, unknown>,
  ): ConsentRecord {
    if (status === 'granted') {
      const existing = this.consents.find(
        c => c.tenantId === tenantId && c.userId === userId && c.purpose === purpose,
      )
      if (existing) {
        existing.status = 'granted'
        existing.grantedAt = new Date().toISOString()
        existing.revokedAt = undefined
        return existing
      }
    }

    const record: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      userId,
      purpose,
      status,
      grantedAt: status === 'granted' ? new Date().toISOString() : undefined,
      revokedAt: status === 'withdrawn' ? new Date().toISOString() : undefined,
      metadata,
    }

    if (['granted', 'denied', 'withdrawn'].includes(status)) {
      this.consents.push(record)
    }

    return record
  }

  withdrawConsent(tenantId: string, userId: string, purpose: ConsentPurpose): ConsentRecord {
    const existing = this.consents.find(
      c => c.tenantId === tenantId && c.userId === userId && c.purpose === purpose,
    )
    if (existing) {
      existing.status = 'withdrawn'
      existing.revokedAt = new Date().toISOString()
      return existing
    }
    return this.recordConsent(tenantId, userId, purpose, 'withdrawn')
  }

  getConsent(tenantId: string, userId: string, purpose: ConsentPurpose): ConsentStatus {
    const records = this.consents.filter(
      c => c.tenantId === tenantId && c.userId === userId && c.purpose === purpose,
    )
    if (records.length === 0) return 'not_set'
    return records[records.length - 1]!.status
  }

  getConsentsForUser(tenantId: string, userId: string): ConsentRecord[] {
    return this.consents.filter(c => c.tenantId === tenantId && c.userId === userId)
  }

  hasConsent(tenantId: string, userId: string, purpose: ConsentPurpose): boolean {
    return this.getConsent(tenantId, userId, purpose) === 'granted'
  }

  // Data Retention Policies

  setRetentionPolicy(policy: DataRetentionPolicy): void {
    const idx = this.retentionPolicies.findIndex(
      p => p.tenantId === policy.tenantId && p.resourceType === policy.resourceType,
    )
    if (idx >= 0) {
      this.retentionPolicies[idx] = policy
    } else {
      this.retentionPolicies.push(policy)
    }
  }

  getRetentionPolicy(tenantId: string, resourceType: DataResourceType): DataRetentionPolicy | undefined {
    return this.retentionPolicies.find(
      p => p.tenantId === tenantId && p.resourceType === resourceType,
    )
  }

  getRetentionPolicies(tenantId: string): DataRetentionPolicy[] {
    return this.retentionPolicies.filter(p => p.tenantId === tenantId)
  }

  getExpiredResources(tenantId: string): Array<{ resourceType: DataResourceType; daysRetained: number }> {
    const result: Array<{ resourceType: DataResourceType; daysRetained: number }> = []
    const policies = this.getRetentionPolicies(tenantId).filter(p => p.enabled)

    for (const policy of policies) {
      result.push({
        resourceType: policy.resourceType,
        daysRetained: policy.retentionDays,
      })
    }

    return result
  }

  // Data Export (GDPR Right of Access)

  requestDataExport(tenantId: string, userId: string, includes?: DataResourceType[]): DataExportRequest {
    const request: DataExportRequest = {
      id: `export_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      userId,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      formats: ['json'],
      includes: includes ?? ['conversations', 'messages', 'users'],
    }

    this.exportRequests.push(request)
    return request
  }

  processDataExport(exportId: string): DataExportRequest {
    const request = this.exportRequests.find(r => r.id === exportId)
    if (!request) throw new ComplianceError('Export request not found', 'EXPORT_NOT_FOUND')

    request.status = 'completed'
    request.completedAt = new Date().toISOString()
    request.downloadUrl = `/api/v1/compliance/exports/${exportId}/download`

    return request
  }

  getExportRequest(exportId: string): DataExportRequest | undefined {
    return this.exportRequests.find(r => r.id === exportId)
  }

  getExportRequestsForUser(tenantId: string, userId: string): DataExportRequest[] {
    return this.exportRequests.filter(r => r.tenantId === tenantId && r.userId === userId)
  }

  // Data Deletion (GDPR Right to Erasure)

  requestDataDeletion(tenantId: string, userId: string, preserveRequiredByLaw?: string[]): DataDeletionRequest {
    const request: DataDeletionRequest = {
      id: `deletion_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      userId,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      includes: ['conversations', 'messages', 'users', 'audit_logs', 'analytics', 'api_keys'],
      preserveRequiredByLaw: preserveRequiredByLaw ?? [],
    }

    this.deletionRequests.push(request)
    return request
  }

  processDataDeletion(deletionId: string): DataDeletionRequest {
    const request = this.deletionRequests.find(r => r.id === deletionId)
    if (!request) throw new ComplianceError('Deletion request not found', 'DELETION_NOT_FOUND')

    request.status = 'completed'
    request.completedAt = new Date().toISOString()

    return request
  }

  getDeletionRequest(deletionId: string): DataDeletionRequest | undefined {
    return this.deletionRequests.find(r => r.id === deletionId)
  }

  getDeletionRequestsForUser(tenantId: string, userId: string): DataDeletionRequest[] {
    return this.deletionRequests.filter(r => r.tenantId === tenantId && r.userId === userId)
  }

  // Privacy Settings

  getPrivacySettings(tenantId: string): PrivacySettings {
    const existing = this.privacySettings.get(tenantId)
    if (existing) return existing

    const defaults: PrivacySettings = {
      tenantId,
      dataRetentionDefaults: {
        conversations: 365,
        messages: 365,
        users: 730,
        audit_logs: 90,
        analytics: 365,
      },
      requireConsent: true,
      consentPurposes: ['essential', 'analytics', 'marketing'],
      enableDataExport: true,
      enableDataDeletion: true,
      enableAnonymization: true,
      updatedAt: new Date().toISOString(),
    }

    this.privacySettings.set(tenantId, defaults)
    return defaults
  }

  updatePrivacySettings(tenantId: string, settings: Partial<PrivacySettings>): PrivacySettings {
    const current = this.getPrivacySettings(tenantId)
    const updated: PrivacySettings = { ...current, ...settings, tenantId, updatedAt: new Date().toISOString() }
    this.privacySettings.set(tenantId, updated)
    return updated
  }
}
