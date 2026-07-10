import type {
  PluginToolRegistration,
  PluginWorkflowRegistration,
  PluginHookRegistration,
  PluginExecutionContext,
  ExecutionResult,
} from './types';
import { PluginExecutionError } from './types';
import { PluginSandbox } from './sandbox';
import type { PluginSandboxOptions } from './sandbox';

export interface PluginEngineOptions {
  allowedPlugins?: string[];
  sandbox?: PluginSandbox;
  defaultTimeoutMs?: number;
  sandboxOptions?: PluginSandboxOptions;
}

export class PluginEngine {
  private readonly tools = new Map<string, PluginToolRegistration>();
  private readonly workflows = new Map<string, PluginWorkflowRegistration>();
  private readonly hooksByEvent = new Map<string, PluginHookRegistration[]>();
  private readonly pluginTools = new Map<string, Set<string>>();
  private readonly pluginWorkflows = new Map<string, Set<string>>();
  private readonly pluginHooks = new Map<string, Set<string>>();
  private readonly allowedPlugins: Set<string>;
  private readonly sandbox: PluginSandbox;
  private readonly defaultTimeoutMs: number;
  private hookIdCounter = 0;

  constructor(options?: PluginEngineOptions) {
    this.allowedPlugins = new Set(options?.allowedPlugins ?? []);
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 30_000;

    if (options?.sandbox) {
      this.sandbox = options.sandbox;
    } else {
      this.sandbox = new PluginSandbox(options?.sandboxOptions ?? { defaultTimeoutMs: this.defaultTimeoutMs });
    }
  }

  registerTool(pluginId: string, tool: PluginToolRegistration): void {
    this.validatePluginAccessOrThrow(pluginId);

    if (this.tools.has(tool.id)) {
      throw new PluginExecutionError(`Tool already registered: ${tool.id}`, pluginId);
    }

    this.tools.set(tool.id, tool);

    if (!this.pluginTools.has(pluginId)) {
      this.pluginTools.set(pluginId, new Set());
    }
    this.pluginTools.get(pluginId)!.add(tool.id);
  }

  registerWorkflow(pluginId: string, workflow: PluginWorkflowRegistration): void {
    this.validatePluginAccessOrThrow(pluginId);

    if (this.workflows.has(workflow.id)) {
      throw new PluginExecutionError(`Workflow already registered: ${workflow.id}`, pluginId);
    }

    this.workflows.set(workflow.id, workflow);

    if (!this.pluginWorkflows.has(pluginId)) {
      this.pluginWorkflows.set(pluginId, new Set());
    }
    this.pluginWorkflows.get(pluginId)!.add(workflow.id);
  }

  registerHook(pluginId: string, hook: PluginHookRegistration): void {
    this.validatePluginAccessOrThrow(pluginId);

    const hookId = `hook_${++this.hookIdCounter}`;
    const registration: PluginHookRegistration = { ...hook, id: hookId };

    const existing = this.hooksByEvent.get(hook.event) ?? [];
    existing.push(registration);
    this.hooksByEvent.set(hook.event, existing);

    if (!this.pluginHooks.has(pluginId)) {
      this.pluginHooks.set(pluginId, new Set());
    }
    this.pluginHooks.get(pluginId)!.add(hookId);
  }

