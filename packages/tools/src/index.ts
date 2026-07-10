import type { ToolDefinition, ToolHandler, ToolExecutionContext } from '@conversation-platform/tool-engine';

export const ToolCategories = {
  CALENDAR: 'calendar',
  CRM: 'crm',
  EMAIL: 'email',
  HTTP: 'http',
  DATABASE: 'database',
  STORAGE: 'storage',
  SEARCH: 'search',
  WEBHOOK: 'webhook',
  NOTIFICATION: 'notification',
  LEAD_CAPTURE: 'lead_capture',
  TASK_MANAGEMENT: 'task_management',
  DOCUMENT_READER: 'document_reader',
} as const;

export function createCalendarToolDef(): ToolDefinition {
  return {
    id: 'tool_calendar',
    name: 'Calendar',
    description: 'Calendar event management and scheduling',
    version: '1.0.0',
    category: ToolCategories.CALENDAR,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'create, read, update, delete, list' },
      { name: 'eventId', type: 'string', required: false, description: 'Event ID' },
      { name: 'title', type: 'string', required: false, description: 'Event title' },
      { name: 'startTime', type: 'string', required: false, description: 'ISO start time' },
      { name: 'endTime', type: 'string', required: false, description: 'ISO end time' },
      { name: 'attendees', type: 'array', required: false, description: 'Attendee emails' },
    ],
    metadata: { capabilities: ['scheduling', 'calendar'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createCrmToolDef(): ToolDefinition {
  return {
    id: 'tool_crm',
    name: 'CRM',
    description: 'Customer relationship management operations',
    version: '1.0.0',
    category: ToolCategories.CRM,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'createContact, getContact, updateContact, listContacts, createDeal, updateDeal' },
      { name: 'contactId', type: 'string', required: false },
      { name: 'name', type: 'string', required: false },
      { name: 'email', type: 'string', required: false },
      { name: 'phone', type: 'string', required: false },
    ],
    metadata: { capabilities: ['crm', 'contacts'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createEmailToolDef(): ToolDefinition {
  return {
    id: 'tool_email',
    name: 'Email',
    description: 'Send and manage emails',
    version: '1.0.0',
    category: ToolCategories.EMAIL,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'send, get, list' },
      { name: 'to', type: 'array', required: true, description: 'Recipient emails' },
      { name: 'subject', type: 'string', required: true },
      { name: 'body', type: 'string', required: true },
      { name: 'cc', type: 'array', required: false },
      { name: 'bcc', type: 'array', required: false },
      { name: 'attachments', type: 'array', required: false },
    ],
    metadata: { capabilities: ['email', 'communication'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createHttpRequestToolDef(): ToolDefinition {
  return {
    id: 'tool_http',
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    version: '1.0.0',
    category: ToolCategories.HTTP,
    parameters: [
      { name: 'method', type: 'string', required: true, description: 'GET, POST, PUT, PATCH, DELETE' },
      { name: 'url', type: 'string', required: true },
      { name: 'headers', type: 'object', required: false },
      { name: 'body', type: 'object', required: false },
      { name: 'timeout', type: 'number', required: false, defaultValue: 30000 },
    ],
    metadata: { capabilities: ['http', 'api', 'integration'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createDatabaseToolDef(): ToolDefinition {
  return {
    id: 'tool_database',
    name: 'Database Query',
    description: 'Execute database queries and operations',
    version: '1.0.0',
    category: ToolCategories.DATABASE,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'query, execute, listTables, describeTable' },
      { name: 'query', type: 'string', required: false },
      { name: 'params', type: 'array', required: false },
      { name: 'table', type: 'string', required: false },
    ],
    metadata: { capabilities: ['database', 'data'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createFileStorageToolDef(): ToolDefinition {
  return {
    id: 'tool_storage',
    name: 'File Storage',
    description: 'Upload, download, and manage files',
    version: '1.0.0',
    category: ToolCategories.STORAGE,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'upload, download, delete, list, getUrl' },
      { name: 'fileId', type: 'string', required: false },
      { name: 'fileName', type: 'string', required: false },
      { name: 'content', type: 'string', required: false },
      { name: 'path', type: 'string', required: false },
    ],
    metadata: { capabilities: ['storage', 'files'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createSearchToolDef(): ToolDefinition {
  return {
    id: 'tool_search',
    name: 'Search',
    description: 'Perform searches across indexed content',
    version: '1.0.0',
    category: ToolCategories.SEARCH,
    parameters: [
      { name: 'query', type: 'string', required: true },
      { name: 'limit', type: 'number', required: false, defaultValue: 10 },
      { name: 'filters', type: 'object', required: false },
      { name: 'collections', type: 'array', required: false },
    ],
    metadata: { capabilities: ['search', 'discovery'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createWebhookToolDef(): ToolDefinition {
  return {
    id: 'tool_webhook',
    name: 'Webhook',
    description: 'Send and receive webhooks',
    version: '1.0.0',
    category: ToolCategories.WEBHOOK,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'send, create, delete, list' },
      { name: 'url', type: 'string', required: false },
      { name: 'payload', type: 'object', required: false },
      { name: 'headers', type: 'object', required: false },
      { name: 'secret', type: 'string', required: false },
    ],
    metadata: { capabilities: ['webhook', 'integration'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createNotificationToolDef(): ToolDefinition {
  return {
    id: 'tool_notification',
    name: 'Notification',
    description: 'Send notifications via multiple channels',
    version: '1.0.0',
    category: ToolCategories.NOTIFICATION,
    parameters: [
      { name: 'channel', type: 'string', required: true, description: 'in_app, push, email, sms' },
      { name: 'recipient', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'message', type: 'string', required: true },
      { name: 'priority', type: 'string', required: false, defaultValue: 'normal' },
    ],
    metadata: { capabilities: ['notification', 'communication'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createLeadCaptureToolDef(): ToolDefinition {
  return {
    id: 'tool_lead_capture',
    name: 'Lead Capture',
    description: 'Capture and manage leads',
    version: '1.0.0',
    category: ToolCategories.LEAD_CAPTURE,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'create, update, get, list, qualify' },
      { name: 'leadId', type: 'string', required: false },
      { name: 'name', type: 'string', required: false },
      { name: 'email', type: 'string', required: false },
      { name: 'phone', type: 'string', required: false },
      { name: 'source', type: 'string', required: false },
      { name: 'score', type: 'number', required: false },
    ],
    metadata: { capabilities: ['crm', 'leads', 'sales'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createTaskManagementToolDef(): ToolDefinition {
  return {
    id: 'tool_task_management',
    name: 'Task Management',
    description: 'Create and manage tasks',
    version: '1.0.0',
    category: ToolCategories.TASK_MANAGEMENT,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'create, update, get, list, assign, complete' },
      { name: 'taskId', type: 'string', required: false },
      { name: 'title', type: 'string', required: false },
      { name: 'description', type: 'string', required: false },
      { name: 'assignee', type: 'string', required: false },
      { name: 'dueDate', type: 'string', required: false },
      { name: 'priority', type: 'string', required: false },
      { name: 'status', type: 'string', required: false },
    ],
    metadata: { capabilities: ['task', 'project_management'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createDocumentReaderToolDef(): ToolDefinition {
  return {
    id: 'tool_document_reader',
    name: 'Document Reader',
    description: 'Read and extract content from documents',
    version: '1.0.0',
    category: ToolCategories.DOCUMENT_READER,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'read, extractText, extractMetadata, summarize' },
      { name: 'documentId', type: 'string', required: false },
      { name: 'content', type: 'string', required: false },
      { name: 'format', type: 'string', required: false },
    ],
    metadata: { capabilities: ['document', 'content_extraction'] },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getAllDefaultToolDefs(): ToolDefinition[] {
  return [
    createCalendarToolDef(),
    createCrmToolDef(),
    createEmailToolDef(),
    createHttpRequestToolDef(),
    createDatabaseToolDef(),
    createFileStorageToolDef(),
    createSearchToolDef(),
    createWebhookToolDef(),
    createNotificationToolDef(),
    createLeadCaptureToolDef(),
    createTaskManagementToolDef(),
    createDocumentReaderToolDef(),
  ];
}

export function createDefaultToolHandlerStub(): ToolHandler {
  return {
    async execute(params: Record<string, unknown>, _context?: ToolExecutionContext): Promise<Record<string, unknown>> {
      const action = params.action as string ?? 'unknown';
      return {
        action,
        status: 'not_implemented',
        message: `Tool action '${action}' requires a concrete provider implementation`,
        params,
      };
    },
    validate(params: Record<string, unknown>) {
      const errors: string[] = [];
      if (!params.action) errors.push('action parameter is required');
      return { valid: errors.length === 0, errors };
    },
  };
}
