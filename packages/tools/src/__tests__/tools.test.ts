import { describe, it, expect } from 'vitest';
import { getAllDefaultToolDefs, createDefaultToolHandlerStub, ToolCategories } from '../index';

describe('Default Tool Definitions', () => {
  it('getAllDefaultToolDefs returns 12 tools', () => {
    const defs = getAllDefaultToolDefs();
    expect(defs).toHaveLength(12);
  });

  it('each tool has required fields', () => {
    const defs = getAllDefaultToolDefs();
    for (const def of defs) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.parameters).toBeDefined();
      expect(def.status).toBe('active');
    }
  });

  it('all categories are valid', () => {
    const defs = getAllDefaultToolDefs();
    const validCategories = Object.values(ToolCategories);
    for (const def of defs) {
      expect(validCategories).toContain(def.category);
    }
  });
});

describe('createDefaultToolHandlerStub', () => {
  it('validate returns error for missing action', () => {
    const handler = createDefaultToolHandlerStub();
    const validate = handler.validate!;
    const result = validate({});
    expect(result.valid).toBe(false);
  });

  it('validate passes with action', () => {
    const handler = createDefaultToolHandlerStub();
    const validate = handler.validate!;
    const result = validate({ action: 'test' });
    expect(result.valid).toBe(true);
  });

  it('execute returns not_implemented status', async () => {
    const handler = createDefaultToolHandlerStub();
    const result = await handler.execute({ action: 'send' });
    expect((result as Record<string, unknown>).status).toBe('not_implemented');
  });
});
