export interface ConversationContext {
  conversationId: string;
  tenantId: string;
  title?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenantId: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
  features?: string[];
}

export interface UserContext {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageContext {
  messageId: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface BusinessContext {
  businessName?: string;
  industry?: string;
  timezone?: string;
  locale?: string;
  customFields?: Record<string, unknown>;
}

export interface ConfigContext {
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  features?: Record<string, boolean>;
}

export interface CompositeContext {
  conversation: ConversationContext;
  tenant: TenantContext;
  user?: UserContext;
  session?: SessionContext;
  messages: MessageContext[];
  business?: BusinessContext;
  config?: ConfigContext;
}

export class ContextError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ContextError';
    this.code = code;
  }
}
