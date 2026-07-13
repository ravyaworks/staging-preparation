export type OutreachRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'

export type ImportFileType = 'json' | 'csv'

export interface SingleOutreachRequest {
  businessName: string
  industry?: string
  phone: string
  email?: string
  previewUrl?: string
  personalizedMessage: string
  contactPerson?: string
  campaignName?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface BulkOutreachRequest {
  businesses: SingleOutreachRequest[]
}

export interface OutreachSubmitResult {
  success: boolean
  importJobId?: string
  campaignId?: string
  businesses?: Array<{
    businessName: string
    phone: string
    status: 'imported' | 'duplicate' | 'invalid' | 'failed'
    campaignBusinessId?: string
    outreachJobId?: string
    error?: string
  }>
  errors?: Array<{
    row: number
    field: string
    message: string
    value?: string
  }>
}

export interface OutreachApiKeyData {
  id: string
  name: string
  keyPrefix: string
  isActive: boolean
  allowedIps: string[]
  rateLimitPerMinute: number
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface CreateApiKeyInput {
  name: string
  allowedIps?: string[]
  rateLimitPerMinute?: number
  expiresAt?: string
}

export interface ImportJobStatus {
  id: string
  type: ImportFileType
  status: OutreachRequestStatus
  totalRecords: number
  successCount: number
  failedCount: number
  errorSummary: Array<{ row: number; message: string }>
  campaignId: string | null
  createdAt: string
  completedAt: string | null
}

export interface ImportRecordData {
  id: string
  rowNumber: number | null
  businessName: string | null
  phone: string | null
  email: string | null
  status: string
  errors: Array<{ field: string; message: string }>
  campaignBusinessId: string | null
}

export interface BusinessDetail {
  id: string
  businessName: string
  phone: string
  email: string | null
  industry: string | null
  previewUrl: string | null
  personalizedMessage: string
  status: string
  campaignId: string
  campaignName?: string
  outreachJobId: string | null
  outreachJobStatus: string | null
  contactId: string | null
  conversationId: string | null
  createdAt: string
}

export interface CampaignData {
  id: string
  name: string
  description: string | null
  channel: string
  status: string
  organizationId: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface CampaignBusinessData {
  id: string
  businessName: string
  phone: string
  email: string | null
  industry: string | null
  previewUrl: string | null
  personalizedMessage: string
  status: string
  errors: unknown
  campaignId: string
  outreachJobId: string | null
  createdAt: string
  updatedAt: string
}

export interface CampaignStatisticsData {
  id: string
  campaignId: string
  totalBusinesses: number
  jobsCreated: number
  pending: number
  queued: number
  sending: number
  sent: number
  delivered: number
  read: number
  failed: number
  replied: number
  updatedAt: string
}

export interface CampaignIntegrationResult {
  campaign: CampaignData | null
  businesses: CampaignBusinessData[]
  statistics: CampaignStatisticsData | null
}

export class OutreachError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'OutreachError'
  }
}
