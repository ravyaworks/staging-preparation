import { describe, it, expect, vi } from 'vitest';
import { ConversationStateManager, createConversationEngine, ConversationError } from '../index';

describe('ConversationStateManager', () => {
  it('initialize creates a state', () => {
    const mgr = new ConversationStateManager();
    const state = mgr.initialize('c1');
    expect(state.conversationId).toBe('c1');
    expect(state.status).toBe('active');
    expect(state.waitingForInput).toBe(true);
  });

  it('get returns undefined for unknown conversation', () => {
    const mgr = new ConversationStateManager();
    expect(mgr.get('nope')).toBeUndefined();
  });

  it('setStatus updates status', () => {
    const mgr = new ConversationStateManager();
    mgr.initialize('c1');
    mgr.setStatus('c1', 'resolved');
    expect(mgr.get('c1')?.status).toBe('resolved');
  });

  it('setProcessing toggles processing and waiting states', () => {
    const mgr = new ConversationStateManager();
    mgr.initialize('c1');
    mgr.setProcessing('c1', true);
    expect(mgr.get('c1')?.processingMessage).toBe(true);
    expect(mgr.get('c1')?.waitingForInput).toBe(false);
    mgr.setProcessing('c1', false);
    expect(mgr.get('c1')?.processingMessage).toBe(false);
    expect(mgr.get('c1')?.waitingForInput).toBe(true);
  });

  it('getAllByStatus filters correctly', () => {
    const mgr = new ConversationStateManager();
    mgr.initialize('c1');
    mgr.initialize('c2');
    mgr.setStatus('c2', 'resolved');
    expect(mgr.getAllByStatus('active')).toHaveLength(1);
    expect(mgr.getAllByStatus('resolved')).toHaveLength(1);
  });
});

describe('createConversationEngine', () => {
  const mockAiEngine = { chat: vi.fn(), chatStream: vi.fn(), getTracker: vi.fn() };
  const mockPromptRegistry = { register: vi.fn(), get: vi.fn(), compile: vi.fn(), getOrThrow: vi.fn(), getAll: vi.fn(), findByTag: vi.fn(), remove: vi.fn(), clear: vi.fn(), get count() { return 0; } };
  const mockMemoryManager = { addEntry: vi.fn(), getHistory: vi.fn(), getOrCreateConversationMemory: vi.fn(), setSummary: vi.fn(), getSummary: vi.fn(), deleteConversation: vi.fn(), getStats: vi.fn(), clear: vi.fn() };
  const mockContextManager = { setConversation: vi.fn(), getConversation: vi.fn(), setTenant: vi.fn(), getTenant: vi.fn(), buildComposite: vi.fn(), getBusiness: vi.fn(), getConfig: vi.fn(), clear: vi.fn() };
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  function createEngine() {
    return createConversationEngine({
      aiEngine: mockAiEngine as any,
      promptRegistry: mockPromptRegistry as any,
      memoryManager: mockMemoryManager as any,
      contextManager: mockContextManager as any,
      logger: mockLogger as any,
    });
  }

  it('createConversation creates and returns a conversation', async () => {
    mockPromptRegistry.compile.mockRejectedValue(new Error('not found'));
    mockContextManager.getConversation.mockReturnValue(undefined);
    mockMemoryManager.getOrCreateConversationMemory.mockResolvedValue({ conversationId: 'c1', entries: [], createdAt: new Date(), updatedAt: new Date() });

    const engine = createEngine();
    const conv = await engine.createConversation({ tenantId: 't1', channel: 'web', userId: 'u1', title: 'Support' });
    expect(conv.id).toBeTruthy();
    expect(conv.tenantId).toBe('t1');
    expect(conv.status).toBe('active');
    expect(conv.channel).toBe('web');
  });

  it('getConversation returns undefined for unknown', async () => {
    const engine = createEngine();
    expect(await engine.getConversation('nope')).toBeUndefined();
  });

  it('listConversations returns created conversations', async () => {
    const engine = createEngine();
    await engine.createConversation({ tenantId: 't1', channel: 'web' });
    await engine.createConversation({ tenantId: 't2', channel: 'mobile' });
    const list = await engine.listConversations();
    expect(list.length).toBeGreaterThanOrEqual(2);
    const filtered = await engine.listConversations({ tenantId: 't1' });
    expect(filtered.every(c => c.tenantId === 't1')).toBe(true);
  });

  it('updateConversationStatus throws for unknown', async () => {
    const engine = createEngine();
    await expect(engine.updateConversationStatus('nope', 'closed')).rejects.toThrow(ConversationError);
  });

  it('updateConversationStatus updates status', async () => {
    const engine = createEngine();
    const conv = await engine.createConversation({ tenantId: 't1', channel: 'web' });
    const updated = await engine.updateConversationStatus(conv.id, 'resolved');
    expect(updated.status).toBe('resolved');
    expect(updated.resolvedAt).toBeInstanceOf(Date);
  });

  it('getConversationStats returns counts', async () => {
    const engine = createEngine();
    const conv = await engine.createConversation({ tenantId: 't1', channel: 'web' });
    await engine.updateConversationStatus(conv.id, 'resolved');
    await engine.createConversation({ tenantId: 't1', channel: 'web' });
    const stats = await engine.getConversationStats();
    expect(stats.total).toBe(2);
    expect(stats.resolved).toBe(1);
    expect(stats.active).toBe(1);
  });
});

describe('ConversationError', () => {
  it('creates an error with code', () => {
    const err = new ConversationError('NOT_FOUND', 'Conversation not found');
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Conversation not found');
  });
});
