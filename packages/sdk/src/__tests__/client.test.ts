import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationClient, SDKError } from '../client';

const BASE_URL = 'https://api.example.com';
const API_KEY = 'test-api-key';

function createClient(): ConversationClient {
  return new ConversationClient(BASE_URL, API_KEY);
}

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      Promise.resolve({
        success: status >= 200 && status < 300,
        data,
        error: status >= 400
          ? { code: 'ERROR', message: 'Something went wrong' }
          : undefined,
      }),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('ConversationClient', () => {
  describe('conversations', () => {
    it('should list conversations', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ data: [], total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrevious: false }),
      );

      const result = await client.list();
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/conversations`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${API_KEY}`,
          }),
        }),
      );
    });

    it('should list conversations with filters', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ data: [], total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false }),
      );

      await client.list({ page: 2, limit: 10, status: 'active' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.anything(),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.anything(),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.anything(),
      );
    });

    it('should get a conversation by id', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ id: 'conv-1', status: 'active', channelId: 'ch-1', tenantId: 't-1', metadata: {}, createdAt: '', updatedAt: '' }),
      );

      const result = await client.get('conv-1');
      expect(result.data?.id).toBe('conv-1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/conversations/conv-1`,
        expect.anything(),
      );
    });

    it('should create a conversation', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ id: 'conv-new', status: 'active', channelId: 'ch-1', tenantId: 't-1', metadata: {}, createdAt: '', updatedAt: '' }),
      );

      const result = await client.create({ channelId: 'ch-1' });
      expect(result.data?.id).toBe('conv-new');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/conversations`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ channelId: 'ch-1' }),
        }),
      );
    });
  });

  describe('messages', () => {
    it('should list messages for a conversation', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ data: [], total: 0, page: 1, limit: 50, totalPages: 0, hasNext: false, hasPrevious: false }),
      );

      const result = await client.listMessages('conv-1');
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/conversations/conv-1/messages`,
        expect.anything(),
      );
    });

    it('should send a message', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ id: 'msg-1', conversationId: 'conv-1', role: 'user', content: 'Hello', metadata: {}, createdAt: '' }),
      );

      const result = await client.sendMessage('conv-1', 'Hello');
      expect(result.data?.content).toBe('Hello');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/conversations/conv-1/messages`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }),
      );
    });
  });

  describe('channels', () => {
    it('should list channels', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse([]));

      const result = await client.listChannels();
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/channels`,
        expect.anything(),
      );
    });

    it('should connect a channel', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ id: 'ch-new', type: 'slack', name: 'Slack', config: {}, enabled: true, connected: true, createdAt: '', updatedAt: '' }),
      );

      const result = await client.connectChannel('slack', { token: 'xoxb-123' });
      expect(result.data?.type).toBe('slack');
    });

    it('should disconnect a channel', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse(undefined));

      await client.disconnectChannel('slack');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/channels/slack`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('webhooks', () => {
    it('should list webhooks', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse([]));

      const result = await client.listWebhooks();
      expect(result.success).toBe(true);
    });

    it('should create a webhook', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ id: 'wh-1', url: 'https://hook.example.com', events: ['message.created'], secret: 'sec', enabled: true, createdAt: '', updatedAt: '' }),
      );

      const result = await client.createWebhook({
        url: 'https://hook.example.com',
        events: ['message.created'],
      });
      expect(result.data?.url).toBe('https://hook.example.com');
    });

    it('should delete a webhook', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse(undefined));

      await client.deleteWebhook('wh-1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/webhooks/wh-1`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('knowledge', () => {
    it('should search knowledge', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ query: 'test', results: [] }),
      );

      const result = await client.searchKnowledge('test');
      expect(result.data?.query).toBe('test');
    });

    it('should list documents', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse([]));

      const result = await client.listDocuments('lib-1');
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/knowledge/libraries/lib-1/documents`,
        expect.anything(),
      );
    });
  });

  describe('workflows', () => {
    it('should list workflows', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse([]));

      const result = await client.listWorkflows();
      expect(result.success).toBe(true);
    });

    it('should execute a workflow', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ id: 'exec-1', workflowId: 'wf-1', status: 'running', input: {}, output: null, error: null, startedAt: '', completedAt: null }),
      );

      const result = await client.executeWorkflow('wf-1', { prompt: 'Hello' });
      expect(result.data?.workflowId).toBe('wf-1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/workflows/wf-1/execute`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ input: { prompt: 'Hello' } }),
        }),
      );
    });
  });

  describe('analytics', () => {
    it('should query analytics', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(
        mockResponse({ metric: 'messages_count', data: [], summary: {} }),
      );

      const result = await client.queryAnalytics({
        metric: 'messages_count',
        dimensions: ['channel'],
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });
      expect(result.data?.metric).toBe('messages_count');
    });
  });

  describe('abort signal', () => {
    it('should pass abort signal to fetch', async () => {
      const client = createClient();
      const controller = new AbortController();
      mockFetch.mockResolvedValue(
        mockResponse({ data: [], total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrevious: false }),
      );

      await client.list({}, { signal: controller.signal });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe('SDKError', () => {
    it('should throw SDKError on non-ok response', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse(null, 500));

      await expect(client.get('conv-1')).rejects.toThrow(SDKError);
    });

    it('should include code and status in SDKError', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Conversation not found' },
          }),
      });

      try {
        await client.get('conv-1');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(SDKError);
        if (error instanceof SDKError) {
          expect(error.code).toBe('NOT_FOUND');
          expect(error.status).toBe(404);
          expect(error.message).toBe('Conversation not found');
        }
      }
    });

    it('should throw SDKError with default message when no error details', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false }),
      });

      await expect(client.list()).rejects.toThrow('Request failed with status 500');
    });
  });

  describe('request options', () => {
    it('should send JSON body as string', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse({ id: 'msg-1' }));

      await client.sendMessage('conv-1', 'Hello');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ content: 'Hello' }),
        }),
      );
    });

    it('should handle AbortSignal', async () => {
      const client = createClient();
      const controller = new AbortController();
      mockFetch.mockResolvedValue(mockResponse([]));

      await client.listChannels({ signal: controller.signal });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe('messages params', () => {
    it('should pass ListMessagesParams as query string', async () => {
      const client = createClient();
      mockFetch.mockResolvedValue(mockResponse({ data: [], total: 0, page: 1, limit: 50, totalPages: 0, hasNext: false, hasPrevious: false }));

      await client.listMessages('conv-1', { page: 2, limit: 25, before: 'msg-10', after: 'msg-5' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=25');
      expect(url).toContain('before=msg-10');
      expect(url).toContain('after=msg-5');
    });
  });
});
