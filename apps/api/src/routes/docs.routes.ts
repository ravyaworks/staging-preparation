import { Router, type Request, type Response } from 'express'

const router: Router = Router()

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Conversation Platform API',
    version: '0.1.0',
    description: 'Production-grade multi-tenant AI Conversation Platform API',
  },
  servers: [
    { url: '/api/v1', description: 'API v1' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API key as Bearer token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Not found' },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'degraded'] },
              version: { type: 'string' },
              uptime: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
              checks: { type: 'object' },
            },
          },
        },
      },
      Metrics: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              metrics: { type: 'object' },
              uptime: { type: 'number' },
              memory: { type: 'object' },
            },
          },
        },
      },
      AuthRegister: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'tenantName', 'tenantSlug'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          tenantName: { type: 'string' },
          tenantSlug: { type: 'string', pattern: '^[a-z0-9-]+$' },
        },
      },
      AuthLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          rememberMe: { type: 'boolean' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
            },
          },
        },
      },
      Channel: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          status: { type: 'string', enum: ['connected', 'disconnected', 'error'] },
          config: { type: 'object' },
        },
      },
      ChannelMessage: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          conversationId: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
      CampaignCreate: {
        type: 'object',
        required: ['name', 'channel'],
        properties: {
          name: { type: 'string', maxLength: 255 },
          description: { type: 'string', maxLength: 2000 },
          channel: { type: 'string', enum: ['whatsapp', 'email', 'sms', 'telegram', 'instagram', 'messenger', 'slack', 'website', 'api'] },
        },
      },
      CampaignUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 255 },
          description: { type: 'string', maxLength: 2000 },
          channel: { type: 'string', enum: ['whatsapp', 'email', 'sms', 'telegram', 'instagram', 'messenger', 'slack', 'website', 'api'] },
        },
      },
      CampaignImport: {
        type: 'object',
        required: ['businesses'],
        properties: {
          businesses: {
            type: 'array',
            items: {
              type: 'object',
              required: ['businessName', 'phone', 'personalizedMessage'],
              properties: {
                businessName: { type: 'string' },
                phone: { type: 'string', description: 'E.164 format' },
                email: { type: 'string', format: 'email' },
                industry: { type: 'string' },
                previewUrl: { type: 'string', format: 'uri' },
                personalizedMessage: { type: 'string' },
              },
            },
          },
        },
      },
      CampaignTransition: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['draft', 'ready', 'running', 'paused', 'completed', 'cancelled', 'failed'] },
        },
      },
      Tenant: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          domain: { type: 'string' },
        },
      },
      DeliveryEvent: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          jobId: { type: 'string' },
          type: { type: 'string' },
          previousStatus: { type: 'string', nullable: true },
          currentStatus: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          workerId: { type: 'string', nullable: true },
          channel: { type: 'string', nullable: true },
          metadata: { type: 'object' },
        },
      },
      JobFailure: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          jobId: { type: 'string' },
          errorType: { type: 'string' },
          errorMessage: { type: 'string' },
          retryCount: { type: 'integer' },
          lastRetryAt: { type: 'string', format: 'date-time', nullable: true },
          stackTrace: { type: 'string', nullable: true },
          resolutionStatus: { type: 'string', enum: ['unresolved', 'resolved', 'dismissed', 'automatic'] },
          resolvedAt: { type: 'string', format: 'date-time', nullable: true },
          resolvedBy: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      DeliveryAnalytics: {
        type: 'object',
        properties: {
          periodStart: { type: 'string', format: 'date-time' },
          periodEnd: { type: 'string', format: 'date-time' },
          totalJobs: { type: 'integer' },
          completedJobs: { type: 'integer' },
          failedJobs: { type: 'integer' },
          retriedJobs: { type: 'integer' },
          successRate: { type: 'number' },
          failureRate: { type: 'number' },
          retryRate: { type: 'number' },
          averageJobTimeMs: { type: 'integer' },
          workerUtilization: { type: 'number' },
          activeWorkers: { type: 'integer' },
          idleWorkers: { type: 'integer' },
        },
      },
      QueueHealth: {
        type: 'object',
        properties: {
          currentLoad: { type: 'integer' },
          queuedCount: { type: 'integer' },
          processingCount: { type: 'integer' },
          averageWaitTimeMs: { type: 'integer' },
          throughputPerMinute: { type: 'integer' },
          deadLetterCount: { type: 'integer' },
          oldestJobAgeMs: { type: 'integer' },
          isHealthy: { type: 'boolean' },
        },
      },
      WorkerStatus: {
        type: 'object',
        properties: {
          workerId: { type: 'string' },
          status: { type: 'string' },
          currentJobId: { type: 'string', nullable: true },
          jobsProcessed: { type: 'integer' },
          successCount: { type: 'integer' },
          failureCount: { type: 'integer' },
          averageProcessingMs: { type: 'integer' },
          uptimeMs: { type: 'integer' },
          lastHeartbeatAt: { type: 'string', format: 'date-time' },
        },
      },
      OutreachSingleRequest: {
        type: 'object',
        required: ['businessName', 'phone', 'personalizedMessage'],
        properties: {
          businessName: { type: 'string' },
          industry: { type: 'string' },
          phone: { type: 'string', description: 'E.164 format' },
          email: { type: 'string', format: 'email' },
          previewUrl: { type: 'string', format: 'uri' },
          personalizedMessage: { type: 'string' },
          contactPerson: { type: 'string' },
          campaignName: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object' },
        },
      },
      OutreachSubmitResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          importJobId: { type: 'string' },
          campaignId: { type: 'string' },
          businesses: { type: 'array', items: { $ref: '#/components/schemas/OutreachBusinessItem' } },
          errors: { type: 'array', items: { $ref: '#/components/schemas/OutreachError' } },
        },
      },
      OutreachBusinessItem: {
        type: 'object',
        properties: {
          businessName: { type: 'string' },
          phone: { type: 'string' },
          status: { type: 'string', enum: ['imported', 'duplicate', 'invalid', 'failed'] },
          campaignBusinessId: { type: 'string' },
          outreachJobId: { type: 'string' },
          error: { type: 'string' },
        },
      },
      OutreachError: {
        type: 'object',
        properties: {
          row: { type: 'integer' },
          field: { type: 'string' },
          message: { type: 'string' },
          value: { type: 'string' },
        },
      },
      OutreachImportJob: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['json', 'csv'] },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'partial'] },
          totalRecords: { type: 'integer' },
          successCount: { type: 'integer' },
          failedCount: { type: 'integer' },
          errorSummary: { type: 'array', items: { type: 'object', properties: { row: { type: 'integer' }, message: { type: 'string' } } } },
          campaignId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      OutreachImportRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          rowNumber: { type: 'integer', nullable: true },
          businessName: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          status: { type: 'string' },
          errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
          campaignBusinessId: { type: 'string', nullable: true },
        },
      },
      OutreachBusinessDetail: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          businessName: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', nullable: true },
          industry: { type: 'string', nullable: true },
          previewUrl: { type: 'string', nullable: true },
          personalizedMessage: { type: 'string' },
          status: { type: 'string' },
          campaignId: { type: 'string' },
          campaignName: { type: 'string' },
          outreachJobId: { type: 'string', nullable: true },
          outreachJobStatus: { type: 'string', nullable: true },
          contactId: { type: 'string', nullable: true },
          conversationId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      OutreachApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          keyPrefix: { type: 'string' },
          isActive: { type: 'boolean' },
          allowedIps: { type: 'array', items: { type: 'string' } },
          rateLimitPerMinute: { type: 'integer' },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      OutreachCreateApiKey: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          allowedIps: { type: 'array', items: { type: 'string' } },
          rateLimitPerMinute: { type: 'integer', default: 60 },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      DeliveryNotification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning', 'error', 'critical'] },
          title: { type: 'string' },
          message: { type: 'string' },
          acknowledged: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'Healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthCheck' } } } } },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        responses: { '200': { description: 'Ready' } },
      },
    },
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: { '200': { description: 'Alive' } },
      },
    },
    '/health/metrics': {
      get: {
        tags: ['Health'],
        summary: 'Request metrics',
        responses: { '200': { description: 'Metrics', content: { 'application/json': { schema: { $ref: '#/components/schemas/Metrics' } } } } },
      },
    },
    '/health/metrics/reset': {
      post: {
        tags: ['Health'],
        summary: 'Reset metrics',
        responses: { '200': { description: 'Metrics reset' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new tenant with admin',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegister' } } } },
        responses: {
          '201': { description: 'Registration successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLogin' } } } },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } },
        responses: { '200': { description: 'Token refreshed' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout and invalidate tokens',
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'User profile' } },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } } } } } },
        responses: { '200': { description: 'Password changed' } },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { '200': { description: 'Reset email sent' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } } } },
        responses: { '200': { description: 'Password reset' } },
      },
    },
    '/tenants': {
      get: {
        tags: ['Tenants'],
        summary: 'List tenants',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Tenant list' } },
      },
      post: {
        tags: ['Tenants'],
        summary: 'Create tenant',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
        responses: { '201': { description: 'Tenant created' } },
      },
    },
    '/tenants/{id}': {
      get: {
        tags: ['Tenants'],
        summary: 'Get tenant by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Tenant details' } },
      },
      patch: {
        tags: ['Tenants'],
        summary: 'Update tenant',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
        responses: { '200': { description: 'Tenant updated' } },
      },
    },
    '/channels/implementations': {
      get: {
        tags: ['Channels'],
        summary: 'List available channel implementations',
        responses: { '200': { description: 'Channel implementations' } },
      },
    },
    '/channels': {
      get: {
        tags: ['Channels'],
        summary: 'List connected channels',
        responses: { '200': { description: 'Connected channels', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Channel' } } } } } },
      },
    },
    '/channels/{type}': {
      get: {
        tags: ['Channels'],
        summary: 'Get channel health',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Channel health' } },
      },
    },
    '/channels/{type}/connect': {
      post: {
        tags: ['Channels'],
        summary: 'Connect a channel',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { config: { type: 'object' }, auth: { type: 'object' } } } } } },
        responses: { '201': { description: 'Channel connected' } },
      },
    },
    '/channels/{type}/disconnect': {
      post: {
        tags: ['Channels'],
        summary: 'Disconnect a channel',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Channel disconnected' } },
      },
    },
    '/channels/{type}/reconnect': {
      post: {
        tags: ['Channels'],
        summary: 'Reconnect a channel',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Channel reconnected' } },
      },
    },
    '/channels/{type}/config': {
      patch: {
        tags: ['Channels'],
        summary: 'Update channel config',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { config: { type: 'object' } } } } } },
        responses: { '200': { description: 'Config updated' } },
      },
    },
    '/channels/{type}/messages': {
      post: {
        tags: ['Channels'],
        summary: 'Send a message through a channel',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChannelMessage' } } } },
        responses: { '201': { description: 'Message sent' } },
      },
    },
    '/channels/{type}/typing': {
      post: {
        tags: ['Channels'],
        summary: 'Send typing indicator',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { conversationId: { type: 'string' }, isTyping: { type: 'boolean' } } } } } },
        responses: { '200': { description: 'Typing indicator sent' } },
      },
    },
    '/channels/{type}/webhook': {
      post: {
        tags: ['Channels'],
        summary: 'Process incoming webhook payload',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Webhook processed' } },
      },
    },
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks',
        security: [{ apiKey: [] }],
        responses: { '200': { description: 'Webhook list' } },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Create a webhook',
        security: [{ apiKey: [] }],
        responses: { '201': { description: 'Webhook created' } },
      },
    },
    '/integrations': {
      get: {
        tags: ['Integrations'],
        summary: 'List integrations',
        security: [{ apiKey: [] }],
        responses: { '200': { description: 'Integration list' } },
      },
    },
    '/messages/{conversationId}': {
      get: {
        tags: ['Messages'],
        summary: 'List messages in conversation',
        security: [{ apiKey: [] }],
        parameters: [
          { name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Message list' } },
      },
    },
    '/events/stream': {
      get: {
        tags: ['Events'],
        summary: 'SSE event stream',
        security: [{ apiKey: [] }],
        responses: { '200': { description: 'Event stream' } },
      },
    },
    '/campaigns': {
      get: {
        tags: ['Campaigns'],
        summary: 'List campaigns',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'channel', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: { '200': { description: 'Campaign list' } },
      },
      post: {
        tags: ['Campaigns'],
        summary: 'Create campaign',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CampaignCreate' } } } },
        responses: { '201': { description: 'Campaign created' } },
      },
    },
    '/campaigns/{id}': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign details with statistics',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign details' } },
      },
      patch: {
        tags: ['Campaigns'],
        summary: 'Update campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CampaignUpdate' } } } },
        responses: { '200': { description: 'Campaign updated' } },
      },
      delete: {
        tags: ['Campaigns'],
        summary: 'Soft-delete campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign deleted' } },
      },
    },
    '/campaigns/{id}/duplicate': {
      post: {
        tags: ['Campaigns'],
        summary: 'Duplicate a campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Campaign duplicated' } },
      },
    },
    '/campaigns/{id}/transition': {
      post: {
        tags: ['Campaigns'],
        summary: 'Change campaign status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CampaignTransition' } } } },
        responses: { '200': { description: 'Status changed' } },
      },
    },
    '/campaigns/{id}/import': {
      post: {
        tags: ['Campaigns'],
        summary: 'Import businesses into campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CampaignImport' } } } },
        responses: { '201': { description: 'Businesses imported' } },
      },
    },
    '/campaigns/{id}/businesses': {
      get: {
        tags: ['Campaigns'],
        summary: 'List campaign businesses',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Business list' } },
      },
    },
    '/campaigns/{id}/statistics': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign statistics',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign statistics' } },
      },
    },
    '/campaigns/{id}/statistics/recalculate': {
      post: {
        tags: ['Campaigns'],
        summary: 'Recalculate campaign statistics',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Statistics recalculated' } },
      },
    },
    '/campaigns/{id}/logs': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign audit logs',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign logs' } },
      },
    },
    '/execution/campaigns/{id}/execute': {
      post: {
        tags: ['Campaign Execution'],
        summary: 'Execute a campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { config: { type: 'object' } } } } } },
        responses: { '201': { description: 'Campaign execution started' } },
      },
    },
    '/execution/campaigns/{id}/pause': {
      post: {
        tags: ['Campaign Execution'],
        summary: 'Pause a running campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign paused' } },
      },
    },
    '/execution/campaigns/{id}/resume': {
      post: {
        tags: ['Campaign Execution'],
        summary: 'Resume a paused campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign resumed' } },
      },
    },
    '/execution/campaigns/{id}/cancel': {
      post: {
        tags: ['Campaign Execution'],
        summary: 'Cancel a campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign cancelled' } },
      },
    },
    '/execution/campaigns/{id}/progress': {
      get: {
        tags: ['Campaign Execution'],
        summary: 'Get campaign execution progress',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign progress' } },
      },
    },
    '/execution/jobs': {
      get: {
        tags: ['Campaign Execution'],
        summary: 'List outreach jobs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'campaignId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Job list' } },
      },
    },
    '/execution/jobs/{id}': {
      get: {
        tags: ['Campaign Execution'],
        summary: 'Get job details',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job details' } },
      },
    },
    '/execution/jobs/{id}/retry': {
      post: {
        tags: ['Campaign Execution'],
        summary: 'Retry a failed job',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job requeued' } },
      },
    },
    '/execution/jobs/{id}/skip': {
      post: {
        tags: ['Campaign Execution'],
        summary: 'Skip a job',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job skipped' } },
      },
    },
    '/execution/jobs/retry-failed': {
      post: {
        tags: ['Campaign Execution'],
        summary: 'Retry all failed jobs for a campaign',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['campaignId'], properties: { campaignId: { type: 'string' } } } } } },
        responses: { '200': { description: 'Failed jobs requeued' } },
      },
    },
    '/execution/queue/status': {
      get: {
        tags: ['Campaign Execution'],
        summary: 'Get queue status',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Queue status' } },
      },
    },
    '/execution/queue/dead-letter': {
      get: {
        tags: ['Campaign Execution'],
        summary: 'Get dead letter queue entries',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'campaignId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Dead letter entries' } },
      },
    },
    '/execution/workers': {
      get: {
        tags: ['Campaign Execution'],
        summary: 'Get worker statuses',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Worker statuses' } },
      },
    },
    '/execution/scheduler/status': {
      get: {
        tags: ['Campaign Execution'],
        summary: 'Get scheduler state',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Scheduler state' } },
      },
    },

    // ========== Delivery Tracking ==========

    '/delivery/jobs': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'List all outreach jobs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'campaignId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'List of jobs with details' } },
      },
    },
    '/delivery/jobs/{id}': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get full job details including timeline and failures',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job details' }, '404': { description: 'Job not found' } },
      },
    },
    '/delivery/jobs/{id}/timeline': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get job event timeline with durations',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Timeline entries' } },
      },
    },
    '/delivery/jobs/{id}/events': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get paginated delivery events for a job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated events' } },
      },
    },
    '/delivery/jobs/{id}/failures': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get failures for a specific job',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job failures' } },
      },
    },
    '/delivery/failures': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get unresolved failures across all jobs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Unresolved failures' } },
      },
    },
    '/delivery/failures/stats': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get aggregated failure statistics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Failure stats', content: { 'application/json': { schema: { type: 'object' } } } } },
      },
    },
    '/delivery/failures/{id}/resolve': {
      post: {
        tags: ['Delivery Tracking'],
        summary: 'Resolve a failure',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { jobId: { type: 'string' }, resolutionStatus: { type: 'string' }, resolvedBy: { type: 'string' } } } } } },
        responses: { '200': { description: 'Failure resolved' } },
      },
    },
    '/delivery/analytics/delivery': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get delivery analytics for a time period',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'periodStart', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'periodEnd', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'campaignId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Delivery analytics' } },
      },
    },
    '/delivery/analytics/queue-health': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get queue health metrics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Queue health' } },
      },
    },
    '/delivery/workers': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'List all workers with status',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Worker list' } },
      },
    },
    '/delivery/workers/{id}': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'Get worker status detail',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Worker status' } },
      },
    },
    '/delivery/notifications': {
      get: {
        tags: ['Delivery Tracking'],
        summary: 'List delivery notifications',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'unreadOnly', in: 'query', schema: { type: 'boolean' } },
          { name: 'severity', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Notifications list' } },
      },
    },
    '/delivery/notifications/{id}/acknowledge': {
      post: {
        tags: ['Delivery Tracking'],
        summary: 'Acknowledge a notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Notification acknowledged' } },
      },
    },
    '/delivery/events': {
      post: {
        tags: ['Delivery Tracking'],
        summary: 'Record a delivery event (internal)',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['jobId', 'eventType', 'currentStatus'], properties: { jobId: { type: 'string' }, eventType: { type: 'string' }, currentStatus: { type: 'string' }, previousStatus: { type: 'string' }, workerId: { type: 'string' }, channel: { type: 'string' }, metadata: { type: 'object' } } } } } },
        responses: { '201': { description: 'Event created' } },
      },
    },

    // ========== WhatsApp Business Platform ==========

    '/whatsapp/webhook': {
      get: {
        tags: ['WhatsApp'],
        summary: 'Webhook verification endpoint (called by Meta)',
        parameters: [
          { name: 'hub.mode', in: 'query', schema: { type: 'string' } },
          { name: 'hub.verify_token', in: 'query', schema: { type: 'string' } },
          { name: 'hub.challenge', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Webhook verified, challenge returned' },
          '403': { description: 'Verification failed' },
        },
      },
      post: {
        tags: ['WhatsApp'],
        summary: 'Receive WhatsApp webhook notifications (called by Meta)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Webhook processed' } },
      },
    },
    '/whatsapp/health': {
      get: {
        tags: ['WhatsApp'],
        summary: 'WhatsApp integration health check',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'WhatsApp health status' } },
      },
    },
    '/whatsapp/send': {
      post: {
        tags: ['WhatsApp'],
        summary: 'Send a text message via WhatsApp',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['recipientPhone', 'message'], properties: { recipientPhone: { type: 'string' }, message: { type: 'string' }, metadata: { type: 'object' } } } } } },
        responses: { '200': { description: 'Message sent' }, '422': { description: 'Send failed' } },
      },
    },
    '/whatsapp/send/template': {
      post: {
        tags: ['WhatsApp'],
        summary: 'Send a template message',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['recipientPhone', 'templateName'], properties: { recipientPhone: { type: 'string' }, templateName: { type: 'string' }, templateLanguage: { type: 'string' }, templateVariables: { type: 'object' } } } } } },
        responses: { '200': { description: 'Template sent' } },
      },
    },
    '/whatsapp/send/image': {
      post: {
        tags: ['WhatsApp'],
        summary: 'Send an image message',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['recipientPhone', 'mediaId'], properties: { recipientPhone: { type: 'string' }, mediaId: { type: 'string' }, caption: { type: 'string' } } } } } },
        responses: { '200': { description: 'Image sent' } },
      },
    },
    '/whatsapp/send/document': {
      post: {
        tags: ['WhatsApp'],
        summary: 'Send a document message',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['recipientPhone', 'mediaId'], properties: { recipientPhone: { type: 'string' }, mediaId: { type: 'string' }, filename: { type: 'string' }, caption: { type: 'string' } } } } } },
        responses: { '200': { description: 'Document sent' } },
      },
    },
    '/whatsapp/templates': {
      get: {
        tags: ['WhatsApp'],
        summary: 'Sync WhatsApp message templates',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Template list' } },
      },
      post: {
        tags: ['WhatsApp'],
        summary: 'Create a new message template',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'language', 'category', 'components'], properties: { name: { type: 'string' }, language: { type: 'string' }, category: { type: 'string' }, components: { type: 'array' } } } } } },
        responses: { '201': { description: 'Template created' } },
      },
    },
    '/whatsapp/templates/{name}': {
      get: {
        tags: ['WhatsApp'],
        summary: 'Get a specific template by name',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Template details' }, '404': { description: 'Not found' } },
      },
    },
    '/whatsapp/templates/{id}': {
      delete: {
        tags: ['WhatsApp'],
        summary: 'Delete a message template',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Template deleted' } },
      },
    },
    '/whatsapp/media/upload': {
      post: {
        tags: ['WhatsApp'],
        summary: 'Upload media to WhatsApp',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['filePath', 'mimeType'], properties: { filePath: { type: 'string' }, mimeType: { type: 'string' } } } } } },
        responses: { '201': { description: 'Media uploaded' } },
      },
    },
    '/whatsapp/media/{id}': {
      get: {
        tags: ['WhatsApp'],
        summary: 'Get media download URL',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Media URL' } },
      },
    },
    '/whatsapp/validate/phone': {
      post: {
        tags: ['WhatsApp'],
        summary: 'Validate a phone number',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phone', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Validation result' } },
      },
    },

    // ========== Inbox ==========

    '/inbox/webhook/{channel}': {
      post: {
        tags: ['Inbox'],
        summary: 'Process an incoming webhook message from a channel',
        parameters: [
          { name: 'channel', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'x-tenant-id', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Message processed' }, '422': { description: 'Processing failed' } },
      },
    },
    '/inbox/contacts': {
      get: {
        tags: ['Inbox'],
        summary: 'List contacts',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Contact list' } },
      },
    },
    '/inbox/contacts/{id}': {
      get: {
        tags: ['Inbox'],
        summary: 'Get contact by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Contact details' }, '404': { description: 'Not found' } },
      },
      patch: {
        tags: ['Inbox'],
        summary: 'Update contact',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Contact updated' } },
      },
    },
    '/inbox/contacts/{id}/block': {
      post: {
        tags: ['Inbox'],
        summary: 'Block a contact',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Contact blocked' } },
      },
    },
    '/inbox/contacts/{id}/unblock': {
      post: {
        tags: ['Inbox'],
        summary: 'Unblock a contact',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Contact unblocked' } },
      },
    },
    '/inbox/conversations': {
      get: {
        tags: ['Inbox'],
        summary: 'List conversations',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'channel', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Conversation list' } },
      },
    },
    '/inbox/conversations/{id}': {
      get: {
        tags: ['Inbox'],
        summary: 'Get conversation details with messages',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Conversation details' }, '404': { description: 'Not found' } },
      },
    },
    '/inbox/conversations/{id}/status': {
      patch: {
        tags: ['Inbox'],
        summary: 'Update conversation status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string' } } } } } },
        responses: { '200': { description: 'Status updated' } },
      },
    },
    '/inbox/conversations/{id}/priority': {
      patch: {
        tags: ['Inbox'],
        summary: 'Update conversation priority',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['priority'], properties: { priority: { type: 'string' } } } } } },
        responses: { '200': { description: 'Priority updated' } },
      },
    },
    '/inbox/conversations/{id}/close': {
      post: {
        tags: ['Inbox'],
        summary: 'Close a conversation',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Conversation closed' } },
      },
    },
    '/inbox/conversations/{id}/reopen': {
      post: {
        tags: ['Inbox'],
        summary: 'Reopen a conversation',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Conversation reopened' } },
      },
    },
    '/inbox/conversations/{id}/messages': {
      get: {
        tags: ['Inbox'],
        summary: 'Get messages for a conversation',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'Message list' } },
      },
    },
    '/inbox/conversations/{id}/assign': {
      post: {
        tags: ['Inbox'],
        summary: 'Assign conversation to an agent',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['assignedToId', 'assignedByName'], properties: { assignedToId: { type: 'string' }, assignedByName: { type: 'string' }, reason: { type: 'string' } } } } } },
        responses: { '200': { description: 'Conversation assigned' } },
      },
    },
    '/inbox/conversations/{id}/release': {
      post: {
        tags: ['Inbox'],
        summary: 'Release conversation from human handoff',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Conversation released' } },
      },
    },
    '/inbox/conversations/{id}/notes': {
      get: {
        tags: ['Inbox'],
        summary: 'Get conversation notes',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Notes list' } },
      },
      post: {
        tags: ['Inbox'],
        summary: 'Add a note to a conversation',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
        responses: { '201': { description: 'Note created' } },
      },
    },
    '/inbox/adapters': {
      get: {
        tags: ['Inbox'],
        summary: 'List registered channel adapters',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Adapter list' } },
      },
    },
    '/inbox/adapters/{channel}/register': {
      post: {
        tags: ['Inbox'],
        summary: 'Register a channel adapter',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'channel', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Adapter registered' }, '409': { description: 'Already registered' } },
      },
    },

    // ========== Outreach ==========

    '/outreach': {
      post: {
        tags: ['Outreach'],
        summary: 'Submit a single outreach request',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OutreachSingleRequest' } } } },
        responses: { '201': { description: 'Outreach submitted' }, '422': { description: 'Validation error' } },
      },
    },
    '/outreach/bulk': {
      post: {
        tags: ['Outreach'],
        summary: 'Submit bulk outreach businesses',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['businesses'], properties: { businesses: { type: 'array', items: { $ref: '#/components/schemas/OutreachSingleRequest' } } } } } } },
        responses: { '201': { description: 'Bulk submission started' }, '422': { description: 'Validation error' } },
      },
    },
    '/outreach/import': {
      post: {
        tags: ['Outreach'],
        summary: 'Import businesses from JSON or CSV data',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type', 'data'], properties: { type: { type: 'string', enum: ['json', 'csv'] }, data: { type: 'object' }, campaignName: { type: 'string' }, campaignId: { type: 'string' } } } } } },
        responses: { '201': { description: 'Import started' }, '422': { description: 'Import failed' } },
      },
    },
    '/outreach/jobs': {
      get: {
        tags: ['Outreach'],
        summary: 'List import jobs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Import job list' } },
      },
    },
    '/outreach/jobs/{id}': {
      get: {
        tags: ['Outreach'],
        summary: 'Get import job status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Import job details' }, '404': { description: 'Not found' } },
      },
    },
    '/outreach/jobs/{id}/records': {
      get: {
        tags: ['Outreach'],
        summary: 'Get import job records',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'Import job records' }, '404': { description: 'Not found' } },
      },
    },
    '/outreach/businesses': {
      get: {
        tags: ['Outreach'],
        summary: 'List businesses with search and filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'campaignId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['businessName', 'phone', 'status', 'createdAt'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { '200': { description: 'Business list' } },
      },
    },
    '/outreach/businesses/{id}': {
      get: {
        tags: ['Outreach'],
        summary: 'Get business detail',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Business details' }, '404': { description: 'Not found' } },
      },
    },
    '/outreach/businesses/{id}/traceability': {
      get: {
        tags: ['Outreach'],
        summary: 'Get full traceability chain for a business',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Traceability chain' }, '404': { description: 'Not found' } },
      },
    },
    '/outreach/campaigns/{id}/outreach': {
      post: {
        tags: ['Outreach'],
        summary: 'Submit businesses to an existing campaign',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['businesses'], properties: { businesses: { type: 'array', items: { $ref: '#/components/schemas/OutreachSingleRequest' } } } } } } },
        responses: { '201': { description: 'Businesses added to campaign' }, '422': { description: 'Validation error' } },
      },
    },
    '/outreach/api-keys': {
      get: {
        tags: ['Outreach'],
        summary: 'List API keys',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'API key list' } },
      },
      post: {
        tags: ['Outreach'],
        summary: 'Create a new API key',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OutreachCreateApiKey' } } } },
        responses: { '201': { description: 'API key created (raw key returned once)' } },
      },
    },
    '/outreach/api-keys/{id}': {
      delete: {
        tags: ['Outreach'],
        summary: 'Revoke an API key',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'API key revoked' } },
      },
    },

    // ========== Analytics ==========

    '/analytics/overview': {
      get: {
        tags: ['Analytics'],
        summary: 'Executive dashboard overview with aggregated platform metrics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Overview stats' } },
      },
    },
    '/analytics/campaigns': {
      get: {
        tags: ['Analytics'],
        summary: 'Campaign performance analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'channel', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Campaign analytics' } },
      },
    },
    '/analytics/conversations': {
      get: {
        tags: ['Analytics'],
        summary: 'Conversation analytics and trend data',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'channel', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'organizationId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Conversation analytics' } },
      },
    },
    '/analytics/delivery': {
      get: {
        tags: ['Analytics'],
        summary: 'Delivery performance analytics with funnel',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'campaignId', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Delivery analytics' } },
      },
    },
    '/analytics/queue': {
      get: {
        tags: ['Analytics'],
        summary: 'Queue operational analytics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Queue analytics' } },
      },
    },
    '/analytics/agents': {
      get: {
        tags: ['Analytics'],
        summary: 'Agent performance analytics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Agent analytics' } },
      },
    },
    '/analytics/workflows': {
      get: {
        tags: ['Analytics'],
        summary: 'Workflow execution analytics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Workflow analytics' } },
      },
    },
    '/analytics/channels': {
      get: {
        tags: ['Analytics'],
        summary: 'Per-channel analytics comparison',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Channel analytics' } },
      },
    },
    '/analytics/ai': {
      get: {
        tags: ['Analytics'],
        summary: 'AI engine performance analytics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'AI analytics' } },
      },
    },
    '/analytics/contacts': {
      get: {
        tags: ['Analytics'],
        summary: 'Contact analytics and distribution',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Contact analytics' } },
      },
    },
    '/analytics/organizations': {
      get: {
        tags: ['Analytics'],
        summary: 'Organization-level analytics summary',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Organization analytics' } },
      },
    },
    '/analytics/reports': {
      get: {
        tags: ['Analytics'],
        summary: 'Export analytics report in specified format',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', required: true, schema: { type: 'string', enum: ['campaign', 'conversation', 'delivery', 'organization'] } },
          { name: 'format', in: 'query', required: true, schema: { type: 'string', enum: ['csv', 'xlsx', 'pdf'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Report file download' } },
      },
    },
    '/analytics/cache/invalidate': {
      post: {
        tags: ['Analytics'],
        summary: 'Invalidate analytics cache',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Cache invalidated' } },
      },
    },
  },
}

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(spec)
})

export { router as docsRoutes, spec }
