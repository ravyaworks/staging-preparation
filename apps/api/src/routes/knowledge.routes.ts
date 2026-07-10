import { Router, type Request, type Response } from 'express';
import { KnowledgeEngine } from '@conversation-platform/knowledge-engine';

const router = Router();
const engine = new KnowledgeEngine();

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.get('/collections', (req: Request, res: Response) => {
  const collections = engine.listCollections(tenantId(req));
  res.json({ success: true, data: collections });
});

router.post('/collections', (req: Request, res: Response) => {
  const collection = engine.createCollection({ ...req.body, tenantId: tenantId(req) });
  res.status(201).json({ success: true, data: collection });
});

router.get('/collections/:id', (req: Request, res: Response) => {
  const collection = engine.getCollection(req.params.id as string);
  if (!collection) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }
  res.json({ success: true, data: collection });
});

router.patch('/collections/:id', (req: Request, res: Response) => {
  const updated = engine.updateCollection(req.params.id as string, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }
  res.json({ success: true, data: updated });
});

router.delete('/collections/:id', (req: Request, res: Response) => {
  const deleted = engine.deleteCollection(req.params.id as string);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }
  res.json({ success: true, data: { deleted: true } });
});

router.get('/documents', (req: Request, res: Response) => {
  const collectionId = req.query.collectionId as string | undefined;
  if (!collectionId) {
    return res.status(400).json({ success: false, error: 'collectionId required' });
  }
  const docs = engine.listDocuments(collectionId);
  res.json({ success: true, data: docs });
});

router.post('/documents', (req: Request, res: Response) => {
  const doc = engine.createDocument(req.body);
  res.status(201).json({ success: true, data: doc });
});

router.get('/documents/:id', (req: Request, res: Response) => {
  const doc = engine.getDocument(req.params.id as string);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, data: doc });
});

router.patch('/documents/:id', (req: Request, res: Response) => {
  const updated = engine.updateDocument(req.params.id as string, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, data: updated });
});

router.delete('/documents/:id', (req: Request, res: Response) => {
  const deleted = engine.deleteDocument(req.params.id as string);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, data: { deleted: true } });
});

router.post('/documents/:id/publish', (req: Request, res: Response) => {
  const doc = engine.publishDocument(req.params.id as string);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, data: doc });
});

router.post('/documents/:id/archive', (req: Request, res: Response) => {
  const doc = engine.archiveDocument(req.params.id as string);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, data: doc });
});

router.get('/search', (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  const collectionId = req.query.collectionId as string | undefined;
  const results = engine.search({ query, collectionId });
  res.json({ success: true, data: results });
});

router.get('/stats', (_req: Request, res: Response) => {
  const stats = engine.getStats();
  res.json({ success: true, data: stats });
});

router.post('/categories', (req: Request, res: Response) => {
  const cat = engine.createCategory(req.body);
  res.status(201).json({ success: true, data: cat });
});

router.get('/categories', (req: Request, res: Response) => {
  const collectionId = req.query.collectionId as string;
  const cats = engine.listCategories(collectionId);
  res.json({ success: true, data: cats });
});

router.post('/tags', (req: Request, res: Response) => {
  const tag = engine.createTag(req.body);
  res.status(201).json({ success: true, data: tag });
});

router.get('/tags', (req: Request, res: Response) => {
  const collectionId = req.query.collectionId as string;
  const tags = engine.listTags(collectionId);
  res.json({ success: true, data: tags });
});

router.get('/documents/:id/versions', (req: Request, res: Response) => {
  const versions = engine.getVersionHistory(req.params.id as string);
  res.json({ success: true, data: versions });
});

router.post('/import', (req: Request, res: Response) => {
  const docs = engine.importDocuments(req.body.documents || []);
  res.status(201).json({ success: true, data: docs });
});

router.get('/export', (req: Request, res: Response) => {
  const collectionId = req.query.collectionId as string | undefined;
  const docs = engine.exportDocuments(collectionId);
  res.json({ success: true, data: docs });
});

export { router as knowledgeRoutes };
