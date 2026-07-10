import type { AIProvider, ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ModelInfo, ModelCapabilities, ProviderName } from '@conversation-platform/provider-framework';
import { ProviderError, RateLimitError, TimeoutError, calculateTokenUsage } from '@conversation-platform/provider-framework';

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
}

interface GeminiContent {
  parts?: GeminiPart[];
  role?: string;
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
  safetyRatings?: Array<unknown>;
}

interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
  promptFeedback?: unknown;
}

export class GeminiProvider implements AIProvider {
  readonly name: ProviderName = 'gemini';
  private config!: ProviderConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  initialize(config: ProviderConfig): void {
    this.config = config;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  async getModels(): Promise<ModelInfo[]> {
    return [
      { id: 'gemini-2.5-pro-exp-03-25', provider: 'gemini', name: 'Gemini 2.5 Pro Experimental', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: true } as ModelCapabilities, contextWindow: 1048576, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' } },
      { id: 'gemini-2.0-flash', provider: 'gemini', name: 'Gemini 2.0 Flash', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: true } as ModelCapabilities, contextWindow: 1048576, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.0001, outputPer1kTokens: 0.0004, currency: 'USD' } },
      { id: 'gemini-1.5-pro', provider: 'gemini', name: 'Gemini 1.5 Pro', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: true } as ModelCapabilities, contextWindow: 2097152, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.00125, outputPer1kTokens: 0.005, currency: 'USD' } },
      { id: 'gemini-1.5-flash', provider: 'gemini', name: 'Gemini 1.5 Flash', capabilities: { streaming: true, functionCalling: true, vision: true, embedding: false, fineTuning: false, jsonMode: true } as ModelCapabilities, contextWindow: 1048576, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.000075, outputPer1kTokens: 0.0003, currency: 'USD' } },
    ];
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const body = this.buildBody(request);
    const response = await this.apiPost<GeminiResponse>(`/models/${request.model}:generateContent`, body);

    const candidate = response.candidates?.[0];
    if (!candidate) throw new ProviderError({ code: 'EMPTY_RESPONSE', message: 'No candidates returned', provider: 'gemini' });

    const content = candidate.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    const toolCalls = this.parseToolCalls(candidate.content?.parts);
    const usage = response.usageMetadata ?? { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };

    return {
      id: '',
      model: request.model,
      provider: 'gemini',
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: { promptTokens: usage.promptTokenCount, completionTokens: usage.candidatesTokenCount, totalTokens: usage.totalTokenCount },
      finishReason: this.mapFinishReason(candidate.finishReason),
      latency: Date.now() - start,
    };
  }

  async chatStream(request: ChatCompletionRequest, onEvent: (chunk: ChatCompletionChunk) => void | Promise<void>): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const body = this.buildBody(request);
    const response = await fetch(`${this.baseUrl}/models/${request.model}:streamGenerateContent?key=${this.config.apiKey ?? ''}&alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw this.handleError(response, await response.text().catch(() => ''));

    const reader = response.body?.getReader();
    if (!reader) throw new ProviderError({ code: 'NO_STREAM', message: 'Response body not readable', provider: 'gemini' });

    const decoder = new TextDecoder();
    let content = '';
    let usageMetadata: GeminiUsageMetadata | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const parsed: GeminiResponse = JSON.parse(data);
          const candidate = parsed.candidates?.[0];
          if (candidate?.content?.parts) {
            const delta = candidate.content.parts.map(p => p.text ?? '').join('');
            if (delta) {
              content += delta;
              await onEvent({
                id: '',
                model: request.model,
                provider: 'gemini',
                content: delta,
                finishReason: candidate.finishReason ? this.mapFinishReason(candidate.finishReason) : undefined,
              });
            }
          }
          if (parsed.usageMetadata) usageMetadata = parsed.usageMetadata;
        } catch {}
      }
    }

    const usage = usageMetadata ?? { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };

    return {
      id: '',
      model: request.model,
      provider: 'gemini',
      content,
      usage: { promptTokens: usage.promptTokenCount, completionTokens: usage.candidatesTokenCount, totalTokens: usage.totalTokenCount },
      finishReason: 'stop',
      latency: Date.now() - start,
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

  private buildBody(request: ChatCompletionRequest): Record<string, unknown> {
    const systemMsg = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system');

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = { contents };
    const generationConfig: Record<string, unknown> = {};

    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    if (request.temperature !== undefined) generationConfig.temperature = request.temperature;
    if (request.topP !== undefined) generationConfig.topP = request.topP;
    if (request.maxTokens !== undefined) generationConfig.maxOutputTokens = request.maxTokens;
    if (request.stop) generationConfig.stopSequences = request.stop;
    if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

    if (request.tools) {
      body.tools = request.tools.map(t => ({
        functionDeclarations: [{
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        }],
      }));
    }

    if (request.toolChoice) {
      const functionCallingConfig: Record<string, unknown> = {};
      if (request.toolChoice === 'none') {
        functionCallingConfig.mode = 'NONE';
      } else if (request.toolChoice === 'auto') {
        functionCallingConfig.mode = 'AUTO';
      } else if (typeof request.toolChoice === 'object') {
        functionCallingConfig.mode = 'ANY';
        functionCallingConfig.allowedFunctionNames = [request.toolChoice.function.name];
      }
      body.toolConfig = { functionCallingConfig };
    }

    return body;
  }

  private async apiPost<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout ?? 60000);
    try {
      const response = await fetch(`${this.baseUrl}${path}?key=${this.config.apiKey ?? ''}`, {
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
        throw new TimeoutError({ message: `Gemini request timed out after ${this.config.timeout ?? 60000}ms`, provider: 'gemini' });
      }
      throw new ProviderError({ code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : String(error), provider: 'gemini', retryable: true });
    } finally {
      clearTimeout(timeout);
    }
  }

  private handleError(response: Response, body: string): ProviderError {
    if (response.status === 429) return new RateLimitError({ message: `Gemini rate limited: ${body}`, provider: 'gemini' });
    if (response.status === 401) return new ProviderError({ code: 'UNAUTHORIZED', message: 'Invalid Gemini API key', provider: 'gemini', statusCode: 401 });
    if (response.status === 500) return new ProviderError({ code: 'SERVER_ERROR', message: `Gemini server error: ${body}`, provider: 'gemini', statusCode: 500, retryable: true });
    return new ProviderError({ code: `HTTP_${response.status}`, message: body, provider: 'gemini', statusCode: response.status, retryable: response.status >= 500 });
  }

  private parseToolCalls(parts?: GeminiPart[]): Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> {
    if (!parts) return [];
    return parts
      .filter(p => p.functionCall)
      .map(p => ({
        id: p.functionCall!.name,
        type: 'function' as const,
        function: { name: p.functionCall!.name, arguments: JSON.stringify(p.functionCall!.args) },
      }));
  }

  private mapFinishReason(reason?: string): ChatCompletionResponse['finishReason'] {
    const map: Record<string, ChatCompletionResponse['finishReason']> = {
      STOP: 'stop',
      MAX_TOKENS: 'length',
      SAFETY: 'content_filter',
      RECITATION: 'content_filter',
      OTHER: 'unknown',
    };
    return reason ? (map[reason] ?? 'unknown') : 'stop';
  }
}
