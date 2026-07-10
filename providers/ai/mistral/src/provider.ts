import type { AIProvider, ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ModelInfo, ModelCapabilities, ProviderName } from '@conversation-platform/provider-framework';
import { ProviderError, RateLimitError, TimeoutError } from '@conversation-platform/provider-framework';

const MISTRAL_MODELS: Array<{ id: string; capabilities: Partial<ModelCapabilities>; contextWindow: number }> = [
  { id: 'mistral-large-2407', capabilities: { streaming: true, functionCalling: true, vision: true, jsonMode: true }, contextWindow: 128000 },
  { id: 'mistral-small-2402', capabilities: { streaming: true, functionCalling: true, vision: false, jsonMode: true }, contextWindow: 32000 },
  { id: 'mistral-nemo-2407', capabilities: { streaming: true, functionCalling: true, vision: false, jsonMode: true }, contextWindow: 128000 },
  { id: 'open-mistral-nemo', capabilities: { streaming: true, functionCalling: true, vision: false, jsonMode: true }, contextWindow: 32000 },
  { id: 'open-mixtral-8x22b', capabilities: { streaming: true, functionCalling: true, vision: false, jsonMode: true }, contextWindow: 64000 },
  { id: 'open-mistral-7b', capabilities: { streaming: true, functionCalling: false, vision: false, jsonMode: false }, contextWindow: 32000 },
];

export class MistralProvider implements AIProvider {
  readonly name: ProviderName = 'mistral';
  private config!: ProviderConfig;
  private baseUrl = 'https://api.mistral.ai/v1';

  initialize(config: ProviderConfig): void {
    this.config = config;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  async getModels(): Promise<ModelInfo[]> {
    return MISTRAL_MODELS.map(m => ({
      id: m.id,
      provider: 'mistral' as ProviderName,
      name: m.id,
      capabilities: {
        streaming: m.capabilities.streaming ?? false,
        functionCalling: m.capabilities.functionCalling ?? false,
        vision: m.capabilities.vision ?? false,
        embedding: false,
        fineTuning: false,
        jsonMode: m.capabilities.jsonMode ?? false,
      },
      contextWindow: m.contextWindow,
      maxOutputTokens: 4096,
      pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' },
    }));
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const body = this.buildBody(request);
    const response = await this.apiPost<{
      id: string; model: string; choices: Array<{ message: { content: string | null }; finish_reason: string }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    }>('/chat/completions', body);

    const choice = response.choices[0];
    if (!choice) throw new ProviderError({ code: 'EMPTY_RESPONSE', message: 'No choices returned', provider: 'mistral' });

    return {
      id: response.id,
      model: response.model,
      provider: 'mistral',
      content: choice.message.content ?? '',
      usage: { promptTokens: response.usage.prompt_tokens, completionTokens: response.usage.completion_tokens, totalTokens: response.usage.total_tokens },
      finishReason: this.mapFinishReason(choice.finish_reason),
      latency: Date.now() - start,
    };
  }

  async chatStream(request: ChatCompletionRequest, onEvent: (chunk: ChatCompletionChunk) => void | Promise<void>): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const body = { ...this.buildBody(request), stream: true };
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw this.handleError(response, await response.text().catch(() => ''));
    }

    const reader = response.body?.getReader();
    if (!reader) throw new ProviderError({ code: 'NO_STREAM', message: 'Response body is not readable', provider: 'mistral' });

    const decoder = new TextDecoder();
    let content = '';
    let model = '';
    let id = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            content += delta.content;
            id = parsed.id ?? id;
            model = parsed.model ?? model;
            await onEvent({
              id: parsed.id ?? id,
              model: parsed.model ?? model,
              provider: 'mistral',
              content: delta.content,
              finishReason: parsed.choices[0]?.finish_reason,
            });
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    return {
      id, model: model || request.model, provider: 'mistral', content,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: 'stop', latency: Date.now() - start,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      const models = await this.apiGet<{ object: string; data: Array<{ id: string }> }>('/models');
      return { healthy: Array.isArray(models.data), latency: Date.now() - start };
    } catch (error) {
      return { healthy: false, latency: Date.now() - start, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private buildBody(request: ChatCompletionRequest): Record<string, unknown> {
    return {
      model: request.model,
      messages: request.messages.map(m => ({ role: m.role, content: m.content, name: m.name })),
      temperature: request.temperature,
      top_p: request.topP,
      max_tokens: request.maxTokens,
      stop: request.stop,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      tools: request.tools,
      tool_choice: request.toolChoice,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey ?? ''}`,
    };
  }

  private async apiGet<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, { headers: this.getHeaders() });
    if (!response.ok) throw this.handleError(response, await response.text().catch(() => ''));
    return response.json() as Promise<T>;
  }

  private async apiPost<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout ?? 60000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw this.handleError(response, await response.text().catch(() => ''));
      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError({ message: `Request to Mistral timed out after ${this.config.timeout ?? 60000}ms`, provider: 'mistral' });
      }
      throw new ProviderError({ code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : String(error), provider: 'mistral', retryable: true });
    } finally {
      clearTimeout(timeout);
    }
  }

  private handleError(response: Response, body: string): ProviderError {
    const status = response.status;
    if (status === 429) {
      const retryAfter = response.headers.get('retry-after');
      return new RateLimitError({ message: `Mistral rate limited: ${body}`, provider: 'mistral', retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined });
    }
    if (status === 401) return new ProviderError({ code: 'UNAUTHORIZED', message: 'Invalid Mistral API key', provider: 'mistral', statusCode: 401 });
    if (status === 500) return new ProviderError({ code: 'SERVER_ERROR', message: `Mistral server error: ${body}`, provider: 'mistral', statusCode: 500, retryable: true });
    return new ProviderError({ code: `HTTP_${status}`, message: body, provider: 'mistral', statusCode: status, retryable: status >= 500 });
  }

  private mapFinishReason(reason: string): ChatCompletionResponse['finishReason'] {
    const map: Record<string, ChatCompletionResponse['finishReason']> = {
      stop: 'stop', length: 'length', model_length: 'length', tool_calls: 'tool_calls',
    };
    return map[reason] ?? 'unknown';
  }
}
