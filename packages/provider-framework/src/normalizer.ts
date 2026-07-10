import type { ChatCompletionResponse, ChatCompletionChunk, TokenUsage, Message } from './types';

export function calculateTokenUsage(promptMessages: Message[], responseContent: string): TokenUsage {
  const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
  const promptTokens = promptMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  const completionTokens = estimateTokens(responseContent);
  return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
}

export function mergeChunks(previous: ChatCompletionChunk | null, chunk: ChatCompletionChunk): ChatCompletionChunk {
  if (!previous) return chunk;
  return {
    id: chunk.id,
    model: chunk.model,
    provider: chunk.provider,
    content: previous.content + chunk.content,
    toolCalls: chunk.toolCalls ?? previous.toolCalls,
    usage: chunk.usage ?? previous.usage,
    finishReason: chunk.finishReason ?? previous.finishReason,
  };
}

export function createResponseFromChunks(chunks: ChatCompletionChunk[]): ChatCompletionResponse {
  const content = chunks.map(c => c.content).join('');
  const last = chunks[chunks.length - 1];
  const usage = last?.usage ?? calculateTokenUsage([], content);
  return {
    id: last?.id ?? 'streamed',
    model: last?.model ?? 'unknown',
    provider: last?.provider ?? 'openai',
    content,
    usage: { promptTokens: usage.promptTokens ?? 0, completionTokens: usage.completionTokens ?? 0, totalTokens: usage.totalTokens ?? 0 },
    finishReason: (last?.finishReason as ChatCompletionResponse['finishReason']) ?? 'stop',
    latency: 0,
  };
}
