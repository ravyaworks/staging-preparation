export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSource {
  id: string;
  collectionId: string;
  name: string;
  type: 'upload' | 'web' | 'api' | 'connector';
  config?: Record<string, unknown>;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeStatus = 'draft' | 'published' | 'archived' | 'review';

export interface KnowledgeDocument {
  id: string;
  collectionId: string;
  sourceId?: string;
  title: string;
  content: string;
  status: KnowledgeStatus;
  category?: string;
  tags?: string[];
  version: number;
  metadata?: Record<string, unknown>;
  checksum?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeCategory {
  id: string;
  collectionId: string;
  name: string;
  parentId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeTag {
  id: string;
  collectionId: string;
  name: string;
  createdAt: Date;
}

export interface KnowledgeVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  checksum: string;
  createdBy?: string;
  createdAt: Date;
}

export interface KnowledgeSearchQuery {
  query: string;
  collectionId?: string;
  category?: string;
  tags?: string[];
  status?: KnowledgeStatus;
  limit?: number;
  offset?: number;
}

export interface KnowledgeSearchResult {
  document: KnowledgeDocument;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface KnowledgeStats {
  totalDocuments: number;
  totalCollections: number;
  totalCategories: number;
  totalTags: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
}

export class KnowledgeEngine {
  private collections: Map<string, KnowledgeCollection> = new Map();
  private documents: Map<string, KnowledgeDocument> = new Map();
  private categories: Map<string, KnowledgeCategory> = new Map();
  private tags: Map<string, KnowledgeTag> = new Map();
  private versions: Map<string, KnowledgeVersion[]> = new Map();

  // Collections
  createCollection(input: Omit<KnowledgeCollection, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeCollection {
    const collection: KnowledgeCollection = {
      ...input,
      id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.collections.set(collection.id, collection);
    return collection;
  }

  getCollection(id: string): KnowledgeCollection | undefined {
    return this.collections.get(id);
  }

  listCollections(tenantId: string): KnowledgeCollection[] {
    return Array.from(this.collections.values()).filter(c => c.tenantId === tenantId);
  }

  updateCollection(id: string, input: Partial<Omit<KnowledgeCollection, 'id' | 'tenantId' | 'createdAt'>>): KnowledgeCollection | undefined {
    const existing = this.collections.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...input, updatedAt: new Date() };
    this.collections.set(id, updated);
    return updated;
  }

  deleteCollection(id: string): boolean {
    return this.collections.delete(id);
  }

  // Documents
  createDocument(input: Omit<KnowledgeDocument, 'id' | 'version' | 'checksum' | 'createdAt' | 'updatedAt'>): KnowledgeDocument {
    const doc: KnowledgeDocument = {
      ...input,
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      version: 1,
      checksum: this.computeChecksum(input.content),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(doc.id, doc);
    this.saveVersion(doc);
    return doc;
  }

  getDocument(id: string): KnowledgeDocument | undefined {
    return this.documents.get(id);
  }

  listDocuments(collectionId: string): KnowledgeDocument[] {
    return Array.from(this.documents.values()).filter(d => d.collectionId === collectionId);
  }

  updateDocument(id: string, input: Partial<Omit<KnowledgeDocument, 'id' | 'collectionId' | 'createdAt'>>): KnowledgeDocument | undefined {
    const existing = this.documents.get(id);
    if (!existing) return undefined;
    const updated: KnowledgeDocument = {
      ...existing,
      ...input,
      version: existing.version + 1,
      checksum: input.content ? this.computeChecksum(input.content) : existing.checksum,
      updatedAt: new Date(),
    };
    this.documents.set(id, updated);
    this.saveVersion(updated);
    return updated;
  }

  deleteDocument(id: string): boolean {
    this.versions.delete(id);
    return this.documents.delete(id);
  }

  publishDocument(id: string): KnowledgeDocument | undefined {
    return this.updateDocument(id, { status: 'published' });
  }

  archiveDocument(id: string): KnowledgeDocument | undefined {
    return this.updateDocument(id, { status: 'archived' });
  }

  search(query: KnowledgeSearchQuery): KnowledgeSearchResult[] {
    let results = Array.from(this.documents.values());

    if (query.collectionId) {
      results = results.filter(d => d.collectionId === query.collectionId);
    }
    if (query.category) {
      results = results.filter(d => d.category === query.category);
    }
    if (query.tags && query.tags.length > 0) {
      results = results.filter(d => d.tags?.some(t => query.tags!.includes(t)));
    }
    if (query.status) {
      results = results.filter(d => d.status === query.status);
    }
    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(d =>
        d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
      );
    }

    const scored: KnowledgeSearchResult[] = results.map(doc => ({
      document: doc,
      score: this.computeRelevanceScore(doc, query.query),
    }));

    scored.sort((a, b) => b.score - a.score);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    return scored.slice(offset, offset + limit);
  }

  // Categories
  createCategory(input: Omit<KnowledgeCategory, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeCategory {
    const cat: KnowledgeCategory = {
      ...input,
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(cat.id, cat);
    return cat;
  }

  getCategory(id: string): KnowledgeCategory | undefined {
    return this.categories.get(id);
  }

  listCategories(collectionId: string): KnowledgeCategory[] {
    return Array.from(this.categories.values()).filter(c => c.collectionId === collectionId);
  }

  // Tags
  createTag(input: Omit<KnowledgeTag, 'id' | 'createdAt'>): KnowledgeTag {
    const tag: KnowledgeTag = {
      ...input,
      id: `tag_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  listTags(collectionId: string): KnowledgeTag[] {
    return Array.from(this.tags.values()).filter(t => t.collectionId === collectionId);
  }

  // Versions
  getVersionHistory(documentId: string): KnowledgeVersion[] {
    return this.versions.get(documentId) ?? [];
  }

  getDocumentVersion(documentId: string, version: number): KnowledgeVersion | undefined {
    return this.versions.get(documentId)?.find(v => v.version === version);
  }

  // Stats
  getStats(collectionId?: string): KnowledgeStats {
    const docs = collectionId
      ? Array.from(this.documents.values()).filter(d => d.collectionId === collectionId)
      : Array.from(this.documents.values());
    return {
      totalDocuments: docs.length,
      totalCollections: this.collections.size,
      totalCategories: this.categories.size,
      totalTags: this.tags.size,
      publishedCount: docs.filter(d => d.status === 'published').length,
      draftCount: docs.filter(d => d.status === 'draft').length,
      archivedCount: docs.filter(d => d.status === 'archived').length,
    };
  }

  // Import/Export
  importDocuments(docs: Array<Omit<KnowledgeDocument, 'id' | 'version' | 'checksum' | 'createdAt' | 'updatedAt'>>): KnowledgeDocument[] {
    return docs.map(d => this.createDocument(d));
  }

  exportDocuments(collectionId?: string): KnowledgeDocument[] {
    return collectionId ? this.listDocuments(collectionId) : Array.from(this.documents.values());
  }

  private computeChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(16);
  }

  private saveVersion(doc: KnowledgeDocument): void {
    const existing = this.versions.get(doc.id) ?? [];
    existing.push({
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      documentId: doc.id,
      version: doc.version,
      content: doc.content,
      checksum: doc.checksum ?? '',
      createdAt: doc.updatedAt,
    });
    this.versions.set(doc.id, existing);
  }

  private computeRelevanceScore(doc: KnowledgeDocument, query: string): number {
    if (!query) return 1;
    const q = query.toLowerCase();
    let score = 0;
    const title = doc.title.toLowerCase();
    const content = doc.content.toLowerCase();
    if (title === q) score += 100;
    else if (title.includes(q)) score += 50;
    if (content.includes(q)) {
      score += 20;
      const firstIndex = content.indexOf(q);
      score += Math.max(0, 10 - Math.floor(firstIndex / 100));
    }
    if (doc.tags?.some(t => q.includes(t.toLowerCase()))) score += 15;
    if (doc.status === 'published') score += 5;
    return score;
  }
}
