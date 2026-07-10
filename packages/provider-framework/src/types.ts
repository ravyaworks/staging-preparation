// --- Message Types ---
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// --- Provider Types ---
export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'deepseek' | 'ollama' | 'openrouter';

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
  options?: Record<string, unknown>;
}

// --- Request Types ---
export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string[];
  frequencyPenalty?: number;
  presencePenalty?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

// --- Response Types ---
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  provider: ProviderName;
  content: string;
  toolCalls?: ToolCall[];
  usage: TokenUsage;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error' | 'unknown';
  latency: number;
  metadata?: Record<string, unknown>;
}

export interface ChatCompletionChunk {
  id: string;
  model: string;
  provider: ProviderName;
  content: string;
  toolCalls?: ToolCall[];
  usage?: Partial<TokenUsage>;
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

// --- Error Types ---
export class ProviderError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly provider: ProviderName;
  public readonly retryable: boolean;

  constructor(params: { code: string; message: string; provider: ProviderName; statusCode?: number; retryable?: boolean }) {
    super(params.message);
    this.name = 'ProviderError';
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.provider = params.provider;
    this.retryable = params.retryable ?? false;
  }
}

export class RateLimitError extends ProviderError {
  public readonly retryAfter?: number;
  constructor(params: { message: string; provider: ProviderName; retryAfter?: number }) {
    super({ code: 'RATE_LIMITED', message: params.message, provider: params.provider, statusCode: 429, retryable: true });
    this.name = 'RateLimitError';
    this.retryAfter = params.retryAfter;
  }
}

export class TimeoutError extends ProviderError {
  constructor(params: { message: string; provider: ProviderName }) {
    super({ code: 'TIMEOUT', message: params.message, provider: params.provider, statusCode: 408, retryable: true });
    this.name = 'TimeoutError';
  }
}

// --- Streaming Types ---
export type StreamEvent =
  | { type: 'chunk'; data: ChatCompletionChunk }
  | { type: 'error'; error: ProviderError }
  | { type: 'done'; usage: TokenUsage }
  | { type: 'metadata'; data: Record<string, unknown> };

export type StreamCallback = (event: StreamEvent) => void | Promise<void>;

// --- Model Info ---
export interface ModelInfo {
  id: string;
  provider: ProviderName;
  name: string;
  capabilities: ModelCapabilities;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: ModelPricing;
  metadata?: Record<string, unknown>;
}

export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  embedding: boolean;
  fineTuning: boolean;
  jsonMode: boolean;
}

export interface ModelPricing {
  inputPer1kTokens: number;
  outputPer1kTokens: number;
  currency: string;
}
