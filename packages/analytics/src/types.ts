export type AnalyticsPeriod = 'minute' | 'hour' | 'day' | 'week' | 'month'

export type AnalyticsEventType =
  | 'campaign.created' | 'campaign.started' | 'campaign.completed' | 'campaign.paused' | 'campaign.resumed' | 'campaign.cancelled' | 'campaign.failed'
  | 'job.created' | 'job.queued' | 'job.sent' | 'job.delivered' | 'job.read' | 'job.failed' | 'job.retrying' | 'job.dead_letter' | 'job.cancelled'
  | 'conversation.created' | 'conversation.closed' | 'conversation.reopened' | 'conversation.escalated'
  | 'message.sent' | 'message.received' | 'message.failed'
  | 'ai.response' | 'ai.escalation' | 'ai.feedback'
  | 'agent.assigned' | 'agent.closed' | 'agent.handoff'
  | 'workflow.executed' | 'workflow.completed' | 'workflow.failed'
  | 'worker.online' | 'worker.offline' | 'worker.heartbeat'
  | 'queue.overflow' | 'queue.drained'
  | 'contact.created' | 'contact.returning'
  | 'import.completed' | 'import.failed'

export type AnalyticsSource = 'campaign' | 'delivery' | 'conversation' | 'ai' | 'agent' | 'workflow' | 'queue' | 'contact' | 'import'

export interface AnalyticsEventData {
  type: AnalyticsEventType
  source: AnalyticsSource
  tenantId?: string
  organizationId?: string
  userId?: string
  campaignId?: string
  conversationId?: string
  contactId?: string
  channel?: string
  value?: number
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
  timestamp: Date
}

export interface AnalyticsMetricData {
  metric: string
  value: number
  dimension?: string
  tenantId?: string
  organizationId?: string
  period: AnalyticsPeriod
  bucket: Date
}

export interface OverviewStats {
  totalOrganizations: number
  totalCampaigns: number
  activeCampaigns: number
  totalBusinessesContacted: number
  totalConversations: number
  activeConversations: number
  messagesSent: number
  messagesDelivered: number
  messagesRead: number
  customerReplies: number
  openLeads: number
  closedLeads: number
}

export interface CampaignAnalytics {
  totalCampaigns: number
  activeCampaigns: number
  completedCampaigns: number
  successRate: number
  completionPercent: number
  businessesContacted: number
  deliveryRate: number
  readRate: number
  replyRate: number
  failureRate: number
  averageCompletionTimeMs: number
  topPerforming: Array<{ id: string; name: string; successRate: number; businessesContacted: number }>
  trend: Array<{ date: string; campaigns: number; completed: number }>
}

export interface ConversationAnalytics {
  totalConversations: number
  activeConversations: number
  closedConversations: number
  averageDurationMs: number
  averageResponseTimeMs: number
  customerWaitTimeMs: number
  reopenedConversations: number
  escalatedConversations: number
  trend: Array<{ date: string; created: number; closed: number }>
}

export interface DeliveryAnalytics {
  messagesSubmitted: number
  messagesAccepted: number
  messagesSent: number
  messagesDelivered: number
  messagesRead: number
  failedMessages: number
  retryCount: number
  queueWaitTimeMs: number
  processingTimeMs: number
  funnel: { submitted: number; accepted: number; sent: number; delivered: number; read: number }
}

export interface AIAnalytics {
  aiResponsesGenerated: number
  aiAccuracyFeedback: number
  aiEscalations: number
  humanTakeovers: number
  aiResponseTimeMs: number
  knowledgeBaseUsage: number
  workflowTriggerRate: number
}

export interface AgentAnalytics {
  activeAgents: number
  assignedConversations: number
  closedConversations: number
  averageResolutionTimeMs: number
  customerResponseTimeMs: number
  agentWorkload: number
  agentAvailability: number
}

export interface WorkflowAnalytics {
  workflowExecutions: number
  workflowSuccessRate: number
  workflowFailures: number
  averageExecutionTimeMs: number
  mostUsedWorkflows: Array<{ id: string; name: string; executions: number }>
}

export interface QueueAnalytics {
  queueSize: number
  activeWorkers: number
  workerThroughput: number
  averageProcessingTimeMs: number
  retryRate: number
  deadLetterQueueSize: number
  queueHealth: 'healthy' | 'degraded' | 'critical'
}

export interface ChannelAnalytics {
  channel: string
  messages: number
  deliveries: number
  replies: number
  failures: number
  activeConversations: number
}

export interface ContactAnalytics {
  totalContacts: number
  newContacts: number
  returningContacts: number
  contactSources: Array<{ source: string; count: number }>
  campaignSources: Array<{ campaignId: string; campaignName: string; count: number }>
  industryDistribution: Array<{ industry: string; count: number }>
}

export interface OrganizationAnalytics {
  organizationSummary: Array<{ id: string; name: string; campaigns: number; conversations: number; messages: number }>
  monthlyActivity: Array<{ month: string; campaigns: number; conversations: number; messages: number }>
}

export interface ReportDefinition {
  type: 'campaign' | 'conversation' | 'delivery' | 'ai' | 'workflow' | 'agent' | 'organization'
  format: 'csv' | 'xlsx' | 'pdf'
  filters: ReportFilters
  title?: string
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  organizationId?: string
  campaignId?: string
  channel?: string
  period?: AnalyticsPeriod
}
