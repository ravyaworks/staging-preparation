export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise'

export interface Plan {
  id: string
  name: string
  tier: PlanTier
  description: string
  monthlyPrice: number
  annualPrice: number
  features: PlanFeature[]
  limits: PlanLimits
  isActive: boolean
}

export interface PlanFeature {
  name: string
  description: string
  included: boolean
  limit?: number
}

export interface PlanLimits {
  maxConversations: number
  maxMessagesPerMonth: number
  maxTeamMembers: number
  maxIntegrations: number
  maxKnowledgeDocuments: number
  maxWorkflows: number
  maxApiRequestsPerMinute: number
  maxStorageMb: number
  aiModelAccess: 'basic' | 'standard' | 'all'
  webhookSupport: boolean
  auditLogRetentionDays: number
  analyticsRetentionDays: number
  ssoEnabled: boolean
  prioritySupport: boolean
  customBranding: boolean
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'incomplete'

export interface Subscription {
  id: string
  tenantId: string
  planId: string
  status: SubscriptionStatus
  billingCycle: 'monthly' | 'annual'
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEnd?: string
  canceledAt?: string
  startedAt: string
  metadata?: Record<string, unknown>
}

export interface UsageRecord {
  id: string
  tenantId: string
  metric: UsageMetric
  value: number
  recordedAt: string
}

export type UsageMetric =
  | 'messages_sent'
  | 'messages_received'
  | 'conversations_created'
  | 'api_requests'
  | 'ai_tokens'
  | 'storage_bytes'
  | 'knowledge_documents'
  | 'workflow_executions'
  | 'team_members'
  | 'integrations_active'

export interface UsageSummary {
  tenantId: string
  periodStart: string
  periodEnd: string
  metrics: Record<UsageMetric, number>
  limits: PlanLimits
  percentUsed: Record<string, number>
  overLimit: boolean
  overLimitMetrics: UsageMetric[]
}

export interface Invoice {
  id: string
  tenantId: string
  subscriptionId: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  periodStart: string
  periodEnd: string
  dueDate: string
  paidAt?: string
  lineItems: InvoiceLineItem[]
  metadata?: Record<string, unknown>
}

export interface InvoiceLineItem {
  description: string
  amount: number
  quantity: number
  unitPrice: number
  type: 'subscription' | 'usage' | 'adjustment'
}

export class BillingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'BillingError'
  }
}
