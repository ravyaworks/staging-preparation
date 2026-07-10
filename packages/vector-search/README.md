# @conversation-platform/vector-search

Pluggable vector search and retrieval engine supporting cosine, dot-product, and Euclidean scoring with metadata filtering and hybrid search fusion.

## Responsibilities
- Index vector records and search by similarity using configurable scoring strategy
- Filter results by metadata fields with 10 operators (eq, neq, gt, gte, lt, lte, in, nin, contains, exists)
- Perform metadata-only searches independent of vector similarity
- Combine semantic and metadata search via `HybridSearchEngine` with weighted fusion
- Assign ranked positions to results with score-based ordering

## Dependencies
- `@conversation-platform/types`, `@conversation-platform/logger`
- `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`SemanticRetriever` (vector similarity search), `MetadataSearchEngine` (filter-based search), `HybridSearchEngine` (combined search), plus `SearchQuery`, `SearchFilter`, `SearchResult`, and `Retriever` interface.

## Extension Points
Implement `Retriever` with external vector databases (Pinecone, Qdrant, Weaviate); add new `ScoringStrategy` variants; extend `SearchFilter` operators.

## Future
Add multi-vector search, re-ranking stage, and approximate nearest neighbor (ANN) index support for large-scale deployments.
