export interface VectorRecord {
  id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  vector?: number[];
  text?: string;
  filter?: SearchFilter;
  topK: number;
  minScore?: number;
}

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'exists';
  value: unknown;
}

export interface SearchResult {
  record: VectorRecord;
  score: number;
  rank: number;
}

export interface Retriever {
  search(query: SearchQuery): Promise<SearchResult[]>;
  index(record: VectorRecord): Promise<void>;
  indexBatch(records: VectorRecord[]): Promise<void>;
  remove(id: string): Promise<boolean>;
  clear(): Promise<void>;
}

export type ScoringStrategy = 'cosine' | 'dotProduct' | 'euclidean';

export interface SearchConfig {
  scoring: ScoringStrategy;
  defaultTopK: number;
  minScore: number;
  enableHybrid: boolean;
}

export class SemanticRetriever implements Retriever {
  private records: Map<string, VectorRecord> = new Map();
  private config: SearchConfig = {
    scoring: 'cosine',
    defaultTopK: 10,
    minScore: 0,
    enableHybrid: false,
  };

  constructor(config?: Partial<SearchConfig>) {
    if (config) Object.assign(this.config, config);
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.vector) return [];

    let results: SearchResult[] = [];

    for (const record of this.records.values()) {
      if (query.filter && !this.matchesFilter(record, query.filter)) continue;

      const score = this.computeScore(query.vector, record.vector);
      if (score >= (query.minScore ?? this.config.minScore)) {
        results.push({ record, score, rank: 0 });
      }
    }

    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, query.topK);
    results.forEach((r, i) => { r.rank = i + 1; });

    return results;
  }

  async index(record: VectorRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async indexBatch(records: VectorRecord[]): Promise<void> {
    for (const r of records) {
      await this.index(r);
    }
  }

  async remove(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }

  private computeScore(a: number[], b: number[]): number {
    switch (this.config.scoring) {
      case 'cosine': return this.cosineSimilarity(a, b);
      case 'dotProduct': return this.dotProduct(a, b);
      case 'euclidean': return 1 / (1 + this.euclideanDistance(a, b));
      default: return this.cosineSimilarity(a, b);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * b[i]!;
      na += a[i]! * a[i]!;
      nb += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
  }

  private dotProduct(a: number[], b: number[]): number {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
    return dot;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i]! - b[i]!) ** 2;
    return Math.sqrt(sum);
  }

  private matchesFilter(record: VectorRecord, filter: SearchFilter): boolean {
    const value = record.metadata?.[filter.field];
    switch (filter.operator) {
      case 'eq': return value === filter.value;
      case 'neq': return value !== filter.value;
      case 'gt': return typeof value === 'number' && typeof filter.value === 'number' && value > filter.value;
      case 'gte': return typeof value === 'number' && typeof filter.value === 'number' && value >= filter.value;
      case 'lt': return typeof value === 'number' && typeof filter.value === 'number' && value < filter.value;
      case 'lte': return typeof value === 'number' && typeof filter.value === 'number' && value <= filter.value;
      case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
      case 'nin': return Array.isArray(filter.value) && !filter.value.includes(value);
      case 'contains': return typeof value === 'string' && typeof filter.value === 'string' && value.includes(filter.value);
      case 'exists': return value !== undefined;
      default: return true;
    }
  }
}

export class MetadataSearchEngine {
  private records: Map<string, Record<string, unknown>> = new Map();

  index(id: string, metadata: Record<string, unknown>): void {
    this.records.set(id, metadata);
  }

  search(filters: SearchFilter[]): string[] {
    return Array.from(this.records.entries())
      .filter(([_, metadata]) =>
        filters.every(f => this.matchField(metadata, f.field, f.operator, f.value))
      )
      .map(([id]) => id);
  }

  private matchField(metadata: Record<string, unknown>, field: string, operator: SearchFilter['operator'], value: unknown): boolean {
    const fieldValue = metadata[field];
    switch (operator) {
      case 'eq': return fieldValue === value;
      case 'neq': return fieldValue !== value;
      case 'gt': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
      case 'gte': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;
      case 'lt': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
      case 'lte': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;
      case 'in': return Array.isArray(value) && value.includes(fieldValue);
      case 'nin': return Array.isArray(value) && !value.includes(fieldValue);
      case 'contains': return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);
      case 'exists': return fieldValue !== undefined;
      default: return false;
    }
  }
}

export class HybridSearchEngine {
  constructor(
    private semanticRetriever: Retriever,
    private metadataEngine: MetadataSearchEngine,
    private semanticWeight: number = 0.7,
  ) {}

  async search(query: SearchQuery, filters?: SearchFilter[]): Promise<SearchResult[]> {
    const semanticResults = await this.semanticRetriever.search(query);
    if (!filters || filters.length === 0) return semanticResults;

    const metadataIds = this.metadataEngine.search(filters);
    const metadataSet = new Set(metadataIds);

    return semanticResults.filter(r => metadataSet.has(r.record.id));
  }
}
