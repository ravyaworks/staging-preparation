# @conversation-platform/knowledge-engine

In-memory knowledge base engine managing collections, documents, categories, tags, version history, and full-text search with relevance scoring.

## Responsibilities
- CRUD for knowledge collections, documents, categories, and tags
- Document versioning with full revision history and checksum verification
- Keyword search across titles and content with configurable pagination
- Document lifecycle management (draft → published → archived)
- Bulk import/export of documents and per-collection statistics
- Status-based filtering and tag/category classification

## Dependencies
- `@conversation-platform/types`, `@conversation-platform/logger`
- `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`KnowledgeEngine` class with `createCollection`, `createDocument`, `search`, `getVersionHistory`, `getStats`, `importDocuments`, `exportDocuments`, and related CRUD methods.

## Extension Points
Substitute the in-memory storage with a persistent backend by replacing the internal `Map`-based stores; add custom relevance scoring by overriding `computeRelevanceScore`.

## Future
Add vector-based semantic search integration and a pluggable storage adapter for database persistence.
