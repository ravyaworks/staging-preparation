import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'

export interface AIRequest {
  prompt: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AIResponse {
  text: string
  model: string
  usage?: { promptTokens: number; completionTokens: number }
}

export interface AIService {
  generate(request: AIRequest): Promise<AIResponse>
  stream?(request: AIRequest): AsyncIterable<string>
}

export function createAIService(config: AppConfig, logger: Logger): AIService {
  return {
    async generate(request: AIRequest): Promise<AIResponse> {
      logger.debug({ model: request.model ?? config.ai.defaultModel }, 'AI generate called')
      return {
        text: `[AI response placeholder for: ${request.prompt.slice(0, 50)}...]`,
        model: request.model ?? config.ai.defaultModel,
        usage: { promptTokens: 0, completionTokens: 0 },
      }
    },
  }
}
