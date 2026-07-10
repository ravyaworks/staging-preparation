import type { ConversationContext, TenantContext, UserContext, SessionContext, MessageContext, BusinessContext, ConfigContext, CompositeContext } from './types';

export function buildConversationContext(params: {
  conversationId: string;
  tenantId: string;
  title?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}): ConversationContext {
  const now = new Date();
  return {
    conversationId: params.conversationId,
    tenantId: params.tenantId,
    title: params.title,
    channel: params.channel,
    metadata: params.metadata,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildTenantContext(params: {
  tenantId: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
  features?: string[];
}): TenantContext {
  return {
    tenantId: params.tenantId,
    name: params.name,
    slug: params.slug,
    settings: params.settings,
    features: params.features,
  };
}

export function buildUserContext(params: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role?: string;
  metadata?: Record<string, unknown>;
}): UserContext {
  return {
    userId: params.userId,
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    tenantId: params.tenantId,
    role: params.role,
    metadata: params.metadata,
  };
}

export function buildSessionContext(params: {
  sessionId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): SessionContext {
  return {
    sessionId: params.sessionId,
    userId: params.userId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    metadata: params.metadata,
  };
}

export function buildMessageContext(params: {
  messageId: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}): MessageContext {
  return {
    messageId: params.messageId,
    conversationId: params.conversationId,
    role: params.role,
    content: params.content,
    timestamp: new Date(),
    metadata: params.metadata,
  };
}

export function buildBusinessContext(params?: {
  businessName?: string;
  industry?: string;
  timezone?: string;
  locale?: string;
  customFields?: Record<string, unknown>;
}): BusinessContext {
  return { ...params };
}

export function buildConfigContext(params?: {
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  features?: Record<string, boolean>;
}): ConfigContext {
  return { ...params };
}

export function buildCompositeContext(params: {
  conversation: ConversationContext;
  tenant: TenantContext;
  user?: UserContext;
  session?: SessionContext;
  messages: MessageContext[];
  business?: BusinessContext;
  config?: ConfigContext;
}): CompositeContext {
  return { ...params };
}
