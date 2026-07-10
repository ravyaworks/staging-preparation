import type { PluginSandbox as PluginSandboxInterface, PluginExecutionContext } from './types';
import { PluginTimeoutError } from './types';

export interface PluginSandboxOptions {
  defaultTimeoutMs?: number;
  allowedApis?: string[];
}

const DEFAULT_ALLOWED_APIS: readonly string[] = [
  'console.log',
  'console.warn',
  'console.error',
  'JSON.parse',
  'JSON.stringify',
  'Math',
  'Date',
  'Array',
  'Object',
  'String',
  'Number',
  'Boolean',
  'Map',
  'Set',
  'Promise',
  'RegExp',
  'Error',
  'TypeError',
  'RangeError',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'encodeURIComponent',
  'decodeURI',
  'decodeURIComponent',
];

export class PluginSandbox implements PluginSandboxInterface {
  public readonly allowedApis: readonly string[];
  private readonly defaultTimeoutMs: number;

  constructor(options?: PluginSandboxOptions) {
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 30_000;
    this.allowedApis = options?.allowedApis ?? DEFAULT_ALLOWED_APIS;
  }

  createContext(pluginId: string, tenantId: string): PluginExecutionContext {
    const requestId = crypto.randomUUID();
    return {
      pluginId,
      requestId,
      tenantId,
      metadata: {},
    };
  }

  async executeWithTimeout<T>(handler: () => Promise<T>, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs ?? this.defaultTimeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await Promise.race([
        handler(),
        new Promise<never>((_, reject) => {
          const onAbort = (): void => {
            controller.signal.removeEventListener('abort', onAbort);
            reject(new PluginTimeoutError(`Execution timed out after ${timeout}ms`, undefined, timeout));
          };
          controller.signal.addEventListener('abort', onAbort);
        }),
      ]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
