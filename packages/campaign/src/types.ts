export type CampaignStatus =
  | 'draft'
  | 'ready'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type CampaignBusinessStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'replied'

export type CampaignChannel =
  | 'whatsapp'
  | 'email'
  | 'sms'
  | 'telegram'
  | 'instagram'
  | 'messenger'
  | 'slack'
  | 'website'
  | 'api'

export type CampaignLogAction =
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.deleted'
  | 'campaign.duplicated'
  | 'campaign.started'
  | 'campaign.paused'
  | 'campaign.resumed'
  | 'campaign.cancelled'
  | 'campaign.completed'
  | 'businesses.imported'
  | 'jobs.created'
  | 'statistics.updated'

export interface CampaignData {
  id: string
  name: string
  description: string | null
  channel: string
  status: CampaignStatus
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
  status: CampaignBusinessStatus
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

export interface CampaignLogData {
  id: string
  action: string
  message: string
  metadata: unknown
  campaignId: string
  userId: string | null
  createdAt: string
}

export interface CampaignListItem {
  id: string
  name: string
  channel: string
  status: CampaignStatus
  createdAt: string
  totalBusinesses: number
  progress: number
}

export interface ImportResult {
  imported: number
  duplicates: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  field: string
  message: string
  value?: string
}

export interface CsvRow {
  businessName: string
  phone: string
  email?: string
  industry?: string
  previewUrl?: string
  personalizedMessage: string
}

export class CampaignError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'CampaignError'
  }
}
