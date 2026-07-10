import { describe, it, expect, vi } from 'vitest';
import { PluginEngine } from '../engine';
import { PluginSandbox } from '../sandbox';
import {
  PluginExecutionError,
  PluginTimeoutError,
} from '../types';
import type {
  PluginToolRegistration,
  PluginWorkflowRegistration,
  PluginHookRegistration,
  PluginExecutionContext,
} from '../types';

function createContext(overrides?: Partial<PluginExecutionContext>): PluginExecutionContext {
  return {
    pluginId: 'test-plugin',
    requestId: 'req-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    metadata: {},
    ...overrides,
  };
}

describe('PluginEngine', () => {
  describe('registration', () => {
    it('registers a tool and retrieves it', () => {
      const engine = new PluginEngine();
      const tool: PluginToolRegistration = {
        id: 'tool-1',
        name: 'Test Tool',
        description: 'A test tool',
        parameters: { type: 'object', properties: {} },
        handler: async () => 'result',
      };

      engine.registerTool('plugin-1', tool);
      const tools = engine.getTools();

      expect(tools).toHaveLength(1);
      expect(tools[0]!.id).toBe('tool-1');
      expect(tools[0]!.name).toBe('Test Tool');
    });

    it('registers a workflow and retrieves it', () => {
      const engine = new PluginEngine();
      const workflow: PluginWorkflowRegistration = {
        id: 'wf-1',
        name: 'Test Workflow',
        trigger: 'message.created',
        steps: [{ id: 'step-1', type: 'transform', config: {} }],
      };

      engine.registerWorkflow('plugin-1', workflow);
      const workflows = engine.getWorkflows();

      expect(workflows).toHaveLength(1);
      expect(workflows[0]!.id).toBe('wf-1');
      expect(workflows[0]!.name).toBe('Test Workflow');
    });

    it('registers a hook and retrieves it', () => {
      const engine = new PluginEngine();
      const hook: PluginHookRegistration = {
        id: '',
        event: 'message.created',
        priority: 100,
        handler: async () => {},
      };

      engine.registerHook('plugin-1', hook);
      const hooks = engine.getHooks('message.created');

      expect(hooks).toHaveLength(1);
      expect(hooks[0]!.event).toBe('message.created');
      expect(hooks[0]!.priority).toBe(100);
    });

    it('throws when registering a duplicate tool', () => {
      const engine = new PluginEngine();
      const tool: PluginToolRegistration = {
        id: 'tool-dup',
        name: 'Duplicate',
        description: '',
        parameters: {},
        handler: async () => {},
      };

      engine.registerTool('plugin-1', tool);
      expect(() => engine.registerTool('plugin-2', tool)).toThrow(PluginExecutionError);
    });

    it('throws when registering a duplicate workflow', () => {
      const engine = new PluginEngine();
      const workflow: PluginWorkflowRegistration = {
        id: 'wf-dup',
        name: 'Duplicate',
        trigger: 'event',
        steps: [],
      };

      engine.registerWorkflow('plugin-1', workflow);
      expect(() => engine.registerWorkflow('plugin-2', workflow)).toThrow(PluginExecutionError);
    });
  });

  describe('getters with filters', () => {
    it('gets tools filtered by pluginId', () => {
      const engine = new PluginEngine();
      engine.registerTool('plugin-a', { id: 't1', name: 'A1', description: '', parameters: {}, handler: async () => {} });
      engine.registerTool('plugin-b', { id: 't2', name: 'B1', description: '', parameters: {}, handler: async () => {} });
      engine.registerTool('plugin-a', { id: 't3', name: 'A2', description: '', parameters: {}, handler: async () => {} });

      const pluginATools = engine.getTools('plugin-a');
      expect(pluginATools).toHaveLength(2);
      expect(pluginATools.map((t) => t.id).sort()).toEqual(['t1', 't3']);
    });

    it('gets workflows filtered by pluginId', () => {
      const engine = new PluginEngine();
      engine.registerWorkflow('plugin-a', { id: 'wf1', name: 'W1', trigger: 'e1', steps: [] });
      engine.registerWorkflow('plugin-b', { id: 'wf2', name: 'W2', trigger: 'e2', steps: [] });

      const wfs = engine.getWorkflows('plugin-a');
      expect(wfs).toHaveLength(1);
      expect(wfs[0]!.id).toBe('wf1');
    });

    it('gets hooks filtered by event', () => {
      const engine = new PluginEngine();
      engine.registerHook('plugin-1', { id: '', event: 'e1', priority: 10, handler: async () => {} });
      engine.registerHook('plugin-2', { id: '', event: 'e2', priority: 20, handler: async () => {} });

      expect(engine.getHooks('e1')).toHaveLength(1);
      expect(engine.getHooks('e2')).toHaveLength(1);
      expect(engine.getHooks('e3')).toHaveLength(0);
    });

    it('gets hooks filtered by event and pluginId', () => {
      const engine = new PluginEngine();
      engine.registerHook('plugin-a', { id: '', event: 'e1', priority: 10, handler: async () => {} });
      engine.registerHook('plugin-b', { id: '', event: 'e1', priority: 20, handler: async () => {} });

      const hooks = engine.getHooks('e1', 'plugin-a');
      expect(hooks).toHaveLength(1);
    });
  });

  describe('execution', () => {
    it('executes a tool successfully', async () => {
      const engine = new PluginEngine();
      const tool: PluginToolRegistration = {
        id: 'tool-exec',
        name: 'Executable',
        description: '',
        parameters: {},
        handler: async (_ctx, params) => `hello ${params.name as string}`,
      };

      engine.registerTool('plugin-1', tool);
      const context = createContext();
      const result = await engine.executeTool('tool-exec', context, { name: 'world' });

      expect(result.success).toBe(true);
      expect(result.data).toBe('hello world');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('handles tool execution failure', async () => {
      const engine = new PluginEngine();
      const tool: PluginToolRegistration = {
        id: 'tool-fail',
        name: 'Failing',
        description: '',
        parameters: {},
        handler: async () => { throw new Error('Something went wrong'); },
      };

      engine.registerTool('plugin-1', tool);
      const result = await engine.executeTool('tool-fail', createContext(), {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    it('handles tool execution timeout', async () => {
      const sandbox = new PluginSandbox({ defaultTimeoutMs: 50 });
      const engine = new PluginEngine({ sandbox });
      const tool: PluginToolRegistration = {
        id: 'tool-slow',
        name: 'Slow',
        description: '',
        parameters: {},
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return 'too late';
        },
      };

      engine.registerTool('plugin-1', tool);
      const result = await engine.executeTool('tool-slow', createContext(), {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('executes hooks by event', async () => {
      const engine = new PluginEngine();
      const handler = vi.fn(async () => {});
      engine.registerHook('plugin-1', { id: '', event: 'message.created', priority: 100, handler });

      const context = createContext();
      const results = await engine.executeHooks('message.created', context);

      expect(results).toHaveLength(1);
      expect(results[0]!.success).toBe(true);
      expect(handler).toHaveBeenCalledOnce();
    });

    it('executes hooks in priority order', async () => {
      const engine = new PluginEngine();
      const order: number[] = [];

      engine.registerHook('plugin-1', {
        id: '', event: 'order.test', priority: 200,
        handler: async () => { order.push(200); },
      });
      engine.registerHook('plugin-2', {
        id: '', event: 'order.test', priority: 100,
        handler: async () => { order.push(100); },
      });
      engine.registerHook('plugin-3', {
        id: '', event: 'order.test', priority: 300,
        handler: async () => { order.push(300); },
      });

      await engine.executeHooks('order.test', createContext());
      expect(order).toEqual([100, 200, 300]);
    });

    it('executes a workflow', async () => {
      const engine = new PluginEngine();
      const workflow: PluginWorkflowRegistration = {
        id: 'wf-exec',
        name: 'Executable Workflow',
        trigger: 'manual',
        steps: [
          { id: 's1', type: 'transform', config: { multiply: 2 } },
          { id: 's2', type: 'transform', config: { add: 1 } },
        ],
      };

      engine.registerWorkflow('plugin-1', workflow);
      const result = await engine.executeWorkflow('wf-exec', createContext(), { value: 5 });

      expect(result.success).toBe(true);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('handles unknown tool gracefully', async () => {
      const engine = new PluginEngine();
      const result = await engine.executeTool('nonexistent', createContext(), {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('handles unknown workflow gracefully', async () => {
      const engine = new PluginEngine();
      const result = await engine.executeWorkflow('nonexistent', createContext(), {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns empty results for unknown event hooks', async () => {
      const engine = new PluginEngine();
      const results = await engine.executeHooks('unknown.event', createContext());
      expect(results).toHaveLength(0);
    });
  });

  describe('security', () => {
    it('validates plugin access - allowed', () => {
      const engine = new PluginEngine({ allowedPlugins: ['trusted-plugin'] });
      expect(engine.validatePluginAccess('trusted-plugin')).toBe(true);
      expect(engine.validatePluginAccess('untrusted-plugin')).toBe(false);
    });

    it('validates plugin access - allows all when no restrictions', () => {
      const engine = new PluginEngine();
      expect(engine.validatePluginAccess('any-plugin')).toBe(true);
    });

    it('throws when registering tool from unauthorized plugin', () => {
      const engine = new PluginEngine({ allowedPlugins: ['trusted'] });
      expect(() => engine.registerTool('untrusted', {
        id: 't', name: '', description: '', parameters: {}, handler: async () => {},
      })).toThrow(PluginExecutionError);
    });
  });

  describe('lifecycle', () => {
    it('unregisters a plugin and removes all its registrations', () => {
      const engine = new PluginEngine();
      engine.registerTool('plugin-1', { id: 't1', name: '', description: '', parameters: {}, handler: async () => {} });
      engine.registerTool('plugin-1', { id: 't2', name: '', description: '', parameters: {}, handler: async () => {} });
      engine.registerWorkflow('plugin-1', { id: 'wf1', name: '', trigger: '', steps: [] });
      engine.registerHook('plugin-1', { id: '', event: 'e1', priority: 10, handler: async () => {} });

      expect(engine.getTools('plugin-1')).toHaveLength(2);
      expect(engine.getWorkflows('plugin-1')).toHaveLength(1);
      expect(engine.getHooks('e1', 'plugin-1')).toHaveLength(1);

      engine.unregisterPlugin('plugin-1');

      expect(engine.getTools('plugin-1')).toHaveLength(0);
      expect(engine.getWorkflows('plugin-1')).toHaveLength(0);
      expect(engine.getHooks('e1', 'plugin-1')).toHaveLength(0);
    });

    it('does not affect other plugins when unregistering one', () => {
      const engine = new PluginEngine();
      engine.registerTool('plugin-a', { id: 'ta', name: '', description: '', parameters: {}, handler: async () => {} });
      engine.registerTool('plugin-b', { id: 'tb', name: '', description: '', parameters: {}, handler: async () => {} });

      engine.unregisterPlugin('plugin-a');

      expect(engine.getTools('plugin-a')).toHaveLength(0);
      expect(engine.getTools('plugin-b')).toHaveLength(1);
    });

    it('handles unregistering a non-existent plugin gracefully', () => {
      const engine = new PluginEngine();
      expect(() => engine.unregisterPlugin('ghost')).not.toThrow();
    });
  });

  describe('sandbox', () => {
    it('enforces sandbox timeout with PluginTimeoutError', async () => {
      const sandbox = new PluginSandbox({ defaultTimeoutMs: 10 });
      const engine = new PluginEngine({ sandbox });
      const tool: PluginToolRegistration = {
        id: 'tool-timeout',
        name: 'Timeout',
        description: '',
        parameters: {},
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return 'done';
        },
      };

      engine.registerTool('plugin-1', tool);
      const result = await engine.executeTool('tool-timeout', createContext(), {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('provides context via createContext', () => {
      const sandbox = new PluginSandbox();
      const context = sandbox.createContext('my-plugin', 'my-tenant');

      expect(context.pluginId).toBe('my-plugin');
      expect(context.tenantId).toBe('my-tenant');
      expect(context.requestId).toBeDefined();
    });
  });
});
