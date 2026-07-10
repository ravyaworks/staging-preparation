import { Router, type Request, type Response } from 'express';
import { ToolRegistry, ToolExecutor } from '@conversation-platform/tool-engine';
import { getAllDefaultToolDefs, createDefaultToolHandlerStub } from '@conversation-platform/tools';

const router: import('express').Router = Router();
const registry = new ToolRegistry();
const executor = new ToolExecutor(registry);

const defaultDefs = getAllDefaultToolDefs();
for (const def of defaultDefs) {
  registry.register(def, createDefaultToolHandlerStub());
}

router.get('/', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const tools = registry.list(category);
  res.json({ success: true, data: tools });
});

router.get('/:id', (req: Request, res: Response) => {
  const tool = registry.get(req.params.id as string);
  if (!tool) {
    return res.status(404).json({ success: false, error: 'Tool not found' });
  }
  res.json({ success: true, data: tool });
});

router.post('/execute', async (req: Request, res: Response) => {
  const result = await executor.execute({
    toolId: req.body.toolId,
    parameters: req.body.parameters || {},
    tenantId: (req as any).tenantId,
    userId: (req as any).userId,
  });
  res.json({ success: true, data: result });
});

export { router as toolRoutes };
