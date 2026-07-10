import type { Logger } from '@conversation-platform/logger';
import type { AIProvider, ChatCompletionRequest, ChatCompletionResponse, ProviderName } from '@conversation-platform/provider-framework';
import { calculateTokenUsage } from '@conversation-platform/provider-framework';
import { createRetryStrategy, withRetry, isRetryable, getNextFallback, calculateDelay } from './retry';
import { UsageTracker, estimateCost } from './tracker';
import type { AIEngineConfig, AIEngineRequest, AIEngineResponse, AIEngineStreamEvent, RetryStrategy } from './types';
import { AIEngineError } from './types';

export function createAIEngine(params: {
  getProvider: (name: ProviderName) => AIProvider;
  config: AIEngineConfig;
  logger: Logger;
}) {
  const { getProvider, config, logger } = params;
  const usageTracker = new UsageTracker();
  const retryStrategy = createRetryStrategy({
    maxRetries: config.maxRetries,
    initialDelayMs: config.retryDelayMs,
  });

  function buildRequest(req: AIEngineRequest): ChatCompletionRequest {
    return {
      model: req.model ?? config.defaultModel,
      messages: req.messages,
      temperature: req.temperature,
      maxTokens: req.maxTokens ?? config.maxTokensPerRequest,
      stream: req.stream ?? false,
      metadata: req.metadata,
    };
  }

  async function chat(req: AIEngineRequest): Promise<AIEngineResponse> {
    const providerName = req.provider ?? config.defaultProvider;
    const model = req.model ?? config.defaultModel;
    const start = Date.now();

    try {
      const provider = getProvider(providerName);
      const chatRequest = buildRequest(req);

      const response = await withRetry(
        () => provider.chat(chatRequest),
        retryStrategy,
        (error, attempt) => {
          logger.warn({ provider: providerName, model, attempt, error }, 'AI provider retry');
        },
      );

      const cost = usageTracker.track(providerName, model, response.usage);
      const latency = Date.now() - start;

      return {
        content: response.content,
        model: response.model,
        provider: response.provider,
        usage: cost,
        latency,
        finishReason: response.finishReason,
        metadata: response.metadata,
      };
    } catch (error) {
      const latency = Date.now() - start;

      if (config.fallbackProvider && isRetryable(error)) {
        logger.warn({ provider: providerName, model, error }, 'Falling back to alternate provider');
        try {
          const fallbackProvider = getProvider(config.fallbackProvider);
          const fallbackRequest = { ...buildRequest(req), model: config.fallbackModel ?? config.defaultModel };
          const fallbackResponse = await fallbackProvider.chat(fallbackRequest);
          const cost = usageTracker.track(config.fallbackProvider, fallbackResponse.model, fallbackResponse.usage);
          return {
            content: fallbackResponse.content,
            model: fallbackResponse.model,
            provider: fallbackResponse.provider,
            usage: cost,
            latency: Date.now() - start,
            finishReason: fallbackResponse.finishReason,
            metadata: { ...fallbackResponse.metadata, fallback: true, originalProvider: providerName },
          };
        } catch (fallbackError) {
          throw new AIEngineError('ALL_PROVIDERS_FAILED', `Primary provider ${providerName} and fallback ${config.fallbackProvider} both failed`, providerName);
        }
      }

      throw new AIEngineError('PROVIDER_ERROR', `Provider ${providerName} failed: ${error instanceof Error ? error.message : String(error)}`, providerName);
    }
  }

  async function chatStream(req: AIEngineRequest, onEvent: (event: AIEngineStreamEvent) => void | Promise<void>): Promise<void> {
    const providerName = req.provider ?? config.defaultProvider;
    const model = req.model ?? config.defaultModel;
    const start = Date.now();

    try {
      const provider = getProvider(providerName);
      const chatRequest = buildRequest(req);

      let content = '';
      await provider.chatStream(chatRequest, (chunk) => {
        content += chunk.content;
        onEvent({ type: 'chunk', content: chunk.content, metadata: chunk.metadata });
      });

      const usage = calculateTokenUsage(chatRequest.messages, content);
      const cost = usageTracker.track(providerName, model, usage);
      onEvent({ type: 'done', usage: cost });
    } catch (error) {
      logger.error({ provider: providerName, model, error }, 'AI streaming error');
      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function getTracker(): UsageTracker {
    return usageTracker;
  }

  return {
    chat,
    chatStream,
    getTracker,
  };
}

export type AIEngine = ReturnType<typeof createAIEngine>;
