import { Router, type Request, type Response } from 'express';
import { WorkflowEngine } from '@conversation-platform/workflow-engine';

const router = Router();
const engine = new WorkflowEngine();

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.get('/', (req: Request, res: Response) => {
  const defs = engine.listDefinitions(tenantId(req));
  res.json({ success: true, data: defs });
});

router.post('/', (req: Request, res: Response) => {
  const def = engine.createDefinition({ ...req.body, tenantId: tenantId(req) });
  res.status(201).json({ success: true, data: def });
});

router.get('/:id', (req: Request, res: Response) => {
  const def = engine.getDefinition(req.params.id as string);
  if (!def) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, data: def });
});

router.patch('/:id', (req: Request, res: Response) => {
  const updated = engine.updateDefinition(req.params.id as string, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, data: updated });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = engine.deleteDefinition(req.params.id as string);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, data: { deleted: true } });
});

router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const execution = await engine.execute(req.params.id as string, req.body?.input);
    res.json({ success: true, data: execution });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.get('/:id/executions', (req: Request, res: Response) => {
  const executions = engine.listExecutions(req.params.id as string);
  res.json({ success: true, data: executions });
});

router.get('/:id/executions/:execId', (req: Request, res: Response) => {
  const exec = engine.getExecution(req.params.execId as string);
  if (!exec) {
    return res.status(404).json({ success: false, error: 'Execution not found' });
  }
  res.json({ success: true, data: exec });
});

router.post('/:id/triggers', (req: Request, res: Response) => {
  const trigger = engine.registerTrigger({ ...req.body, workflowId: req.params.id as string });
  res.status(201).json({ success: true, data: trigger });
});

router.get('/:id/triggers', (req: Request, res: Response) => {
  const triggers = engine.listTriggers(req.params.id as string);
  res.json({ success: true, data: triggers });
});

router.post('/:id/schedules', (req: Request, res: Response) => {
  const schedule = engine.schedule({ ...req.body, workflowId: req.params.id as string });
  res.status(201).json({ success: true, data: schedule });
});

router.get('/:id/schedules', (req: Request, res: Response) => {
  const schedules = engine.listSchedules(req.params.id as string);
  res.json({ success: true, data: schedules });
});

router.get('/:id/metrics', (req: Request, res: Response) => {
  const metrics = engine.getMetrics(req.params.id as string);
  res.json({ success: true, data: metrics });
});

router.post('/executions/:execId/recover', async (req: Request, res: Response) => {
  const execution = await engine.recover(req.params.execId as string);
  if (!execution) {
    return res.status(400).json({ success: false, error: 'Cannot recover execution' });
  }
  res.json({ success: true, data: execution });
});

export { router as workflowRoutes };
