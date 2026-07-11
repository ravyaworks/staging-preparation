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
      Tenant: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          domain: { type: 'string' },
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
  },
}

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(spec)
})

export { router as docsRoutes, spec }
