import { describe, it, expect } from 'vitest';
import { createTemplate, compileTemplate, PromptRegistry, SystemPromptBuilder, UserPromptBuilder, validateTemplate, incrementVersion, PromptError } from '../index';

describe('createTemplate', () => {
  it('creates a template with defaults', () => {
    const t = createTemplate({ id: 'greeting', name: 'Greeting', content: 'Hello {{name}}' });
    expect(t.role).toBe('user');
    expect(t.version).toBe(1);
    expect(t.variables).toEqual([]);
  });
});

describe('compileTemplate', () => {
  it('substitutes variables', () => {
    const t = createTemplate({ id: 't1', name: 'Test', content: 'Hi {{name}}', variables: [{ name: 'name', required: true }] });
    const compiled = compileTemplate(t, { variables: { name: 'Alice' } });
    expect(compiled.content).toBe('Hi Alice');
    expect(compiled.usedVariables).toEqual(['name']);
  });

  it('throws on missing required variable', () => {
    const t = createTemplate({ id: 't2', name: 'Test', content: 'Hi {{name}}', variables: [{ name: 'name', required: true }] });
    expect(() => compileTemplate(t, { variables: {} })).toThrow(PromptError);
  });

  it('uses empty string for missing when onMissing is empty', () => {
    const t = createTemplate({ id: 't3', name: 'Test', content: 'Hi {{name}}', variables: [{ name: 'name', required: true }] });
    const compiled = compileTemplate(t, { variables: {}, onMissing: 'empty' });
    expect(compiled.content).toBe('Hi ');
  });
});

describe('PromptRegistry', () => {
  it('register, get, compile, findByTag', () => {
    const reg = new PromptRegistry();
    const t = createTemplate({ id: 'test', name: 'Test', content: 'Hello {{x}}', variables: [{ name: 'x', required: true }], tags: ['tag1'] });
    reg.register(t);
    expect(reg.get('test')?.id).toBe('test');
    expect(() => reg.getOrThrow('nope')).toThrow(PromptError);
    expect(reg.count).toBe(1);
    expect(reg.findByTag('tag1')).toHaveLength(1);
    expect(reg.findByTag('other')).toHaveLength(0);
  });

  it('tracks version history on re-registration', () => {
    const reg = new PromptRegistry();
    const v1 = createTemplate({ id: 'a', name: 'A', content: 'v1' });
    const v2 = createTemplate({ id: 'a', name: 'A', content: 'v2' });
    reg.register(v1);
    reg.register(v2);
    expect(reg.getVersionHistory('a')).toHaveLength(1);
    expect(reg.getVersionHistory('a')[0]?.content).toBe('v1');
  });

  it('compile delegates to compileTemplate', () => {
    const reg = new PromptRegistry();
    const t = createTemplate({ id: 'hi', name: 'Hi', content: 'Hi {{name}}', variables: [{ name: 'name', required: true }] });
    reg.register(t);
    const compiled = reg.compile('hi', { variables: { name: 'Bob' } });
    expect(compiled.content).toBe('Hi Bob');
  });
});

describe('SystemPromptBuilder', () => {
  it('chains methods and builds', () => {
    const builder = new SystemPromptBuilder();
    const result = builder.addRole('helper').addInstruction('Be nice.').addConstraint('No swearing.').build();
    expect(result).toContain('You are a helper.');
    expect(result).toContain('Be nice.');
    expect(result).toContain('Constraint: No swearing.');
  });

  it('builds a template', () => {
    const t = new SystemPromptBuilder().addRole('agent').buildTemplate('sys-1', 'System Prompt');
    expect(t.role).toBe('system');
    expect(t.content).toContain('You are a agent');
  });
});

describe('UserPromptBuilder', () => {
  it('chains methods and builds', () => {
    const builder = new UserPromptBuilder();
    const result = builder.addQuestion('What is AI?').addData('some data').build();
    expect(result).toContain('What is AI?');
    expect(result).toContain('Data:');
  });

  it('builds a template', () => {
    const t = new UserPromptBuilder().addQuestion('Q?').buildTemplate('usr-1', 'User Prompt');
    expect(t.role).toBe('user');
    expect(t.content).toBe('Q?');
  });
});

describe('validateTemplate', () => {
  it('returns errors for invalid templates', () => {
    const errors = validateTemplate({ id: '', name: '', content: '', variables: [], version: 1, role: 'user', tags: [] });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('Template ID is required');
    expect(errors).toContain('Template name is required');
    expect(errors).toContain('Template content is required');
  });

  it('detects duplicate variable names', () => {
    const errors = validateTemplate({ id: 'a', name: 'A', content: 'hi', variables: [{ name: 'x', required: false }, { name: 'x', required: false }], version: 1, role: 'user', tags: [] });
    expect(errors).toContain('Duplicate variable name: x');
  });

  it('returns no errors for valid template', () => {
    const err = validateTemplate({ id: 'a', name: 'A', content: 'hello', variables: [], version: 1, role: 'user', tags: [] });
    expect(err).toHaveLength(0);
  });
});

describe('incrementVersion', () => {
  it('increments the version number', () => {
    const t = createTemplate({ id: 'x', name: 'X', content: 'test' });
    expect(incrementVersion(t).version).toBe(2);
    expect(incrementVersion(incrementVersion(t)).version).toBe(3);
  });
});
