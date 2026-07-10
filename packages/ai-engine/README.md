# @conversation-platform/ai-engine

Provider-independent AI orchestration engine with retry, fallback, streaming, and cost tracking.

## Responsibilities
- `createAIEngine` — factory that wires retry, fallback, and cost tracking around a provider resolver
- Retry logic (`withRetry`, `createRetryStrategy`) with exponential backoff and configurable retryable error codes
- Fallback support — transparent failover to a secondary provider/model when the primary fails
- Streaming via `chatStream` — emits chunk/done/error events through a callback
- `UsageTracker` — accumulate per-request token/cost data and query by provider, model, or time window
- `estimateCost` and `estimateTokenCount` for pre-flight budget checks

## Dependencies
- `@conversation-platform/provider-framework` (provider interface, types, token calculator)
- `@conversation-platform/model-registry` (model pricing lookups)
- `@conversation-platform/logger`

## Public API
Exports `createAIEngine` (returns `{ chat, chatStream, getTracker }`), retry utilities (`withRetry`, `createRetryStrategy`, `isRetryable`), fallback utilities (`createFallbackStrategy`, `getNextFallback`), and `UsageTracker`.

## Future
Add concurrent request budgeting to enforce `budgetLimit` across parallel calls, and integrate circuit-breaker state per provider.
