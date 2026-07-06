import { vi, expect } from 'vitest';
import type { AsyncFunction } from '@conversation-platform/types';

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

export function createMockConfig(overrides: Record<string, unknown> = {}) {
  return {
    env: 'test',
    name: 'test-app',
    version: '0.1.0',
    port: 0,
    host: 'localhost',
    log: { level: 'debug', pretty: true },
    database: {
      url: 'postgresql://localhost:5432/test',
      maxConnections: 1,
      idleTimeoutMs: 1000,
    },
    redis: { url: 'redis://localhost:6379', prefix: 'test:' },
    auth: {
      jwtSecret: 'test-secret',
      jwtExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
      bcryptRounds: 10,
    },
    cors: { origins: ['*'], methods: ['GET'] },
    rateLimit: { windowMs: 60000, maxRequests: 1000 },
    ...overrides,
  };
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