  async executeTool(
    toolId: string,
    context: PluginExecutionContext,
    params: Record<string, unknown>,
  ): Promise<ExecutionResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolId}`,
        durationMs: 0,
      };
    }

    this.validatePluginAccessOrThrow(context.pluginId);

    const start = Date.now();

    try {
      const data = await this.sandbox.executeWithTimeout(
        () => tool.handler(context, params),
      );
      return { success: true, data, durationMs: Date.now() - start };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      };
    }
  }

  async executeWorkflow(
    workflowId: string,
    context: PluginExecutionContext,
    input: Record<string, unknown>,
  ): Promise<ExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        error: `Workflow not found: ${workflowId}`,
        durationMs: 0,
      };
    }

    this.validatePluginAccessOrThrow(context.pluginId);

    const start = Date.now();

    try {
      let data: unknown = input;
      for (const _step of workflow.steps) {
        data = await this.sandbox.executeWithTimeout(async () => data);
      }
      return { success: true, data, durationMs: Date.now() - start };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      };
    }
  }

  async executeHooks(
    event: string,
    context: PluginExecutionContext,
    payload?: unknown,
  ): Promise<ExecutionResult[]> {
    const hooks = this.getHooks(event);
    const results: ExecutionResult[] = [];

    const sorted = [...hooks].sort((a, b) => a.priority - b.priority);

    for (const hook of sorted) {
      const start = Date.now();
      try {
        await this.sandbox.executeWithTimeout(
          () => hook.handler(context, payload),
        );
        results.push({ success: true, durationMs: Date.now() - start });
      } catch (error: unknown) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - start,
        });
      }
    }

    return results;
  }

  getTools(pluginId?: string): PluginToolRegistration[] {
    if (pluginId) {
      const ids = this.pluginTools.get(pluginId);
      if (!ids) return [];
      return Array.from(ids)
        .map((id) => this.tools.get(id))
        .filter((t): t is PluginToolRegistration => t !== undefined);
    }

    return Array.from(this.tools.values());
  }

  getWorkflows(pluginId?: string): PluginWorkflowRegistration[] {
    if (pluginId) {
      const ids = this.pluginWorkflows.get(pluginId);
      if (!ids) return [];
      return Array.from(ids)
        .map((id) => this.workflows.get(id))
        .filter((w): w is PluginWorkflowRegistration => w !== undefined);
    }

    return Array.from(this.workflows.values());
  }

  getHooks(event?: string, pluginId?: string): PluginHookRegistration[] {
    if (event && pluginId) {
      const hooks = this.hooksByEvent.get(event);
      if (!hooks) return [];
      return hooks.filter((h) => {
        const hookPluginId = this.findPluginIdForHook(h.id);
        return hookPluginId === pluginId;
      });
    }

    if (event) {
      return this.hooksByEvent.get(event) ?? [];
    }

    if (pluginId) {
      const hookIds = this.pluginHooks.get(pluginId);
      if (!hookIds) return [];
      const allHooks: PluginHookRegistration[] = [];
      for (const hooks of this.hooksByEvent.values()) {
        for (const hook of hooks) {
          if (hookIds.has(hook.id)) {
            allHooks.push(hook);
          }
        }
      }
      return allHooks;
    }

    const all: PluginHookRegistration[] = [];
    for (const hooks of this.hooksByEvent.values()) {
      all.push(...hooks);
    }
    return all;
  }

  validatePluginAccess(pluginId: string): boolean {
    if (this.allowedPlugins.size === 0) return true;
    return this.allowedPlugins.has(pluginId);
  }

  unregisterPlugin(pluginId: string): void {
    const toolIds = this.pluginTools.get(pluginId);
    if (toolIds) {
      for (const id of toolIds) {
        this.tools.delete(id);
      }
      this.pluginTools.delete(pluginId);
    }

    const workflowIds = this.pluginWorkflows.get(pluginId);
    if (workflowIds) {
      for (const id of workflowIds) {
        this.workflows.delete(id);
      }
      this.pluginWorkflows.delete(pluginId);
    }

    const hookIds = this.pluginHooks.get(pluginId);
    if (hookIds) {
      for (const [event, hooks] of this.hooksByEvent.entries()) {
        const remaining = hooks.filter((h) => !hookIds.has(h.id));
        if (remaining.length === 0) {
          this.hooksByEvent.delete(event);
        } else {
          this.hooksByEvent.set(event, remaining);
        }
      }
      this.pluginHooks.delete(pluginId);
    }
  }

  private validatePluginAccessOrThrow(pluginId: string): void {
    if (!this.validatePluginAccess(pluginId)) {
      throw new PluginExecutionError(`Plugin access denied: ${pluginId}`, pluginId);
    }
  }

  private findPluginIdForHook(hookId: string): string | undefined {
    for (const [pluginId, hookIds] of this.pluginHooks.entries()) {
      if (hookIds.has(hookId)) {
        return pluginId;
      }
    }
    return undefined;
  }
}
