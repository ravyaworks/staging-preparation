import type { AIProvider, ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ModelInfo, ProviderName } from '@conversation-platform/provider-framework';
import { ProviderError, RateLimitError, TimeoutError, calculateTokenUsage } from '@conversation-platform/provider-framework';

export class AnthropicProvider implements AIProvider {
  readonly name: ProviderName = 'anthropic';
  private config!: ProviderConfig;
  private baseUrl = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';

  initialize(config: ProviderConfig): void {
    this.config = config;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  async getModels(): Promise<ModelInfo[]> {
    return [
      { id: 'claude-sonnet-4-20250514', provider: 'anthropic', name: 'Claude Sonnet 4', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015, currency: 'USD' } },
      { id: 'claude-3-5-sonnet-20241022', provider: 'anthropic', name: 'Claude 3.5 Sonnet', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015, currency: 'USD' } },
      { id: 'claude-3-5-haiku-20241022', provider: 'anthropic', name: 'Claude 3.5 Haiku', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.0008, outputPer1kTokens: 0.004, currency: 'USD' } },
      { id: 'claude-opus-4-20250514', provider: 'anthropic', name: 'Claude Opus 4', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.015, outputPer1kTokens: 0.075, currency: 'USD' } },
    ];
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const systemMsg = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens ?? 4096,
    };
    if (systemMsg) body.system = systemMsg.content;
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.topP !== undefined) body.top_p = request.topP;
    if (request.stop) body.stop_sequences = request.stop;

    const response = await this.apiPost<{
      id: string; model: string; content: Array<{ type: string; text: string }>; stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    }>('/messages', body);

    const content = response.content.map(c => c.type === 'text' ? c.text : '').join('');

    return {
      id: response.id,
      model: response.model,
      provider: 'anthropic',
      content,
      usage: { promptTokens: response.usage.input_tokens, completionTokens: response.usage.output_tokens, totalTokens: response.usage.input_tokens + response.usage.output_tokens },
      finishReason: this.mapFinishReason(response.stop_reason),
      latency: Date.now() - start,
    };
  }

  async chatStream(request: ChatCompletionRequest, onEvent: (chunk: ChatCompletionChunk) => void | Promise<void>): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const systemMsg = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: request.model, messages, max_tokens: request.maxTokens ?? 4096, stream: true,
    };
    if (systemMsg) body.system = systemMsg.content;

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) throw this.handleError(response, await response.text().catch(() => ''));

    const reader = response.body?.getReader();
    if (!reader) throw new ProviderError({ code: 'NO_STREAM', message: 'Response body not readable', provider: 'anthropic' });

    const decoder = new TextDecoder();
    let content = '';
    let model = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            content += parsed.delta.text;
            model = parsed.model ?? model;
            await onEvent({ id: '', model: parsed.model ?? request.model, provider: 'anthropic', content: parsed.delta.text });
          }
        } catch {}
      }
    }

    return {
      id: '', model: model || request.model, provider: 'anthropic', content,
      usage: calculateTokenUsage(request.messages, content),
      finishReason: 'stop', latency: Date.now() - start,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await this.getModels();
      return { healthy: true, latency: Date.now() - start };
    } catch (error) {
      return { healthy: false, latency: Date.now() - start, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey ?? '',
      'anthropic-version': this.apiVersion,
    };
  }

  private async apiPost<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout ?? 60000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body), signal: controller.signal,
      });
      if (!response.ok) throw this.handleError(response, await response.text().catch(() => ''));
      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError({ message: `Anthropic request timed out`, provider: 'anthropic' });
      }
      throw new ProviderError({ code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : String(error), provider: 'anthropic', retryable: true });
    } finally {
      clearTimeout(timeout);
    }
  }

  private handleError(response: Response, body: string): ProviderError {
    if (response.status === 429) return new RateLimitError({ message: `Anthropic rate limited`, provider: 'anthropic' });
    if (response.status === 401) return new ProviderError({ code: 'UNAUTHORIZED', message: 'Invalid API key', provider: 'anthropic', statusCode: 401 });
    return new ProviderError({ code: `HTTP_${response.status}`, message: body, provider: 'anthropic', statusCode: response.status, retryable: response.status >= 500 });
  }

  private mapFinishReason(reason: string): ChatCompletionResponse['finishReason'] {
    const map: Record<string, ChatCompletionResponse['finishReason']> = { end_turn: 'stop', max_tokens: 'length', stop_sequence: 'stop', tool_use: 'tool_calls' };
    return map[reason] ?? 'unknown';
  }
}
