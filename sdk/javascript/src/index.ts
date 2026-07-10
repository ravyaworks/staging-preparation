import { ConversationClient as CoreClient } from '@conversation-platform/sdk';

export class ConversationClient {
  private core: CoreClient;

  constructor(baseUrl: string, apiKey: string) {
    this.core = new CoreClient(baseUrl, apiKey);
  }

  get conversations() {
    return {
      list: (params?: Parameters<CoreClient['list']>[0], options?: Parameters<CoreClient['list']>[1]) =>
        this.core.list(params, options),
      get: (id: string, options?: Parameters<CoreClient['get']>[1]) =>
        this.core.get(id, options),
      create: (params: Parameters<CoreClient['create']>[0], options?: Parameters<CoreClient['create']>[1]) =>
        this.core.create(params, options),
    };
  }

  get messages() {
    return {
      list: (conversationId: string, params?: Parameters<CoreClient['listMessages']>[1], options?: Parameters<CoreClient['listMessages']>[2]) =>
        this.core.listMessages(conversationId, params, options),
      send: (conversationId: string, content: string, params?: Parameters<CoreClient['sendMessage']>[2], options?: Parameters<CoreClient['sendMessage']>[3]) =>
        this.core.sendMessage(conversationId, content, params, options),
    };
  }

  get channels() {
    return {
      list: (options?: Parameters<CoreClient['listChannels']>[0]) =>
        this.core.listChannels(options),
      connect: (type: string, config: Record<string, unknown>, options?: Parameters<CoreClient['connectChannel']>[2]) =>
        this.core.connectChannel(type, config, options),
      disconnect: (type: string, options?: Parameters<CoreClient['disconnectChannel']>[1]) =>
        this.core.disconnectChannel(type, options),
    };
  }

  get webhooks() {
    return {
      list: (options?: Parameters<CoreClient['listWebhooks']>[0]) =>
        this.core.listWebhooks(options),
      create: (config: Parameters<CoreClient['createWebhook']>[0], options?: Parameters<CoreClient['createWebhook']>[1]) =>
        this.core.createWebhook(config, options),
      delete: (id: string, options?: Parameters<CoreClient['deleteWebhook']>[1]) =>
        this.core.deleteWebhook(id, options),
    };
  }

  get knowledge() {
    return {
      search: (query: string, options?: Parameters<CoreClient['searchKnowledge']>[1]) =>
        this.core.searchKnowledge(query, options),
      listDocuments: (libraryId: string, options?: Parameters<CoreClient['listDocuments']>[1]) =>
        this.core.listDocuments(libraryId, options),
    };
  }

  get workflows() {
    return {
      list: (options?: Parameters<CoreClient['listWorkflows']>[0]) =>
        this.core.listWorkflows(options),
      execute: (id: string, input: Record<string, unknown>, options?: Parameters<CoreClient['executeWorkflow']>[2]) =>
        this.core.executeWorkflow(id, input, options),
    };
  }

  get analytics() {
    return {
      query: (params: Parameters<CoreClient['queryAnalytics']>[0], options?: Parameters<CoreClient['queryAnalytics']>[1]) =>
        this.core.queryAnalytics(params, options),
    };
  }
}

export { SDKError } from '@conversation-platform/sdk';
export type {
  AnalyticsQuery,
  AnalyticsResult,
  Channel,
  ConnectChannelParams,
  Conversation,
  CreateConversationParams,
  CreateWebhookParams,
  Document,
  KnowledgeQuery,
  KnowledgeResult,
  ListConversationsParams,
  ListMessagesParams,
  Message,
  SDKPaginatedResult,
  SendMessageParams,
  Webhook,
  Workflow,
  WorkflowExecution,
} from '@conversation-platform/sdk';
