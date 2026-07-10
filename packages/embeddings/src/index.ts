export interface EmbeddingVector {
  values: number[];
  dimensions: number;
}

export interface EmbeddingRecord {
  id: string;
  vector: EmbeddingVector;
  text: string;
  metadata?: Record<string, unknown>;
  model: string;
  provider: string;
  createdAt: Date;
}

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<EmbeddingVector>;
  generateEmbeddings(texts: string[]): Promise<EmbeddingVector[]>;
  getDimensions(): number;
  getModel(): string;
}

export interface EmbeddingStore {
  store(record: Omit<EmbeddingRecord, 'createdAt'>): Promise<void>;
  storeBatch(records: Array<Omit<EmbeddingRecord, 'createdAt'>>): Promise<void>;
  get(id: string): Promise<EmbeddingRecord | undefined>;
  delete(id: string): Promise<boolean>;
  search(vector: EmbeddingVector, options?: EmbeddingSearchOptions): Promise<EmbeddingSearchResult[]>;
  clear(): Promise<void>;
}

export interface EmbeddingSearchOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, unknown>;
}

export interface EmbeddingSearchResult {
  record: EmbeddingRecord;
  score: number;
}

export interface EmbeddingCache {
  get(key: string): Promise<EmbeddingVector | undefined>;
  set(key: string, vector: EmbeddingVector): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class InMemoryEmbeddingStore implements EmbeddingStore {
  private records: Map<string, EmbeddingRecord> = new Map();

  async store(record: Omit<EmbeddingRecord, 'createdAt'>): Promise<void> {
    this.records.set(record.id, { ...record, createdAt: new Date() });
  }

  async storeBatch(records: Array<Omit<EmbeddingRecord, 'createdAt'>>): Promise<void> {
    for (const r of records) {
      await this.store(r);
    }
  }

  async get(id: string): Promise<EmbeddingRecord | undefined> {
    return this.records.get(id);
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  async search(vector: EmbeddingVector, options?: EmbeddingSearchOptions): Promise<EmbeddingSearchResult[]> {
    const results: EmbeddingSearchResult[] = [];
    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0;

    for (const record of this.records.values()) {
      const score = this.cosineSimilarity(vector.values, record.vector.values);
      if (score >= minScore) {
        results.push({ record, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }
}

export class InMemoryEmbeddingCache implements EmbeddingCache {
  private cache: Map<string, EmbeddingVector> = new Map();

  async get(key: string): Promise<EmbeddingVector | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, vector: EmbeddingVector): Promise<void> {
    this.cache.set(key, vector);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export class EmbeddingService {
  constructor(
    private provider: EmbeddingProvider,
    private store: EmbeddingStore,
    private cache?: EmbeddingCache,
  ) {}

  async generateAndStore(text: string, metadata?: Record<string, unknown>): Promise<EmbeddingRecord> {
    const vector = await this.generate(text);
    const record: Omit<EmbeddingRecord, 'createdAt'> = {
      id: `emb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      vector,
      text,
      metadata,
      model: this.provider.getModel(),
      provider: 'embedding-service',
    };
    await this.store.store(record);
    return { ...record, createdAt: new Date() };
  }

  async generateAndStoreBatch(texts: string[], metadatas?: Record<string, unknown>[]): Promise<EmbeddingRecord[]> {
    const vectors = await this.provider.generateEmbeddings(texts);
    const records: Array<Omit<EmbeddingRecord, 'createdAt'>> = texts.map((text, i) => ({
      id: `emb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      vector: vectors[i]!,
      text,
      metadata: metadatas?.[i],
      model: this.provider.getModel(),
      provider: 'embedding-service',
    }));
    await this.store.storeBatch(records);
    return records.map(r => ({ ...r, createdAt: new Date() }));
  }

  async search(query: string, options?: EmbeddingSearchOptions): Promise<EmbeddingSearchResult[]> {
    const vector = await this.generate(query);
    return this.store.search(vector, options);
  }

  private async generate(text: string): Promise<EmbeddingVector> {
    if (this.cache) {
      const cached = await this.cache.get(text);
      if (cached) return cached;
    }
    const vector = await this.provider.generateEmbedding(text);
    if (this.cache) {
      await this.cache.set(text, vector);
    }
    return vector;
  }
}
