-- Phase 10 remediation migration
-- Fixes C-14 (missing tenantId on Message), C-15 (orphaned contactId FK)
-- Adds all tables from schema.prisma that were missing in the initial migration

-- Create remaining tables from schema that were missing in initial migration

-- ChannelConnections
CREATE TABLE IF NOT EXISTS "channel_connections" (
    "id" UUID NOT NULL,
    "channelType" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    "config" JSONB DEFAULT '{}',
    "authConfig" JSONB DEFAULT '{}',
    "connectedAt" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,
    CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "channel_connections_tenantId_channelType_key" ON "channel_connections"("tenantId", "channelType");
CREATE INDEX IF NOT EXISTS "channel_connections_tenantId_idx" ON "channel_connections"("tenantId");
CREATE INDEX IF NOT EXISTS "channel_connections_channelType_idx" ON "channel_connections"("channelType");
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integrations
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" UUID NOT NULL,
    "channelType" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "settings" JSONB DEFAULT '{}',
    "error" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,
    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_tenantId_channelType_name_key" ON "integrations"("tenantId", "channelType", "name");
CREATE INDEX IF NOT EXISTS "integrations_tenantId_idx" ON "integrations"("tenantId");
CREATE INDEX IF NOT EXISTS "integrations_channelType_idx" ON "integrations"("channelType");
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- IntegrationLogs
CREATE TABLE IF NOT EXISTS "integration_logs" (
    "id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrationId" UUID NOT NULL,
    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "integration_logs_integrationId_idx" ON "integration_logs"("integrationId");
CREATE INDEX IF NOT EXISTS "integration_logs_createdAt_idx" ON "integration_logs"("createdAt");
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- IntegrationUsage
CREATE TABLE IF NOT EXISTS "integration_usages" (
    "id" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesReceived" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "totalLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrationId" UUID NOT NULL,
    CONSTRAINT "integration_usages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "integration_usages_integrationId_periodStart_key" ON "integration_usages"("integrationId", "periodStart");
CREATE INDEX IF NOT EXISTS "integration_usages_integrationId_idx" ON "integration_usages"("integrationId");
ALTER TABLE "integration_usages" ADD CONSTRAINT "integration_usages_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Contacts
CREATE TABLE IF NOT EXISTS "contacts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "avatarUrl" VARCHAR(512),
    "channels" JSONB DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB DEFAULT '{}',
    "notes" TEXT,
    "campaignSource" VARCHAR(100),
    "conversationCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "tenantId" UUID NOT NULL,
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "contacts_tenantId_idx" ON "contacts"("tenantId");
CREATE INDEX IF NOT EXISTS "contacts_phone_idx" ON "contacts"("phone");
CREATE INDEX IF NOT EXISTS "contacts_email_idx" ON "contacts"("email");
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Conversations
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "channel" VARCHAR(50),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" VARCHAR(500),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "isAiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isHumanHandoff" BOOLEAN NOT NULL DEFAULT false,
    "slaDeadline" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "contactId" UUID,
    "assignedToId" UUID,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "conversations_tenantId_idx" ON "conversations"("tenantId");
CREATE INDEX IF NOT EXISTS "conversations_userId_idx" ON "conversations"("userId");
CREATE INDEX IF NOT EXISTS "conversations_assignedToId_idx" ON "conversations"("assignedToId");
CREATE INDEX IF NOT EXISTS "conversations_contactId_idx" ON "conversations"("contactId");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");
CREATE INDEX IF NOT EXISTS "conversations_priority_idx" ON "conversations"("priority");
CREATE INDEX IF NOT EXISTS "conversations_channel_idx" ON "conversations"("channel");
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Messages
CREATE TABLE IF NOT EXISTS "messages" (
    "id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "direction" VARCHAR(20) NOT NULL DEFAULT 'inbound',
    "messageType" VARCHAR(50) NOT NULL DEFAULT 'text',
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "provider" VARCHAR(50),
    "model" VARCHAR(100),
    "tokenCount" INTEGER,
    "latency" INTEGER,
    "attachments" JSONB DEFAULT '[]',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" UUID NOT NULL,
    "contactId" UUID,
    "tenantId" UUID NOT NULL,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages"("conversationId");
CREATE INDEX IF NOT EXISTS "messages_contactId_idx" ON "messages"("contactId");
CREATE INDEX IF NOT EXISTS "messages_tenantId_idx" ON "messages"("tenantId");
CREATE INDEX IF NOT EXISTS "messages_direction_idx" ON "messages"("direction");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OutreachJobs
CREATE TABLE IF NOT EXISTS "outreach_jobs" (
    "id" UUID NOT NULL,
    "recipientName" VARCHAR(255) NOT NULL,
    "recipientPhone" VARCHAR(50) NOT NULL,
    "messageTemplate" VARCHAR(500) NOT NULL,
    "personalizedMessage" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "senderResult" JSONB DEFAULT '{}',
    "scheduledAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockedBy" VARCHAR(100),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID,
    "campaignId" UUID,
    CONSTRAINT "outreach_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "outreach_jobs_status_idx" ON "outreach_jobs"("status");
CREATE INDEX IF NOT EXISTS "outreach_jobs_tenantId_idx" ON "outreach_jobs"("tenantId");
CREATE INDEX IF NOT EXISTS "outreach_jobs_campaignId_idx" ON "outreach_jobs"("campaignId");
CREATE INDEX IF NOT EXISTS "outreach_jobs_lockedAt_idx" ON "outreach_jobs"("lockedAt");
CREATE INDEX IF NOT EXISTS "outreach_jobs_createdAt_idx" ON "outreach_jobs"("createdAt");
ALTER TABLE "outreach_jobs" ADD CONSTRAINT "outreach_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "outreach_jobs" ADD CONSTRAINT "outreach_jobs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Campaigns
CREATE TABLE IF NOT EXISTS "campaigns" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "channel" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "organizationId" UUID NOT NULL,
    "createdBy" UUID,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "campaigns_organizationId_idx" ON "campaigns"("organizationId");
CREATE INDEX IF NOT EXISTS "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX IF NOT EXISTS "campaigns_channel_idx" ON "campaigns"("channel");
CREATE INDEX IF NOT EXISTS "campaigns_createdAt_idx" ON "campaigns"("createdAt");
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CampaignBusinesses
CREATE TABLE IF NOT EXISTS "campaign_businesses" (
    "id" UUID NOT NULL,
    "businessName" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "industry" VARCHAR(100),
    "previewUrl" VARCHAR(512),
    "personalizedMessage" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "errors" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" UUID NOT NULL,
    "outreachJobId" UUID,
    "contactId" UUID,
    "conversationId" UUID,
    CONSTRAINT "campaign_businesses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_businesses_campaignId_phone_key" ON "campaign_businesses"("campaignId", "phone");
CREATE INDEX IF NOT EXISTS "campaign_businesses_campaignId_idx" ON "campaign_businesses"("campaignId");
CREATE INDEX IF NOT EXISTS "campaign_businesses_status_idx" ON "campaign_businesses"("status");
CREATE INDEX IF NOT EXISTS "campaign_businesses_contactId_idx" ON "campaign_businesses"("contactId");
CREATE INDEX IF NOT EXISTS "campaign_businesses_conversationId_idx" ON "campaign_businesses"("conversationId");
ALTER TABLE "campaign_businesses" ADD CONSTRAINT "campaign_businesses_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CampaignStatistics
CREATE TABLE IF NOT EXISTS "campaign_statistics" (
    "id" UUID NOT NULL,
    "totalBusinesses" INTEGER NOT NULL DEFAULT 0,
    "jobsCreated" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,
    "queued" INTEGER NOT NULL DEFAULT 0,
    "sending" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "read" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "replied" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" UUID NOT NULL,
    CONSTRAINT "campaign_statistics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_statistics_campaignId_key" ON "campaign_statistics"("campaignId");
ALTER TABLE "campaign_statistics" ADD CONSTRAINT "campaign_statistics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CampaignLogs
CREATE TABLE IF NOT EXISTS "campaign_logs" (
    "id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" UUID NOT NULL,
    "userId" UUID,
    CONSTRAINT "campaign_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "campaign_logs_campaignId_idx" ON "campaign_logs"("campaignId");
CREATE INDEX IF NOT EXISTS "campaign_logs_createdAt_idx" ON "campaign_logs"("createdAt");
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CampaignTags
CREATE TABLE IF NOT EXISTS "campaign_tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" UUID NOT NULL,
    CONSTRAINT "campaign_tags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_tags_campaignId_name_key" ON "campaign_tags"("campaignId", "name");
CREATE INDEX IF NOT EXISTS "campaign_tags_campaignId_idx" ON "campaign_tags"("campaignId");
ALTER TABLE "campaign_tags" ADD CONSTRAINT "campaign_tags_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DeliveryEvents
CREATE TABLE IF NOT EXISTS "delivery_events" (
    "id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "previousStatus" VARCHAR(20),
    "currentStatus" VARCHAR(20) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workerId" VARCHAR(100),
    "channel" VARCHAR(50),
    "metadata" JSONB DEFAULT '{}',
    "jobId" UUID NOT NULL,
    CONSTRAINT "delivery_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "delivery_events_jobId_idx" ON "delivery_events"("jobId");
CREATE INDEX IF NOT EXISTS "delivery_events_jobId_timestamp_idx" ON "delivery_events"("jobId", "timestamp");
CREATE INDEX IF NOT EXISTS "delivery_events_type_idx" ON "delivery_events"("type");
CREATE INDEX IF NOT EXISTS "delivery_events_timestamp_idx" ON "delivery_events"("timestamp");
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "outreach_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- JobFailures
CREATE TABLE IF NOT EXISTS "job_failures" (
    "id" UUID NOT NULL,
    "errorType" VARCHAR(100) NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "stackTrace" TEXT,
    "resolutionStatus" VARCHAR(20) NOT NULL DEFAULT 'unresolved',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobId" UUID NOT NULL,
    CONSTRAINT "job_failures_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "job_failures_jobId_idx" ON "job_failures"("jobId");
CREATE INDEX IF NOT EXISTS "job_failures_resolutionStatus_idx" ON "job_failures"("resolutionStatus");
CREATE INDEX IF NOT EXISTS "job_failures_errorType_idx" ON "job_failures"("errorType");
ALTER TABLE "job_failures" ADD CONSTRAINT "job_failures_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "outreach_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- WorkerMetrics
CREATE TABLE IF NOT EXISTS "worker_metrics" (
    "id" UUID NOT NULL,
    "workerId" VARCHAR(100) NOT NULL,
    "currentJobId" UUID,
    "jobsProcessed" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "averageProcessingMs" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'idle',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "worker_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "worker_metrics_workerId_key" ON "worker_metrics"("workerId");
CREATE INDEX IF NOT EXISTS "worker_metrics_status_idx" ON "worker_metrics"("status");
CREATE INDEX IF NOT EXISTS "worker_metrics_lastHeartbeatAt_idx" ON "worker_metrics"("lastHeartbeatAt");

-- DeliveryNotifications
CREATE TABLE IF NOT EXISTS "delivery_notifications" (
    "id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "delivery_notifications_type_idx" ON "delivery_notifications"("type");
CREATE INDEX IF NOT EXISTS "delivery_notifications_severity_idx" ON "delivery_notifications"("severity");
CREATE INDEX IF NOT EXISTS "delivery_notifications_acknowledged_idx" ON "delivery_notifications"("acknowledged");
CREATE INDEX IF NOT EXISTS "delivery_notifications_createdAt_idx" ON "delivery_notifications"("createdAt");

-- OutreachApiKeys
CREATE TABLE IF NOT EXISTS "outreach_api_keys" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "keyPrefix" VARCHAR(20) NOT NULL,
    "organizationId" UUID NOT NULL,
    "tenantId" UUID,
    "createdBy" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowedIps" JSONB DEFAULT '[]',
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "outreach_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "outreach_api_keys_key_key" ON "outreach_api_keys"("key");
CREATE INDEX IF NOT EXISTS "outreach_api_keys_organizationId_idx" ON "outreach_api_keys"("organizationId");
CREATE INDEX IF NOT EXISTS "outreach_api_keys_keyPrefix_idx" ON "outreach_api_keys"("keyPrefix");
CREATE INDEX IF NOT EXISTS "outreach_api_keys_isActive_idx" ON "outreach_api_keys"("isActive");
ALTER TABLE "outreach_api_keys" ADD CONSTRAINT "outreach_api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "outreach_api_keys" ADD CONSTRAINT "outreach_api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ImportJobs
CREATE TABLE IF NOT EXISTS "import_jobs" (
    "id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'json',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" JSONB DEFAULT '[]',
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "organizationId" UUID NOT NULL,
    "campaignId" UUID,
    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "import_jobs_organizationId_idx" ON "import_jobs"("organizationId");
CREATE INDEX IF NOT EXISTS "import_jobs_campaignId_idx" ON "import_jobs"("campaignId");
CREATE INDEX IF NOT EXISTS "import_jobs_status_idx" ON "import_jobs"("status");
CREATE INDEX IF NOT EXISTS "import_jobs_createdAt_idx" ON "import_jobs"("createdAt");
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ImportRecords
CREATE TABLE IF NOT EXISTS "import_records" (
    "id" UUID NOT NULL,
    "rowNumber" INTEGER,
    "businessName" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "industry" VARCHAR(100),
    "previewUrl" VARCHAR(512),
    "personalizedMessage" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "errors" JSONB DEFAULT '[]',
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "importJobId" UUID NOT NULL,
    "campaignBusinessId" UUID,
    CONSTRAINT "import_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "import_records_importJobId_idx" ON "import_records"("importJobId");
CREATE INDEX IF NOT EXISTS "import_records_campaignBusinessId_idx" ON "import_records"("campaignBusinessId");
CREATE INDEX IF NOT EXISTS "import_records_status_idx" ON "import_records"("status");
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_campaignBusinessId_fkey" FOREIGN KEY ("campaignBusinessId") REFERENCES "campaign_businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AnalyticsEvents
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "tenantId" UUID,
    "organizationId" UUID,
    "userId" UUID,
    "campaignId" UUID,
    "conversationId" UUID,
    "contactId" UUID,
    "channel" VARCHAR(50),
    "value" DOUBLE PRECISION,
    "data" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "analytics_events_type_timestamp_idx" ON "analytics_events"("type", "timestamp");
CREATE INDEX IF NOT EXISTS "analytics_events_source_timestamp_idx" ON "analytics_events"("source", "timestamp");
CREATE INDEX IF NOT EXISTS "analytics_events_tenantId_timestamp_idx" ON "analytics_events"("tenantId", "timestamp");
CREATE INDEX IF NOT EXISTS "analytics_events_organizationId_timestamp_idx" ON "analytics_events"("organizationId", "timestamp");
CREATE INDEX IF NOT EXISTS "analytics_events_campaignId_idx" ON "analytics_events"("campaignId");
CREATE INDEX IF NOT EXISTS "analytics_events_conversationId_idx" ON "analytics_events"("conversationId");
CREATE INDEX IF NOT EXISTS "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

-- AnalyticsMetrics
CREATE TABLE IF NOT EXISTS "analytics_metrics" (
    "id" UUID NOT NULL,
    "metric" VARCHAR(100) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimension" VARCHAR(255),
    "tenantId" UUID,
    "organizationId" UUID,
    "period" VARCHAR(20) NOT NULL,
    "bucket" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_metrics_metric_period_bucket_dimension_tenantId_organizationId_key" ON "analytics_metrics"("metric", "period", "bucket", "dimension", "tenantId", "organizationId");
CREATE INDEX IF NOT EXISTS "analytics_metrics_metric_tenantId_period_bucket_idx" ON "analytics_metrics"("metric", "tenantId", "period", "bucket");
CREATE INDEX IF NOT EXISTS "analytics_metrics_metric_organizationId_period_bucket_idx" ON "analytics_metrics"("metric", "organizationId", "period", "bucket");

-- FeatureFlags
CREATE TABLE IF NOT EXISTS "feature_flags" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID,
    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_key_key" ON "feature_flags"("key");
CREATE INDEX IF NOT EXISTS "feature_flags_tenantId_idx" ON "feature_flags"("tenantId");
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MaintenanceWindows
CREATE TABLE IF NOT EXISTS "maintenance_windows" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("id")
);
