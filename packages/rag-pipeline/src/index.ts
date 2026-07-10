import type { SearchResult } from '@conversation-platform/vector-search';

export interface RagContext {
  query: string;
  results: SearchResult[];
  context: string;
  citations: Citation[];
  confidence: number;
}

export interface Citation {
  documentId: string;
  text: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface RagPipelineConfig {
  maxResults: number;
  minConfidence: number;
  maxContextLength: number;
  includeCitations: boolean;
  validateContext: boolean;
}

export class ContextBuilder {
  private config: RagPipelineConfig;

  constructor(config?: Partial<RagPipelineConfig>) {
    this.config = {
      maxResults: 5,
      minConfidence: 0.5,
      maxContextLength: 4000,
      includeCitations: true,
      validateContext: true,
      ...config,
    };
  }

  build(query: string, results: SearchResult[]): RagContext {
    const filtered = results.filter(r => r.score >= this.config.minConfidence).slice(0, this.config.maxResults);
    const citations: Citation[] = filtered.map(r => ({
      documentId: r.record.id,
      text: (r.record.metadata?.text as string) ?? '',
      relevanceScore: r.score,
      metadata: r.record.metadata,
    }));

    const contextParts: string[] = [];
    let totalLength = 0;

    for (const citation of citations) {
      const part = `[Source: ${citation.documentId} (relevance: ${citation.relevanceScore.toFixed(2)})]\n${citation.text}`;
      if (totalLength + part.length > this.config.maxContextLength) break;
      contextParts.push(part);
      totalLength += part.length;
    }

    const context = contextParts.join('\n\n');
    const confidence = filtered.length > 0
      ? filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length
      : 0;

    return { query, results: filtered, context, citations, confidence };
  }
}

export class PromptInjector {
  private readonly suspiciousPatterns = [
    /ignore\s+(all\s+)?previous/i,
    /forget\s+(all\s+)?(previous|instructions)/i,
    /you\s+are\s+(now|not\s+an?\s+ai)/i,
    /system\s+(prompt|instruction|message)/i,
    /<\|im_start\|>/,
    /<\|im_end\|>/,
    /\{\{.*\}\}/,
  ];

  sanitize(text: string): string {
    let cleaned = text;
    for (const pattern of this.suspiciousPatterns) {
      cleaned = cleaned.replace(pattern, '[REDACTED]');
    }
    return cleaned;
  }

  detectInjection(text: string): boolean {
    return this.suspiciousPatterns.some(p => p.test(text));
  }
}

export class RagPipeline {
  private contextBuilder: ContextBuilder;
  private injector: PromptInjector;

  constructor(config?: Partial<RagPipelineConfig>) {
    this.contextBuilder = new ContextBuilder(config);
    this.injector = new PromptInjector();
  }

  async execute(query: string, results: SearchResult[]): Promise<RagContext> {
    const sanitizedQuery = this.injector.sanitize(query);

    if (this.injector.detectInjection(query)) {
      return {
        query: sanitizedQuery,
        results: [],
        context: '',
        citations: [],
        confidence: 0,
      };
    }

    const ragContext = this.contextBuilder.build(sanitizedQuery, results);

    if (ragContext.context.length > 0) {
      const sanitizedContext = this.injector.sanitize(ragContext.context);
      ragContext.context = sanitizedContext;
    }

    return ragContext;
  }
}

export function selectTopChunks(results: SearchResult[], maxTokens: number, overlap: number = 200): SearchResult[] {
  let totalTokens = 0;
  const selected: SearchResult[] = [];

  for (const result of results) {
    const text = (result.record.metadata?.text as string) ?? '';
    const tokens = Math.ceil(text.length / 4);
    if (totalTokens + tokens > maxTokens) {
      const remainingChars = (maxTokens - totalTokens) * 4;
      if (remainingChars > overlap) {
        selected.push(result);
      }
      break;
    }
    selected.push(result);
    totalTokens += tokens;
  }

  return selected;
}

export function computeConfidenceScore(results: SearchResult[]): number {
  if (results.length === 0) return 0;
  const weights = results.map((r, i) => r.score * (1 / (i + 1)));
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  const totalWeight = results.reduce((sum, _, i) => sum + 1 / (i + 1), 0);
  return totalWeight > 0 ? sumWeights / totalWeight : 0;
}
