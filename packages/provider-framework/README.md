# @conversation-platform/provider-framework

Abstract interfaces and shared types for pluggable AI provider integrations.

## Responsibilities
- Define the `AIProvider` contract (chat, chatStream, getModels, healthCheck, initialize)
- Provide canonical types: `ChatCompletionRequest`, `ChatCompletionResponse`, `ChatCompletionChunk`, `TokenUsage`, `Message`, `ToolCall`, `ToolDefinition`
- Provider-agnostic error hierarchy: `ProviderError`, `RateLimitError`, `TimeoutError`
- `ProviderRegistry` — register, resolve, and enumerate named provider instances
- Stream utilities: `mergeChunks`, `createResponseFromChunks`, and a `StreamEvent` discriminated union
- Token calculation via `calculateTokenUsage`

## Dependencies
- None (zero internal dependencies)

## Public API
Exports the `AIProvider` interface, `ProviderRegistry` class, shared types (`Message`, `ChatCompletionRequest`, `ChatCompletionResponse`, etc.), and normalizer functions (`calculateTokenUsage`, `mergeChunks`, `createResponseFromChunks`).

## Future
Add streaming-aware `AbortSignal` support and a built-in health-check scheduler that periodically pings all registered providers.
