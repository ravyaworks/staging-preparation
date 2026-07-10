import { ConversationClient as CoreClient, SDKError } from '@conversation-platform/sdk';
import type { ApiResponse } from '@conversation-platform/types';
import type { Message } from '@conversation-platform/sdk';

export class ConversationClient extends CoreClient {
  constructor(baseUrl: string, apiKey: string) {
    super(baseUrl, apiKey);
  }

  async *streamMessages(
    conversationId: string,
    options?: { signal?: AbortSignal },
  ): AsyncGenerator<Message, void, unknown> {
    const url = `${(this as unknown as { baseUrl: string }).baseUrl}/conversations/${conversationId}/messages/stream`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${(this as unknown as { apiKey: string }).apiKey}`,
        Accept: 'text/event-stream',
      },
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new SDKError(
        `Stream request failed with status ${response.status}`,
        'STREAM_ERROR',
        response.status,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new SDKError('No response body', 'STREAM_ERROR', 0);
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'message' && data.payload) {
              yield data.payload as Message;
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export async function createServerClient(
  baseUrl: string,
  apiKey: string,
): Promise<ConversationClient> {
  const client = new ConversationClient(baseUrl, apiKey);
  return client;
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
