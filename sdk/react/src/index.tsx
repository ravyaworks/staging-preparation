import { useCallback, useEffect, useState } from 'react';
import type { ApiResponse } from '@conversation-platform/types';
import type {
  Channel,
  Conversation,
  CreateConversationParams,
  ListConversationsParams,
  Message,
  SDKPaginatedResult,
} from '@conversation-platform/sdk';
import {
  ConversationProvider,
  useConversationClient,
} from './ConversationProvider';

export { ConversationProvider };

function useSDK() {
  const client = useConversationClient();
  return client;
}

export function useConversations(params?: ListConversationsParams) {
  const client = useSDK();
  const [data, setData] = useState<SDKPaginatedResult<Conversation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    client
      .list(params)
      .then((res: ApiResponse<SDKPaginatedResult<Conversation>>) => {
        if (res.data) setData(res.data);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [client, JSON.stringify(params)]);

  return { data, loading, error };
}

export function useMessages(conversationId: string) {
  const client = useSDK();
  const [data, setData] = useState<SDKPaginatedResult<Message> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    client
      .listMessages(conversationId)
      .then((res: ApiResponse<SDKPaginatedResult<Message>>) => {
        if (res.data) setData(res.data);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [client, conversationId]);

  return { data, loading, error };
}

export function useChannels() {
  const client = useSDK();
  const [data, setData] = useState<Channel[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    client
      .listChannels()
      .then((res: ApiResponse<Channel[]>) => {
        if (res.data) setData(res.data);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [client]);

  return { data, loading, error };
}

export function useSendMessage(conversationId: string) {
  const client = useSDK();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(
    async (content: string) => {
      setSending(true);
      setError(null);
      try {
        const res = await client.sendMessage(conversationId, content);
        if (res.data) return res.data;
        throw new Error('Failed to send message');
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setSending(false);
      }
    },
    [client, conversationId],
  );

  return { send, sending, error };
}

export function useCreateConversation() {
  const client = useSDK();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (params: CreateConversationParams) => {
      setCreating(true);
      setError(null);
      try {
        const res = await client.create(params);
        if (res.data) return res.data;
        throw new Error('Failed to create conversation');
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setCreating(false);
      }
    },
    [client],
  );

  return { create, creating, error };
}
