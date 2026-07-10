import { describe, it, expect } from 'vitest';
import { buildConversationContext, buildTenantContext, buildUserContext, buildSessionContext, buildMessageContext, buildBusinessContext, buildConfigContext, buildCompositeContext, compressMessages, summarizeContext, ContextManager } from '../index';

describe('Builder functions', () => {
  it('buildConversationContext returns correct shape', () => {
    const ctx = buildConversationContext({ conversationId: 'c1', tenantId: 't1', title: 'Test', channel: 'web' });
    expect(ctx.conversationId).toBe('c1');
    expect(ctx.tenantId).toBe('t1');
    expect(ctx.createdAt).toBeInstanceOf(Date);
  });

  it('buildTenantContext returns correct shape', () => {
    const ctx = buildTenantContext({ tenantId: 't1', name: 'Acme', slug: 'acme', features: ['chat'] });
    expect(ctx.name).toBe('Acme');
    expect(ctx.features).toEqual(['chat']);
  });

  it('buildUserContext returns correct shape', () => {
    const ctx = buildUserContext({ userId: 'u1', email: 'a@b.com', firstName: 'John', lastName: 'Doe', tenantId: 't1', role: 'admin' });
    expect(ctx.email).toBe('a@b.com');
    expect(ctx.role).toBe('admin');
  });

  it('buildSessionContext returns correct shape', () => {
    const ctx = buildSessionContext({ sessionId: 's1', userId: 'u1', ipAddress: '127.0.0.1' });
    expect(ctx.ipAddress).toBe('127.0.0.1');
  });

  it('buildMessageContext returns correct shape', () => {
    const ctx = buildMessageContext({ messageId: 'm1', conversationId: 'c1', role: 'user', content: 'hello' });
    expect(ctx.content).toBe('hello');
    expect(ctx.timestamp).toBeInstanceOf(Date);
  });

  it('buildBusinessContext and buildConfigContext handle undefined', () => {
    expect(buildBusinessContext()).toEqual({});
    expect(buildConfigContext()).toEqual({});
  });

  it('buildCompositeContext assembles all parts', () => {
    const conv = buildConversationContext({ conversationId: 'c1', tenantId: 't1' });
    const tenant = buildTenantContext({ tenantId: 't1', name: 'Acme', slug: 'acme' });
    const msg = buildMessageContext({ messageId: 'm1', conversationId: 'c1', role: 'user', content: 'hi' });
    const composite = buildCompositeContext({ conversation: conv, tenant, messages: [msg] });
    expect(composite.conversation.conversationId).toBe('c1');
    expect(composite.messages).toHaveLength(1);
  });
});

describe('compressMessages', () => {
  it('keeps messages within token budget from the end', () => {
    const msgs = [
      { messageId: 'm1', conversationId: 'c1', role: 'user' as const, content: 'a', timestamp: new Date(1) },
      { messageId: 'm2', conversationId: 'c1', role: 'user' as const, content: 'bbbbbbbb', timestamp: new Date(2) },
    ];
    const compressed = compressMessages(msgs, 2);
    expect(compressed.length).toBe(1);
    expect(compressed[0]?.messageId).toBe('m2');
  });

  it('returns empty for empty input', () => {
    expect(compressMessages([], 100)).toEqual([]);
  });
});

describe('summarizeContext', () => {
  it('creates a summary string', () => {
    const conv = buildConversationContext({ conversationId: 'c1', tenantId: 't1', title: 'Support' });
    const tenant = buildTenantContext({ tenantId: 't1', name: 'Acme', slug: 'acme' });
    const composite = buildCompositeContext({ conversation: conv, tenant, messages: [] });
    const summary = summarizeContext(composite);
    expect(summary).toContain('Support');
    expect(summary).toContain('Acme');
  });
});

describe('ContextManager', () => {
  it('set/get/remove for each context type', () => {
    const mgr = new ContextManager();
    const conv = buildConversationContext({ conversationId: 'c1', tenantId: 't1' });
    mgr.setConversation(conv);
    expect(mgr.getConversation('c1')).toBe(conv);
    expect(mgr.getConversation('nope')).toBeUndefined();
    expect(mgr.removeConversation('c1')).toBe(true);

    const tenant = buildTenantContext({ tenantId: 't1', name: 'Acme', slug: 'acme' });
    mgr.setTenant(tenant);
    expect(mgr.getTenant('t1')).toBe(tenant);

    const user = buildUserContext({ userId: 'u1', email: 'a@b.com', firstName: 'J', lastName: 'D', tenantId: 't1' });
    mgr.setUser(user);
    expect(mgr.getUser('u1')).toBe(user);

    const session = buildSessionContext({ sessionId: 's1', userId: 'u1' });
    mgr.setSession(session);
    expect(mgr.getSession('s1')).toBe(session);
  });

  it('buildComposite returns undefined when conversation missing', () => {
    const mgr = new ContextManager();
    expect(mgr.buildComposite('nonexistent', [])).toBeUndefined();
  });

  it('buildComposite returns composite when conversation and tenant exist', () => {
    const mgr = new ContextManager();
    mgr.setConversation(buildConversationContext({ conversationId: 'c1', tenantId: 't1' }));
    mgr.setTenant(buildTenantContext({ tenantId: 't1', name: 'Acme', slug: 'acme' }));
    mgr.setConfig('c1', { model: 'gpt-4' });
    const composite = mgr.buildComposite('c1', []);
    expect(composite).toBeDefined();
    expect(composite!.config?.model).toBe('gpt-4');
  });
});
