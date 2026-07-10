# @conversation-platform/rag-pipeline

Retrieval-Augmented Generation pipeline that builds grounded context from search results, injects citations, sanitizes prompts, and computes confidence scores.

## Responsibilities
- Build structured `RagContext` from `SearchResult` arrays with relevance filtering and token-limit truncation
- Generate formatted citations linking each context chunk to its source document
- Sanitize user queries and retrieved context against prompt injection patterns
- Detect prompt injection attempts and abort pipeline execution
- Rank and select top chunks by token budget with configurable overlap
- Compute aggregate confidence scores using position-weighted averaging

## Dependencies
- `@conversation-platform/vector-search`, `@conversation-platform/embeddings`
- `@conversation-platform/knowledge-engine`, `@conversation-platform/types`
- `@conversation-platform/logger`, `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`RagPipeline` class (orchestrates sanitization, context building), `ContextBuilder` (assembles context with citations), `PromptInjector` (sanitizes/detects injection), plus `selectTopChunks` and `computeConfidenceScore` utilities.

## Extension Points
Replace the injection detection patterns via `PromptInjector` extension; customize context assembly strategy and token budgeting logic.

## Future
Add multi-turn context accumulation, query rewriting/expansion, and answer-grounded fact-checking against source documents.
