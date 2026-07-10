import { ConversationClient } from '@conversation-platform/sdk';
import type { ApiResponse } from '@conversation-platform/types';
import type {
  Conversation,
  SDKPaginatedResult,
  Message,
  Channel,
  Webhook,
  CreateWebhookParams,
  CreateConversationParams,
  ListConversationsParams,
  ListMessagesParams,
  KnowledgeQuery,
  Document,
  Workflow,
  WorkflowExecution,
  AnalyticsQuery,
  AnalyticsResult,
} from '@conversation-platform/sdk';
import { cookies } from 'next/headers';
import { cache } from 'react';

export interface NextSDKConfig {
  baseUrl: string;
  apiKey: string;
}

function createClient(config: NextSDKConfig): ConversationClient {
  return new ConversationClient(config.baseUrl, config.apiKey);
}

export const getServerClient = cache((config: NextSDKConfig): ConversationClient => {
  return createClient(config);
});

export async function getTokenFromCookies(
  cookieName: string = 'session_token',
): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value;
}

export async function fetchConversations(
  config: NextSDKConfig,
  params?: ListConversationsParams,
): Promise<ApiResponse<SDKPaginatedResult<Conversation>>> {
  const client = getServerClient(config);
  return client.list(params);
}

export async function fetchConversation(
  config: NextSDKConfig,
  id: string,
): Promise<ApiResponse<Conversation>> {
  const client = getServerClient(config);
  return client.get(id);
}

export async function createConversation(
  config: NextSDKConfig,
  params: CreateConversationParams,
): Promise<ApiResponse<Conversation>> {
  const client = getServerClient(config);
  return client.create(params);
}

export async function fetchMessages(
  config: NextSDKConfig,
  conversationId: string,
  params?: ListMessagesParams,
): Promise<ApiResponse<SDKPaginatedResult<Message>>> {
  const client = getServerClient(config);
  return client.listMessages(conversationId, params);
}

export async function sendMessage(
  config: NextSDKConfig,
  conversationId: string,
  content: string,
): Promise<ApiResponse<Message>> {
  const client = getServerClient(config);
  return client.sendMessage(conversationId, content);
}

export async function fetchChannels(
  config: NextSDKConfig,
): Promise<ApiResponse<Channel[]>> {
  const client = getServerClient(config);
  return client.listChannels();
}

export async function fetchWebhooks(
  config: NextSDKConfig,
): Promise<ApiResponse<Webhook[]>> {
  const client = getServerClient(config);
  return client.listWebhooks();
}

export async function createWebhook(
  config: NextSDKConfig,
  params: CreateWebhookParams,
): Promise<ApiResponse<Webhook>> {
  const client = getServerClient(config);
  return client.createWebhook(params);
}

export async function deleteWebhook(
  config: NextSDKConfig,
  id: string,
): Promise<ApiResponse<void>> {
  const client = getServerClient(config);
  return client.deleteWebhook(id);
}

export async function searchKnowledge(
  config: NextSDKConfig,
  query: string,
): Promise<ApiResponse<KnowledgeQuery>> {
  const client = getServerClient(config);
  return client.searchKnowledge(query);
}

export async function fetchDocuments(
  config: NextSDKConfig,
  libraryId: string,
): Promise<ApiResponse<Document[]>> {
  const client = getServerClient(config);
  return client.listDocuments(libraryId);
}

export async function fetchWorkflows(
  config: NextSDKConfig,
): Promise<ApiResponse<Workflow[]>> {
  const client = getServerClient(config);
  return client.listWorkflows();
}

export async function executeWorkflow(
  config: NextSDKConfig,
  id: string,
  input: Record<string, unknown>,
): Promise<ApiResponse<WorkflowExecution>> {
  const client = getServerClient(config);
  return client.executeWorkflow(id, input);
}

export async function queryAnalytics(
  config: NextSDKConfig,
  params: AnalyticsQuery,
): Promise<ApiResponse<AnalyticsResult>> {
  const client = getServerClient(config);
  return client.queryAnalytics(params);
}

export { ConversationClient } from '@conversation-platform/sdk';
export { ConversationProvider } from '@conversation-platform/sdk-react';
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
