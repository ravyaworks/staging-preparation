import type {
  Plan, PlanTier, Subscription, SubscriptionStatus, UsageRecord,
  UsageMetric, UsageSummary, Invoice, InvoiceLineItem,
} from './types'
import { BillingError } from './types'

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    tier: 'free',
    description: 'For individuals and small projects',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { name: 'Conversations', description: 'Up to 100 conversations', included: true, limit: 100 },
      { name: 'Messages', description: 'Up to 1,000 messages/month', included: true, limit: 1000 },
      { name: 'Team Members', description: 'Up to 2 team members', included: true, limit: 2 },
      { name: 'Integrations', description: '1 integration', included: true, limit: 1 },
      { name: 'AI Models', description: 'Basic models only', included: true },
      { name: 'Support', description: 'Community support', included: true },
    ],
    limits: {
      maxConversations: 100, maxMessagesPerMonth: 1000, maxTeamMembers: 2,
      maxIntegrations: 1, maxKnowledgeDocuments: 10, maxWorkflows: 3,
      maxApiRequestsPerMinute: 30, maxStorageMb: 50,
      aiModelAccess: 'basic', webhookSupport: false,
      auditLogRetentionDays: 7, analyticsRetentionDays: 30,
      ssoEnabled: false, prioritySupport: false, customBranding: false,
    },
    isActive: true,
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    tier: 'starter',
    description: 'For growing teams',
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      { name: 'Conversations', description: 'Up to 5,000 conversations', included: true, limit: 5000 },
      { name: 'Messages', description: 'Up to 50,000 messages/month', included: true, limit: 50000 },
      { name: 'Team Members', description: 'Up to 10 team members', included: true, limit: 10 },
      { name: 'Integrations', description: '5 integrations', included: true, limit: 5 },
      { name: 'Webhooks', description: 'Webhook support', included: true },
      { name: 'Support', description: 'Email support', included: true },
    ],
    limits: {
      maxConversations: 5000, maxMessagesPerMonth: 50000, maxTeamMembers: 10,
      maxIntegrations: 5, maxKnowledgeDocuments: 100, maxWorkflows: 20,
      maxApiRequestsPerMinute: 100, maxStorageMb: 500,
      aiModelAccess: 'standard', webhookSupport: true,
      auditLogRetentionDays: 30, analyticsRetentionDays: 90,
      ssoEnabled: false, prioritySupport: false, customBranding: false,
    },
    isActive: true,
  },
  {
    id: 'plan_professional',
    name: 'Professional',
    tier: 'professional',
    description: 'For businesses at scale',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      { name: 'Conversations', description: 'Unlimited conversations', included: true },
      { name: 'Messages', description: 'Up to 500,000 messages/month', included: true, limit: 500000 },
      { name: 'Team Members', description: 'Unlimited team members', included: true },
      { name: 'Integrations', description: 'Unlimited integrations', included: true },
      { name: 'AI Models', description: 'All AI models', included: true },
      { name: 'SSO', description: 'Single Sign-On', included: true },
      { name: 'Support', description: 'Priority support', included: true },
    ],
    limits: {
      maxConversations: Infinity, maxMessagesPerMonth: 500000, maxTeamMembers: Infinity,
      maxIntegrations: Infinity, maxKnowledgeDocuments: 10000, maxWorkflows: 100,
      maxApiRequestsPerMinute: 500, maxStorageMb: 10000,
      aiModelAccess: 'all', webhookSupport: true,
      auditLogRetentionDays: 90, analyticsRetentionDays: 365,
      ssoEnabled: true, prioritySupport: true, customBranding: true,
    },
    isActive: true,
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    description: 'For large organizations with custom needs',
    monthlyPrice: 499,
    annualPrice: 4990,
    features: [
      { name: 'Everything in Professional', description: 'All Professional features', included: true },
      { name: 'Custom Contracts', description: 'Custom terms and SLA', included: true },
      { name: 'Dedicated Support', description: 'Dedicated account manager', included: true },
      { name: 'On-Premise', description: 'On-premise deployment option', included: true },
    ],
    limits: {
      maxConversations: Infinity, maxMessagesPerMonth: Infinity, maxTeamMembers: Infinity,
      maxIntegrations: Infinity, maxKnowledgeDocuments: Infinity, maxWorkflows: Infinity,
      maxApiRequestsPerMinute: 2000, maxStorageMb: Infinity,
      aiModelAccess: 'all', webhookSupport: true,
      auditLogRetentionDays: 365, analyticsRetentionDays: 730,
      ssoEnabled: true, prioritySupport: true, customBranding: true,
    },
    isActive: true,
  },
]

const FREE_TIER_LIMITS = DEFAULT_PLANS[0]!.limits

export class BillingEngine {
  private subscriptions = new Map<string, Subscription>()
  private usageRecords: UsageRecord[] = []

  getPlans(tier?: PlanTier): Plan[] {
    const plans = tier ? DEFAULT_PLANS.filter(p => p.tier === tier) : DEFAULT_PLANS
    return plans.filter(p => p.isActive)
  }

  getPlan(planId: string): Plan | undefined {
    return DEFAULT_PLANS.find(p => p.id === planId && p.isActive)
  }

  createSubscription(tenantId: string, planId: string, billingCycle: 'monthly' | 'annual' = 'monthly'): Subscription {
    const plan = this.getPlan(planId)
    if (!plan) throw new BillingError(`Plan ${planId} not found`, 'PLAN_NOT_FOUND')

    const existing = this.subscriptions.get(tenantId)
    if (existing && existing.status === 'active') {
      throw new BillingError('Tenant already has an active subscription', 'SUBSCRIPTION_EXISTS')
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'annual' ? 12 : 1))

