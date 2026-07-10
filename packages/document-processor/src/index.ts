export type DocumentFormat = 'pdf' | 'docx' | 'txt' | 'markdown' | 'csv' | 'json' | 'html';

export interface ProcessedDocument {
  id: string;
  title: string;
  content: string;
  format: DocumentFormat;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  language?: string;
  checksum: string;
  processedAt: Date;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  pageCount?: number;
  wordCount?: number;
  charCount?: number;
  language?: string;
  format: DocumentFormat;
  source?: string;
  customFields?: Record<string, unknown>;
}

export interface DocumentChunk {
  id: string;
  index: number;
  content: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
}

export interface ProcessingConfig {
  chunking: DocumentChunkingConfig;
  extractMetadata: boolean;
  detectLanguage: boolean;
  deduplicate: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class DocumentProcessor {
  private readonly defaultConfig: ProcessingConfig = {
    chunking: { chunkSize: 1000, chunkOverlap: 200, minChunkSize: 50 },
    extractMetadata: true,
    detectLanguage: true,
    deduplicate: true,
  };

  constructor(private config?: Partial<ProcessingConfig>) {}

  process(content: string, format: DocumentFormat, title?: string): ProcessedDocument {
    const cfg = { ...this.defaultConfig, ...this.config };
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const checksum = this.computeChecksum(content);
    const metadata: DocumentMetadata = {
      title: title ?? 'Untitled',
      format,
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
      language: cfg.detectLanguage ? this.detectLanguage(content) : undefined,
    };
    const chunks = this.chunkDocument(content, cfg.chunking);

    return {
      id,
      title: metadata.title ?? 'Untitled',
      content,
      format,
      metadata,
      chunks,
      language: metadata.language,
      checksum,
      processedAt: new Date(),
    };
  }

  validate(content: string, format: DocumentFormat): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!content || content.length === 0) {
      errors.push({ field: 'content', message: 'Document content is empty', code: 'EMPTY_CONTENT' });
    }

    if (format === 'json') {
      try { JSON.parse(content); }
      catch { errors.push({ field: 'content', message: 'Invalid JSON format', code: 'INVALID_JSON' }); }
    }

    if (format === 'csv' && content.length > 0) {
      const lines = content.split('\n');
      if (lines.length < 2) warnings.push('CSV has no data rows (header only)');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  chunkDocument(content: string, config?: Partial<DocumentChunkingConfig>): DocumentChunk[] {
    const cfg = { ...this.defaultConfig.chunking, ...config };
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);
    let currentIndex = 0;

    while (currentIndex < words.length) {
      const chunkWords = words.slice(currentIndex, currentIndex + cfg.chunkSize);
      const chunkContent = chunkWords.join(' ');
      if (chunkContent.trim().length >= cfg.minChunkSize) {
        chunks.push({
          id: `chunk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          index: chunks.length,
          content: chunkContent,
          tokenCount: Math.ceil(chunkContent.length / 4),
        });
      }
      currentIndex += cfg.chunkSize - cfg.chunkOverlap;
    }

    return chunks;
  }

  detectLanguage(content: string): string {
    const patterns: Record<string, RegExp> = {
      en: /^[a-zA-Z0-9\s.,!?'"()-]+$/,
      ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/,
      zh: /[\u4E00-\u9FFF]/,
      ar: /[\u0600-\u06FF]/,
      ru: /[\u0400-\u04FF]/,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(content.slice(0, 200))) return lang;
    }
    return 'en';
  }

  computeChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(16);
  }
}
