import { describe, it, expect } from 'vitest';
import { ToolRegistry, ToolExecutor } from '../index';
import type { ToolDefinition, ToolHandler } from '../index';

describe('ToolRegistry', () => {
  it('register and get tool', () => {
    const reg = new ToolRegistry();
    const handler: ToolHandler = { async execute(p) { return p; } };
    const def: ToolDefinition = { id: 't1', name: 'Test', description: 'D', version: '1.0', category: 'test', parameters: [], status: 'active', createdAt: new Date(), updatedAt: new Date() };
    reg.register(def, handler);
    expect(reg.get('t1')?.id).toBe('t1');
  });

  it('list filters by category', () => {
    const reg = new ToolRegistry();
    const handler: ToolHandler = { async execute(p) { return p; } };
    reg.register({ id: 't1', name: 'A', description: 'D', version: '1.0', category: 'cat1', parameters: [], status: 'active', createdAt: new Date(), updatedAt: new Date() }, handler);
    reg.register({ id: 't2', name: 'B', description: 'D', version: '1.0', category: 'cat2', parameters: [], status: 'active', createdAt: new Date(), updatedAt: new Date() }, handler);
    expect(reg.list('cat1')).toHaveLength(1);
  });

  it('findByCapability returns matching tools', () => {
    const reg = new ToolRegistry();
    const handler: ToolHandler = { async execute(p) { return p; } };
    reg.register({ id: 't1', name: 'A', description: 'D', version: '1.0', category: 'c', parameters: [], metadata: { capabilities: ['search'] }, status: 'active', createdAt: new Date(), updatedAt: new Date() }, handler);
    expect(reg.findByCapability('search')).toHaveLength(1);
  });
});

describe('ToolExecutor', () => {
  it('executes successfully', async () => {
    const reg = new ToolRegistry();
    const handler: ToolHandler = { async execute(p) { return { result: p.input }; } };
    reg.register({ id: 't1', name: 'T', description: 'D', version: '1.0', category: 'c', parameters: [{ name: 'input', type: 'string', required: true }], status: 'active', createdAt: new Date(), updatedAt: new Date() }, handler);
    const exec = new ToolExecutor(reg);
    const result = await exec.execute({ toolId: 't1', parameters: { input: 'hello' } });
    expect(result.success).toBe(true);
    expect((result.output as Record<string, unknown>)?.result).toBe('hello');
  });

  it('fails for unknown tool', async () => {
    const exec = new ToolExecutor(new ToolRegistry());
    const result = await exec.execute({ toolId: 'nonexistent', parameters: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('fails for inactive tool', async () => {
    const reg = new ToolRegistry();
    const handler: ToolHandler = { async execute(p) { return p; } };
    reg.register({ id: 't1', name: 'T', description: 'D', version: '1.0', category: 'c', parameters: [], status: 'inactive', createdAt: new Date(), updatedAt: new Date() }, handler);
    const result = await execExecute(reg, 't1', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('not active');
  });

  it('retries on failure', async () => {
    const reg = new ToolRegistry();
    let attempts = 0;
    const handler: ToolHandler = { async execute() { attempts++; throw new Error('fail'); } };
    reg.register({ id: 't1', name: 'T', description: 'D', version: '1.0', category: 'c', parameters: [], retryConfig: { maxRetries: 2, delayMs: 1, backoffMultiplier: 1 }, status: 'active', createdAt: new Date(), updatedAt: new Date() }, handler);
    const result = await execExecute(reg, 't1', {});
    expect(result.success).toBe(false);
    expect(attempts).toBe(3);
  });
});

async function execExecute(reg: ToolRegistry, toolId: string, params: Record<string, unknown>) {
  const exec = new ToolExecutor(reg);
  return exec.execute({ toolId, parameters: params });
}
