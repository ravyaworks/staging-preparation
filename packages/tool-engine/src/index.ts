export type ToolStatus = 'active' | 'inactive' | 'error';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  parameters: ToolParameter[];
  permissions?: string[];
  timeout?: number;
  retryConfig?: ToolRetryConfig;
  metadata?: Record<string, unknown>;
  status: ToolStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  validation?: Record<string, unknown>;
}

export interface ToolRetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface ToolExecutionRequest {
  toolId: string;
  parameters: Record<string, unknown>;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionResult {
  id: string;
  toolId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
  startedAt: Date;
  completedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ToolHandler<TOutput = unknown> {
  execute(params: Record<string, unknown>, context?: ToolExecutionContext): Promise<TOutput>;
  validate?(params: Record<string, unknown>): ValidationResult;
}

export interface ToolExecutionContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();

  register(tool: ToolDefinition, handler: ToolHandler): void {
    this.tools.set(tool.id, tool);
    this.handlers.set(tool.id, handler);
  }

  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  getHandler(id: string): ToolHandler | undefined {
    return this.handlers.get(id);
  }

  list(category?: string): ToolDefinition[] {
    const all = Array.from(this.tools.values());
    return category ? all.filter(t => t.category === category) : all;
  }

  unregister(id: string): boolean {
    this.handlers.delete(id);
    return this.tools.delete(id);
  }

  findByCapability(capability: string): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(
      t => t.metadata?.capabilities && Array.isArray(t.metadata.capabilities) && (t.metadata.capabilities as string[]).includes(capability)
    );
  }
}

export class ToolExecutor {
  constructor(private registry: ToolRegistry) {}

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const def = this.registry.get(request.toolId);
    if (!def) {
      return this.errorResult(request.toolId, `Tool not found: ${request.toolId}`);
    }
    if (def.status !== 'active') {
      return this.errorResult(request.toolId, `Tool is not active: ${def.status}`);
    }

    const handler = this.registry.getHandler(request.toolId);
    if (!handler) {
      return this.errorResult(request.toolId, `No handler registered for tool: ${request.toolId}`);
    }

    const start = Date.now();
    const startedAt = new Date();

    try {
      if (handler.validate) {
        const validation = handler.validate(request.parameters);
        if (!validation.valid) {
          return {
            id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            toolId: request.toolId,
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`,
            duration: Date.now() - start,
            startedAt,
            completedAt: new Date(),
          };
        }
      }

      const result = await this.executeWithRetry(handler, request.parameters, def.retryConfig, {
        tenantId: request.tenantId,
        userId: request.userId,
        requestId: request.metadata?.requestId as string | undefined,
      });

      return {
        id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        toolId: request.toolId,
        success: true,
        output: result,
        duration: Date.now() - start,
        startedAt,
        completedAt: new Date(),
        metadata: request.metadata,
      };
    } catch (error) {
      return {
        id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        toolId: request.toolId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
        startedAt,
        completedAt: new Date(),
        metadata: request.metadata,
      };
    }
  }

  private async executeWithRetry(
    handler: ToolHandler,
    params: Record<string, unknown>,
    retryConfig?: ToolRetryConfig,
    context?: ToolExecutionContext,
  ): Promise<unknown> {
    const config = retryConfig ?? { maxRetries: 0, delayMs: 0, backoffMultiplier: 2 };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await handler.execute(params, context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < config.maxRetries) {
          const delay = config.delayMs * Math.pow(config.backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error('Execution failed');
  }

  private errorResult(toolId: string, message: string): ToolExecutionResult {
    return {
      id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      toolId,
      success: false,
      error: message,
      duration: 0,
      startedAt: new Date(),
      completedAt: new Date(),
    };
  }
}
