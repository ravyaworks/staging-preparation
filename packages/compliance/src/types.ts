export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'not_set'

export type ConsentPurpose =
  | 'essential'
  | 'analytics'
  | 'marketing'
  | 'personalization'
  | 'third_party_sharing'
  | 'ai_training'

export interface ConsentRecord {
  id: string
  tenantId: string
  userId: string
  purpose: ConsentPurpose
  status: ConsentStatus
  grantedAt?: string
  expiresAt?: string
  revokedAt?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export interface DataRetentionPolicy {
  id: string
  tenantId: string
  resourceType: DataResourceType
  retentionDays: number
  action: 'delete' | 'anonymize' | 'archive'
  enabled: boolean
}

export type DataResourceType =
  | 'conversations'
  | 'messages'
  | 'users'
  | 'audit_logs'
  | 'analytics'
  | 'knowledge_documents'
  | 'integrations'
  | 'api_keys'

export interface DataExportRequest {
  id: string
  tenantId: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: string
  completedAt?: string
  expiresAt: string
  downloadUrl?: string
  formats: ('json' | 'csv')[]
  includes: DataResourceType[]
  error?: string
}

export interface DataDeletionRequest {
  id: string
  tenantId: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: string
  completedAt?: string
  includes: DataResourceType[]
  preserveRequiredByLaw: string[]
  error?: string
}

export interface PrivacySettings {
  tenantId: string
  dataRetentionDefaults: Partial<Record<DataResourceType, number>>
  requireConsent: boolean
  consentPurposes: ConsentPurpose[]
  enableDataExport: boolean
  enableDataDeletion: boolean
  enableAnonymization: boolean
  privacyPolicyUrl?: string
  dataProcessingAgreementUrl?: string
  dataProtectionOfficer?: {
    name: string
    email: string
  }
  updatedAt: string
}

export class ComplianceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'ComplianceError'
  }
}
