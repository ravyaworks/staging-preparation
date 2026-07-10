# @conversation-platform/embeddings

Provider-independent embedding generation and storage layer with in-memory vector store, cosine similarity search, cache, and batch processing.

## Responsibilities
- Generate embeddings via pluggable provider with abstract `EmbeddingProvider` interface
- Store, batch-store, and retrieve `EmbeddingRecord` objects with metadata
- Cosine-similarity search with `topK` and `minScore` filtering
- Cache embeddings in memory to avoid redundant provider calls
- Decouple embedding generation from storage through `EmbeddingService` orchestration

## Dependencies
- `@conversation-platform/types`, `@conversation-platform/logger`
- `@conversation-platform/config`, `@conversation-platform/provider-framework`

## Public API
`EmbeddingService` class (orchestrates provider + store + cache), `InMemoryEmbeddingStore` (searchable vector store), `InMemoryEmbeddingCache`, and interfaces `EmbeddingProvider`, `EmbeddingStore`, `EmbeddingCache`.

## Extension Points
Implement `EmbeddingProvider` with any AI provider (OpenAI, Cohere, etc.); swap `InMemoryEmbeddingStore` with a persistent vector DB (Pinecone, pgvector) by implementing `EmbeddingStore`.

## Future
Add support for sparse embeddings (BM25 hybrid), embedding dimension validation, and automatic embedding refresh for stale records.