    const sub: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      planId,
      status: 'active',
      billingCycle,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      trialEnd: plan.tier === 'free' ? undefined : new Date(now.getTime() + 14 * 86400000).toISOString(),
      startedAt: now.toISOString(),
    }

    this.subscriptions.set(tenantId, sub)
    return sub
  }

  getSubscription(tenantId: string): Subscription | undefined {
    return this.subscriptions.get(tenantId)
  }

  cancelSubscription(tenantId: string): Subscription {
    const sub = this.subscriptions.get(tenantId)
    if (!sub) throw new BillingError('No subscription found', 'NO_SUBSCRIPTION')
    sub.status = 'canceled'
    sub.canceledAt = new Date().toISOString()
    this.subscriptions.set(tenantId, sub)
    return sub
  }

  changePlan(tenantId: string, newPlanId: string): Subscription {
    const plan = this.getPlan(newPlanId)
    if (!plan) throw new BillingError(`Plan ${newPlanId} not found`, 'PLAN_NOT_FOUND')

    const sub = this.subscriptions.get(tenantId)
    if (!sub) throw new BillingError('No subscription found', 'NO_SUBSCRIPTION')

    sub.planId = newPlanId
    this.subscriptions.set(tenantId, sub)
    return sub
  }

  recordUsage(tenantId: string, metric: UsageMetric, value: number): UsageRecord {
    const record: UsageRecord = {
      id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      metric,
      value,
      recordedAt: new Date().toISOString(),
    }
    this.usageRecords.push(record)
    return record
  }

  getUsageSummary(tenantId: string, periodStart?: string, periodEnd?: string): UsageSummary {
    const sub = this.subscriptions.get(tenantId)
    const plan = sub ? this.getPlan(sub.planId) : undefined
    const limits = plan?.limits ?? FREE_TIER_LIMITS

    const start = periodStart ?? sub?.currentPeriodStart ?? new Date(Date.now() - 30 * 86400000).toISOString()
    const end = periodEnd ?? sub?.currentPeriodEnd ?? new Date().toISOString()

    const metrics = {} as Record<UsageMetric, number>
    const allMetrics: UsageMetric[] = [
      'messages_sent', 'messages_received', 'conversations_created',
      'api_requests', 'ai_tokens', 'storage_bytes',
      'knowledge_documents', 'workflow_executions', 'team_members', 'integrations_active',
    ]

    for (const metric of allMetrics) {
      metrics[metric] = this.usageRecords
        .filter(r => r.tenantId === tenantId && r.metric === metric && r.recordedAt >= start && r.recordedAt <= end)
        .reduce((sum, r) => sum + r.value, 0)
    }

    const limitMap: Record<string, number> = {
      messages_sent: limits.maxMessagesPerMonth,
      messages_received: limits.maxMessagesPerMonth,
      conversations_created: limits.maxConversations,
      api_requests: limits.maxApiRequestsPerMinute * 43200,
      storage_bytes: limits.maxStorageMb * 1024 * 1024,
      knowledge_documents: limits.maxKnowledgeDocuments,
      workflow_executions: limits.maxWorkflows,
      team_members: limits.maxTeamMembers,
      integrations_active: limits.maxIntegrations,
    }

    const percentUsed: Record<string, number> = {}
    const overLimitMetrics: UsageMetric[] = []

    for (const metric of allMetrics) {
      const limitVal = limitMap[metric]
      const used = metrics[metric]
      if (limitVal !== undefined && limitVal !== Infinity && limitVal > 0) {
        percentUsed[metric] = Math.round((used / limitVal) * 10000) / 100
        if (used > limitVal) overLimitMetrics.push(metric)
      } else {
        percentUsed[metric] = 0
      }
    }

    return {
      tenantId,
      periodStart: start,
      periodEnd: end,
      metrics,
      limits,
      percentUsed,
      overLimit: overLimitMetrics.length > 0,
      overLimitMetrics,
    }
  }

  checkLimit(tenantId: string, metric: UsageMetric, value: number): boolean {
    const summary = this.getUsageSummary(tenantId)
    const limitKey = {
      messages_sent: 'maxMessagesPerMonth', messages_received: 'maxMessagesPerMonth',
      conversations_created: 'maxConversations', api_requests: 'maxApiRequestsPerMinute',
      ai_tokens: 'maxMessagesPerMonth', storage_bytes: 'maxStorageMb',
      knowledge_documents: 'maxKnowledgeDocuments', workflow_executions: 'maxWorkflows',
      team_members: 'maxTeamMembers', integrations_active: 'maxIntegrations',
    }[metric]

    if (!limitKey) return true
    const limit = (summary.limits as Record<string, number | boolean | string>)[limitKey]
    if (limit === Infinity || limit === undefined) return true
    return summary.metrics[metric] + value <= Number(limit)
  }

  generateInvoice(tenantId: string): Invoice {
    const sub = this.subscriptions.get(tenantId)
    if (!sub) throw new BillingError('No active subscription', 'NO_SUBSCRIPTION')

    const plan = this.getPlan(sub.planId)
    if (!plan) throw new BillingError('Plan not found', 'PLAN_NOT_FOUND')

    const price = sub.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
    const lineItems: InvoiceLineItem[] = [
      {
        description: `${plan.name} - ${sub.billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
        amount: price,
        quantity: 1,
        unitPrice: price,
        type: 'subscription',
      },
    ]

    const now = new Date()
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + 30)

    return {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      subscriptionId: sub.id,
      amount: price,
      currency: 'USD',
      status: 'open',
      periodStart: sub.currentPeriodStart,
      periodEnd: sub.currentPeriodEnd,
      dueDate: dueDate.toISOString(),
      lineItems,
    }
  }
}
