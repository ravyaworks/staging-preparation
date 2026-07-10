import type { ProviderName, TokenUsage, ChatCompletionRequest } from '@conversation-platform/provider-framework';
import type { Logger } from '@conversation-platform/logger';

export interface AIEngineConfig {
  defaultProvider: ProviderName;
  defaultModel: string;
  maxRetries: number;
  retryDelayMs: number;
  fallbackProvider?: ProviderName;
  fallbackModel?: string;
  timeout: number;
  maxTokensPerRequest: number;
  trackCost: boolean;
  budgetLimit?: number;
}

export interface RetryStrategy {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrorCodes: string[];
}

export interface FallbackStrategy {
  providers: Array<{ provider: ProviderName; model: string }>;
  onFailure: 'next-provider' | 'next-model' | 'fail';
}

export interface TokenCost {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  currency: string;
}

export interface AIEngineRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  provider?: ProviderName;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIEngineResponse {
  content: string;
  model: string;
  provider: ProviderName;
  usage: TokenCost;
  latency: number;
  finishReason: string;
  metadata?: Record<string, unknown>;
}

export interface AIEngineStreamEvent {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  usage?: TokenCost;
  error?: string;
  metadata?: Record<string, unknown>;
}

export type AIEngineStreamCallback = (event: AIEngineStreamEvent) => void | Promise<void>;

export class AIEngineError extends Error {
  public readonly code: string;
  public readonly provider?: ProviderName;
  constructor(code: string, message: string, provider?: ProviderName) {
    super(message);
    this.name = 'AIEngineError';
    this.code = code;
    this.provider = provider;
  }
}
