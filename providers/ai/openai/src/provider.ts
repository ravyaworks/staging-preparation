import type { AIProvider, ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ModelInfo, ModelCapabilities, ProviderName } from '@conversation-platform/provider-framework';
import { ProviderError, RateLimitError, TimeoutError, calculateTokenUsage } from '@conversation-platform/provider-framework';

export class OpenAIProvider implements AIProvider {
  readonly name: ProviderName = 'openai';
  private config!: ProviderConfig;
  private baseUrl = 'https://api.openai.com/v1';

  initialize(config: ProviderConfig): void {
    this.config = config;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  async getModels(): Promise<ModelInfo[]> {
    const models = await this.apiGet<{ data: Array<{ id: string; created: number }> }>('/models');
    return models.data.map(m => ({
      id: m.id,
      provider: 'openai' as ProviderName,
      name: m.id,
      capabilities: {
        streaming: true, functionCalling: true, vision: m.id.includes('vision') || m.id.includes('gpt-4o') || m.id.includes('gpt-4-turbo'),
        embedding: m.id.includes('embedding'), fineTuning: m.id.includes('ft') || m.id.includes('gpt-3.5-turbo'), jsonMode: true,
      } as ModelCapabilities,
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' },
    }));
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const body = this.buildBody(request);
    const response = await this.apiPost<{
      id: string; model: string; choices: Array<{ message: { content: string | null; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> }; finish_reason: string }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    }>('/chat/completions', body);

    const choice = response.choices[0];
    if (!choice) throw new ProviderError({ code: 'EMPTY_RESPONSE', message: 'No choices returned', provider: 'openai' });

    return {
      id: response.id,
      model: response.model,
      provider: 'openai',
      content: choice.message.content ?? '',
      toolCalls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
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
    if (!reader) throw new ProviderError({ code: 'NO_STREAM', message: 'Response body is not readable', provider: 'openai' });

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
              provider: 'openai',
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
      id, model: model || request.model, provider: 'openai', content,
      usage: calculateTokenUsage(request.messages, content),
      finishReason: 'stop', latency: Date.now() - start,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await this.apiGet('/models');
      return { healthy: true, latency: Date.now() - start };
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey ?? ''}`,
    };
    if (this.config.organization) headers['OpenAI-Organization'] = this.config.organization;
    return headers;
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
        throw new TimeoutError({ message: `Request to OpenAI timed out after ${this.config.timeout ?? 60000}ms`, provider: 'openai' });
      }
      throw new ProviderError({ code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : String(error), provider: 'openai', retryable: true });
    } finally {
      clearTimeout(timeout);
    }
  }

  private handleError(response: Response, body: string): ProviderError {
    const status = response.status;
    if (status === 429) {
      const retryAfter = response.headers.get('retry-after');
      return new RateLimitError({ message: `OpenAI rate limited: ${body}`, provider: 'openai', retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined });
    }
    if (status === 401) return new ProviderError({ code: 'UNAUTHORIZED', message: 'Invalid OpenAI API key', provider: 'openai', statusCode: 401 });
    if (status === 500) return new ProviderError({ code: 'SERVER_ERROR', message: `OpenAI server error: ${body}`, provider: 'openai', statusCode: 500, retryable: true });
    return new ProviderError({ code: `HTTP_${status}`, message: body, provider: 'openai', statusCode: status, retryable: status >= 500 });
  }

  private mapFinishReason(reason: string): ChatCompletionResponse['finishReason'] {
    const map: Record<string, ChatCompletionResponse['finishReason']> = {
      stop: 'stop', length: 'length', tool_calls: 'tool_calls', content_filter: 'content_filter',
    };
    return map[reason] ?? 'unknown';
  }
}
