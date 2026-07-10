# @conversation-platform/document-processor

Document ingestion and processing pipeline supporting multi-format parsing, text chunking, metadata extraction, language detection, and content validation.

## Responsibilities
- Parse raw content from PDF, DOCX, TXT, Markdown, CSV, JSON, and HTML formats
- Split documents into configurable overlapping chunks with token counting
- Extract metadata (word count, character count, language, format)
- Validate content structure per format (JSON validity, CSV structure)
- Detect language using Unicode-range heuristics
- Compute content checksums for deduplication

## Dependencies
- `@conversation-platform/types`, `@conversation-platform/logger`
- `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`DocumentProcessor` class with `process`, `validate`, `chunkDocument`, and `detectLanguage` methods. Exports `ProcessedDocument`, `DocumentChunk`, `ProcessingConfig`, and `ValidationResult` types.

## Extension Points
Add new format parsers by extending the `DocumentFormat` union type; customize chunking strategy by providing a custom `DocumentChunkingConfig`.

## Future
Add streaming document processing for large files, OCR support for scanned documents, and format-specific extractors (PDF tables, CSV schemas).
