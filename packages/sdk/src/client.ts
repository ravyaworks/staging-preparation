import type { ApiResponse } from '@conversation-platform/types';
import type {
  AnalyticsQuery,
  AnalyticsResult,
  Channel,
  ConnectChannelParams,
  Conversation,
  CreateConversationParams,
  CreateWebhookParams,
  Document,
  KnowledgeQuery,
  ListConversationsParams,
  ListMessagesParams,
  Message,
  SDKPaginatedResult,
  SendMessageParams,
  Webhook,
  Workflow,
  WorkflowExecution,
} from './types';

interface RequestOptions {
  signal?: AbortSignal;
}

export class ConversationClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(
    path: string,
    options: RequestInit & RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    const json = await response.json() as ApiResponse<T>;

    if (!response.ok) {
      throw new SDKError(
        json.error?.message ?? `Request failed with status ${response.status}`,
        json.error?.code ?? 'UNKNOWN_ERROR',
        response.status,
      );
    }

    return json;
  }

  // Conversations
  async list(
    params?: ListConversationsParams,
    options?: RequestOptions,
  ): Promise<ApiResponse<SDKPaginatedResult<Conversation>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.channelId) searchParams.set('channelId', params.channelId);

    const qs = searchParams.toString();
    return this.request<SDKPaginatedResult<Conversation>>(
      `/conversations${qs ? `?${qs}` : ''}`,
      { signal: options?.signal },
    );
  }

  async get(
    id: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>(`/conversations/${id}`, {
      signal: options?.signal,
    });
  }

  async create(
    params: CreateConversationParams,
    options?: RequestOptions,
  ): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
      signal: options?.signal,
    });
  }

  // Messages
  async listMessages(
    conversationId: string,
    params?: ListMessagesParams,
    options?: RequestOptions,
  ): Promise<ApiResponse<SDKPaginatedResult<Message>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.before) searchParams.set('before', params.before);
    if (params?.after) searchParams.set('after', params.after);

    const qs = searchParams.toString();
    return this.request<SDKPaginatedResult<Message>>(
      `/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`,
      { signal: options?.signal },
    );
  }

  async sendMessage(
    conversationId: string,
    content: string,
    params?: Omit<SendMessageParams, 'content'>,
    options?: RequestOptions,
  ): Promise<ApiResponse<Message>> {
    return this.request<Message>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, ...params }),
        signal: options?.signal,
      },
    );
  }

  // Channels
  async listChannels(
    options?: RequestOptions,
  ): Promise<ApiResponse<Channel[]>> {
    return this.request<Channel[]>('/channels', { signal: options?.signal });
  }

  async connectChannel(
    type: string,
    config: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse<Channel>> {
    return this.request<Channel>('/channels', {
      method: 'POST',
      body: JSON.stringify({ type, config } satisfies Omit<ConnectChannelParams, 'name'>),
      signal: options?.signal,
    });
  }

  async disconnectChannel(
    type: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/channels/${type}`, {
      method: 'DELETE',
      signal: options?.signal,
    });
  }

  // Webhooks
  async listWebhooks(
    options?: RequestOptions,
  ): Promise<ApiResponse<Webhook[]>> {
    return this.request<Webhook[]>('/webhooks', { signal: options?.signal });
  }

  async createWebhook(
    config: CreateWebhookParams,
    options?: RequestOptions,
  ): Promise<ApiResponse<Webhook>> {
    return this.request<Webhook>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(config),
      signal: options?.signal,
    });
  }

  async deleteWebhook(
    id: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/webhooks/${id}`, {
      method: 'DELETE',
      signal: options?.signal,
    });
  }

  // Knowledge
  async searchKnowledge(
    query: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<KnowledgeQuery>> {
    return this.request<KnowledgeQuery>('/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
      signal: options?.signal,
    });
  }

  async listDocuments(
    libraryId: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<Document[]>> {
    return this.request<Document[]>(`/knowledge/libraries/${libraryId}/documents`, {
      signal: options?.signal,
    });
  }

  // Workflows
  async listWorkflows(
    options?: RequestOptions,
  ): Promise<ApiResponse<Workflow[]>> {
    return this.request<Workflow[]>('/workflows', { signal: options?.signal });
  }

  async executeWorkflow(
    id: string,
    input: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse<WorkflowExecution>> {
    return this.request<WorkflowExecution>(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
      signal: options?.signal,
    });
  }

  // Analytics
  async queryAnalytics(
    params: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<ApiResponse<AnalyticsResult>> {
    return this.request<AnalyticsResult>('/analytics/query', {
      method: 'POST',
      body: JSON.stringify(params),
      signal: options?.signal,
    });
  }
}

export class SDKError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'SDKError';
    this.code = code;
    this.status = status;
  }
}
