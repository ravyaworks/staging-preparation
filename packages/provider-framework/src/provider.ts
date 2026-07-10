import type { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ProviderConfig, ProviderName, ModelInfo } from './types';

export interface AIProvider {
  readonly name: ProviderName;

  initialize(config: ProviderConfig): void | Promise<void>;

  getModels(): Promise<ModelInfo[]>;

  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  chatStream(request: ChatCompletionRequest, onEvent: (chunk: ChatCompletionChunk) => void | Promise<void>): Promise<ChatCompletionResponse>;

  healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }>;
}
