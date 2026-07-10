import { ConversationClient } from '@conversation-platform/sdk';
import { createContext, useContext, type ReactNode } from 'react';

interface ConversationContextValue {
  client: ConversationClient | null;
}

const ConversationContext = createContext<ConversationContextValue>({
  client: null,
});

interface ConversationProviderProps {
  baseUrl: string;
  apiKey: string;
  children: ReactNode;
}

export function ConversationProvider({
  baseUrl,
  apiKey,
  children,
}: ConversationProviderProps) {
  const client = new ConversationClient(baseUrl, apiKey);

  return (
    <ConversationContext.Provider value={{ client }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationClient(): ConversationClient {
  const { client } = useContext(ConversationContext);
  if (!client) {
    throw new Error(
      'useConversationClient must be used within a ConversationProvider',
    );
  }
  return client;
}
