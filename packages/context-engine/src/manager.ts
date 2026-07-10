import type { CompositeContext, ConversationContext, TenantContext, UserContext, SessionContext, MessageContext, BusinessContext, ConfigContext } from './types';

export class ContextManager {
  private conversations = new Map<string, ConversationContext>();
  private tenants = new Map<string, TenantContext>();
  private users = new Map<string, UserContext>();
  private sessions = new Map<string, SessionContext>();
  private businesses = new Map<string, BusinessContext>();
  private configs = new Map<string, ConfigContext>();

  setConversation(context: ConversationContext): void {
    this.conversations.set(context.conversationId, context);
  }

  setTenant(context: TenantContext): void {
    this.tenants.set(context.tenantId, context);
  }

  setUser(context: UserContext): void {
    this.users.set(context.userId, context);
  }

  setSession(context: SessionContext): void {
    this.sessions.set(context.sessionId, context);
  }

  setBusiness(tenantId: string, context: BusinessContext): void {
    this.businesses.set(tenantId, context);
  }

  setConfig(conversationId: string, context: ConfigContext): void {
    this.configs.set(conversationId, context);
  }

  getConversation(id: string): ConversationContext | undefined {
    return this.conversations.get(id);
  }

  getTenant(id: string): TenantContext | undefined {
    return this.tenants.get(id);
  }

  getUser(id: string): UserContext | undefined {
    return this.users.get(id);
  }

  getSession(id: string): SessionContext | undefined {
    return this.sessions.get(id);
  }

  getBusiness(tenantId: string): BusinessContext | undefined {
    return this.businesses.get(tenantId);
  }

  getConfig(conversationId: string): ConfigContext | undefined {
    return this.configs.get(conversationId);
  }

  buildComposite(conversationId: string, messages: MessageContext[]): CompositeContext | undefined {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return undefined;
    const tenant = this.tenants.get(conversation.tenantId);
    if (!tenant) return undefined;
    return {
      conversation,
      tenant,
      messages,
      business: this.businesses.get(conversation.tenantId),
      config: this.configs.get(conversationId),
    };
  }

  removeConversation(id: string): boolean { return this.conversations.delete(id); }
  removeTenant(id: string): boolean { return this.tenants.delete(id); }
  removeUser(id: string): boolean { return this.users.delete(id); }
  removeSession(id: string): boolean { return this.sessions.delete(id); }

  clear(): void {
    this.conversations.clear();
    this.tenants.clear();
    this.users.clear();
    this.sessions.clear();
    this.businesses.clear();
    this.configs.clear();
  }
}
