# @conversation-platform/model-registry

Registry and capability catalog for AI models across all supported providers.

## Responsibilities
- Maintain a built-in catalog (`BUILT_IN_MODELS`) of 20+ models from OpenAI, Anthropic, Gemini, Mistral, DeepSeek, Ollama, and OpenRouter
- `ModelRegistry` — register custom models, query by provider, filter by capability (`hasCapability`), lookup by ID
- `HealthTracker` — record and query per-provider health status (latency, error, last-checked timestamp)
- Utility helpers: `getModelsByProvider`, `findModel`, `findModelByProvider`

## Dependencies
- `@conversation-platform/provider-framework` (for `ModelInfo`, `ProviderName`, `ModelCapabilities` types)

## Public API
Exports `ModelRegistry`, `HealthTracker`, `BUILT_IN_MODELS`, and query helpers (`getModelsByProvider`, `findModel`, `listBuiltInModels`).

## Future
Add a `ModelRouter` that selects the cheapest capable model for a given request, and support for dynamic model discovery via provider API calls.
