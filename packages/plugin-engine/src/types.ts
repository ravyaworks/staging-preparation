export interface PluginSandbox {
  createContext(pluginId: string, tenantId: string): PluginExecutionContext;
  executeWithTimeout<T>(handler: () => Promise<T>, timeoutMs?: number): Promise<T>;
  readonly allowedApis: readonly string[];
}

export interface PluginToolRegistration {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (context: PluginExecutionContext, params: Record<string, unknown>) => Promise<unknown>;
}

export interface PluginWorkflowStep {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

export interface PluginWorkflowRegistration {
  id: string;
  name: string;
  trigger: string;
  steps: PluginWorkflowStep[];
}

export interface PluginHookRegistration {
  id: string;
  event: string;
  priority: number;
  handler: (context: PluginExecutionContext, payload: unknown) => Promise<void>;
}

export interface PluginExecutionContext {
  pluginId: string;
  requestId: string;
  tenantId: string;
  userId?: string;
  metadata: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
}

export class PluginExecutionError extends Error {
  public override readonly name = 'PluginExecutionError';

  constructor(
    message: string,
    public readonly pluginId?: string,
  ) {
    super(message);
  }
}

export class PluginSandboxError extends Error {
  public override readonly name = 'PluginSandboxError';

  constructor(
    message: string,
    public readonly pluginId?: string,
  ) {
    super(message);
  }
}

export class PluginTimeoutError extends Error {
  public override readonly name = 'PluginTimeoutError';

  constructor(
    message: string,
    public readonly pluginId?: string,
    public readonly timeoutMs?: number,
  ) {
    super(message);
  }
}
