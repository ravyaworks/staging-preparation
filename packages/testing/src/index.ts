import { vi, expect } from 'vitest';
import type { AsyncFunction } from '@conversation-platform/types';
import type { AppConfig } from '@conversation-platform/config';

export function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
    setLevel: vi.fn(),
    getLevel: vi.fn().mockReturnValue('debug'),
  };
}

export function createMockConfig(overrides: Partial<AppConfig> = {}) {
  const defaults: AppConfig = {
    env: 'test',
    name: 'test-app',
    version: '0.1.0',
    port: 0,
    host: 'localhost',
    log: { level: 'debug', pretty: true },
    database: { url: 'postgresql://localhost:5432/test', maxConnections: 1 },
    redis: { url: 'redis://localhost:6379', prefix: 'test:' },
    auth: {
      jwtSecret: 'test-secret-that-is-at-least-32-characters-long!!',
      jwtExpiresIn: '15m',
      refreshSecret: 'test-refresh-secret-at-least-32-characters!!',
      refreshExpiresIn: '7d',
      bcryptRounds: 10,
      issuer: 'test',
    },
    cors: { origins: ['*'], methods: ['GET'] },
    rateLimit: { windowMs: 60000, maxRequests: 1000 },
    storage: { provider: 'local', localPath: './uploads' },
    ai: {
      defaultProvider: 'openai',
      defaultModel: 'gpt-4o-mini',
      maxRetries: 3,
      retryDelayMs: 1000,
      timeout: 60000,
      maxTokensPerRequest: 4096,
      trackCost: true,
      ollamaBaseUrl: 'http://localhost:11434',
    },
  };
  return { ...defaults, ...overrides };
}

export async function expectRejection(
  fn: AsyncFunction,
  errorClass?: new (...args: never[]) => Error,
): Promise<void> {
  let threw = false;
  try {
    await fn();
  } catch (error) {
    threw = true;
    if (errorClass) {
      expect(error).toBeInstanceOf(errorClass);
    }
    return;
  }
  if (!threw) {
    throw new Error('Expected function to throw but it resolved successfully');
  }
}

export function asyncTest(fn: () => Promise<void>): () => Promise<void> {
  return fn;
}

export type { Mock } from 'vitest';
