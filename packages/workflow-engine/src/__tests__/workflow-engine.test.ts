import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../index';

describe('WorkflowEngine', () => {
  it('createDefinition and getDefinition', () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({ name: 'Test WF', tenantId: 't1', steps: [], status: 'draft' });
    expect(def.id).toBeTruthy();
    expect(engine.getDefinition(def.id)?.name).toBe('Test WF');
  });

  it('updateDefinition increments version', () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({ name: 'V1', tenantId: 't1', steps: [], status: 'draft' });
    const updated = engine.updateDefinition(def.id, { name: 'V2' });
    expect(updated?.version).toBe(2);
  });

  it('listDefinitions filters by tenant', () => {
    const engine = new WorkflowEngine();
    engine.createDefinition({ name: 'A', tenantId: 't1', steps: [], status: 'active' });
    engine.createDefinition({ name: 'B', tenantId: 't2', steps: [], status: 'active' });
    expect(engine.listDefinitions('t1')).toHaveLength(1);
  });

  it('rejects execution for non-existent workflow', async () => {
    const engine = new WorkflowEngine();
    await expect(engine.execute('nonexistent')).rejects.toThrow('not found');
  });

  it('rejects execution for draft workflow', async () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({ name: 'Draft', tenantId: 't1', steps: [], status: 'draft' });
    await expect(engine.execute(def.id)).rejects.toThrow('not active');
  });

  it('executes a workflow with delay step', async () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({
      name: 'Delay WF', tenantId: 't1', steps: [
        { id: 's1', type: 'delay', name: 'Wait', config: { delayMs: 5 }, nextOnSuccess: [] },
      ], status: 'active',
    });
    const exec = await engine.execute(def.id);
    expect(exec.status).toBe('completed');
    expect(exec.stepResults.get('s1')?.status).toBe('success');
  });

  it('evaluates conditions correctly', async () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({
      name: 'Condition WF', tenantId: 't1', steps: [
        { id: 's1', type: 'condition', name: 'Check', config: { condition: { field: 'x', operator: 'eq', value: 5 } }, nextOnSuccess: [] },
      ], status: 'active',
      variables: { x: 5 },
    });
    const exec = await engine.execute(def.id);
    expect(exec.status).toBe('completed');
  });

  it('triggers and schedules', () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({ name: 'WF', tenantId: 't1', steps: [], status: 'draft' });
    const trigger = engine.registerTrigger({ workflowId: def.id, type: 'manual', config: {}, enabled: true });
    expect(trigger.id).toBeTruthy();
    const schedule = engine.schedule({ workflowId: def.id, cron: '0 0 * * *', timezone: 'UTC', enabled: true });
    expect(schedule.id).toBeTruthy();
    expect(engine.listTriggers(def.id)).toHaveLength(1);
    expect(engine.listSchedules(def.id)).toHaveLength(1);
  });

  it('getMetrics returns exec counts', async () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({ name: 'M', tenantId: 't1', steps: [{ id: 's1', type: 'delay', name: 'W', config: { delayMs: 1 } }], status: 'active' });
    await engine.execute(def.id);
    const metrics = engine.getMetrics(def.id);
    expect(metrics.totalExecutions).toBe(1);
    expect(metrics.completed).toBe(1);
  });

  it('recover returns undefined for non-failed execution', async () => {
    const engine = new WorkflowEngine();
    const def = engine.createDefinition({ name: 'R', tenantId: 't1', steps: [], status: 'active' });
    const exec = await engine.execute(def.id);
    expect(exec.status).toBe('completed');
    const recovered = await engine.recover(exec.id);
    expect(recovered).toBeUndefined();
  });
});
