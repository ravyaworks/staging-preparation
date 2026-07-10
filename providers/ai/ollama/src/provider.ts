import type { AIProvider, ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ModelInfo, ModelCapabilities, ProviderName } from '@conversation-platform/provider-framework';
import { ProviderError, TimeoutError, calculateTokenUsage } from '@conversation-platform/provider-framework';

const OLLAMA_FALLBACK_MODELS = [
  'llama3.1:8b', 'llama3.1:70b', 'mistral:7b', 'codellama:7b', 'mixtral:8x7b', 'phi3:mini',
];

export class OllamaProvider implements AIProvider {
  readonly name: ProviderName = 'ollama';
  private config!: ProviderConfig;
  private baseUrl = 'http://localhost:11434';

  initialize(config: ProviderConfig): void {
    this.config = config;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error(`Failed to fetch models: ${response.status}`);
      const data = await response.json() as { models: Array<{ name: string }> };
      if (!data.models || !Array.isArray(data.models)) throw new Error('Invalid response format');
      return data.models.map(m => ({
        id: m.name,
        provider: 'ollama' as ProviderName,
        name: m.name,
        capabilities: {
          streaming: true, functionCalling: false, vision: m.name.includes('vision') || m.name.includes('llava'),
          embedding: m.name.includes('embed'), fineTuning: false, jsonMode: m.name.includes('3') || m.name.includes('mixtral'),
        },
        contextWindow: 8192,
        maxOutputTokens: 4096,
        pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' },
      }));
    } catch {
      return OLLAMA_FALLBACK_MODELS.map(id => ({
        id,
        provider: 'ollama' as ProviderName,
        name: id,
        capabilities: {
          streaming: true, functionCalling: false, vision: id.includes('llava'),
          embedding: false, fineTuning: false, jsonMode: id.includes('3') || id.includes('mixtral'),
        },
        contextWindow: 8192,
        maxOutputTokens: 4096,
        pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' },
      }));
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const body = {
      model: request.model,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      options: {
        temperature: request.temperature,
        top_p: request.topP,
        num_predict: request.maxTokens,
      },
    };

    const response = await this.apiPost<{
      model: string; created_at: string; message: { role: string; content: string };
      done: boolean; total_duration?: number; load_duration?: number;
    }>('/api/chat', body);

    const usage = calculateTokenUsage(request.messages, response.message.content);

    return {
      id: `${Date.now()}`,
      model: response.model,
      provider: 'ollama',
      content: response.message.content,
      usage,
      finishReason: response.done ? 'stop' : 'length',
      latency: Date.now() - start,
    };
  }

  async chatStream(request: ChatCompletionRequest, onEvent: (chunk: ChatCompletionChunk) => void | Promise<void>): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const body = {
      model: request.model,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      options: {
        temperature: request.temperature,
        top_p: request.topP,
        num_predict: request.maxTokens,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw this.handleError(response, await response.text().catch(() => ''));
    }

    const reader = response.body?.getReader();
    if (!reader) throw new ProviderError({ code: 'NO_STREAM', message: 'Response body is not readable', provider: 'ollama' });

    const decoder = new TextDecoder();
    let content = '';
    let done = false;

    while (true) {
      const { done: readerDone, value } = await reader.read();
      if (readerDone) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.trim().length > 0);

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            content += parsed.message.content;
            await onEvent({
              id: `${Date.now()}`,
              model: parsed.model ?? request.model,
              provider: 'ollama',
              content: parsed.message.content,
              finishReason: parsed.done ? 'stop' : undefined,
            });
          }
          if (parsed.done) done = true;
        } catch {
          // Skip malformed chunks
        }
      }
    }

    const usage = calculateTokenUsage(request.messages, content);

    return {
      id: `${Date.now()}`,
      model: request.model,
      provider: 'ollama',
      content,
      usage,
      finishReason: done ? 'stop' : 'unknown',
      latency: Date.now() - start,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}`);
      return { healthy: response.ok, latency: Date.now() - start };
    } catch (error) {
      return { healthy: false, latency: Date.now() - start, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async apiPost<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout ?? 60000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw this.handleError(response, await response.text().catch(() => ''));
      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError({ message: `Request to Ollama timed out after ${this.config.timeout ?? 60000}ms`, provider: 'ollama' });
      }
      throw new ProviderError({ code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : String(error), provider: 'ollama', retryable: true });
    } finally {
      clearTimeout(timeout);
    }
  }

  private handleError(response: Response, body: string): ProviderError {
    const status = response.status;
    if (status === 429) {
      return new ProviderError({ code: 'RATE_LIMITED', message: `Ollama rate limited: ${body}`, provider: 'ollama', statusCode: 429, retryable: true });
    }
    if (status >= 500) return new ProviderError({ code: 'SERVER_ERROR', message: `Ollama server error: ${body}`, provider: 'ollama', statusCode: status, retryable: true });
    return new ProviderError({ code: `HTTP_${status}`, message: body, provider: 'ollama', statusCode: status, retryable: false });
  }
}
