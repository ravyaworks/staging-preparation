import { z } from 'zod';
import type { Environment, LogLevel } from '@conversation-platform/types';

export interface AppConfig {
  env: Environment;
  name: string;
  version: string;
  port: number;
  host: string;
  log: { level: LogLevel; pretty: boolean };
  database: { url: string; maxConnections: number };
  redis: { url: string; prefix: string };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    bcryptRounds: number;
    issuer: string;
  };
  cors: { origins: string[]; methods: string[] };
  rateLimit: { windowMs: number; maxRequests: number };
  storage: { provider: string; localPath: string };
}

const configSchema = z.object({
  env: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  name: z.string().default('conversation-platform'),
  version: z.string().default('0.1.0'),
  port: z.coerce.number().int().positive().default(3000),
  host: z.string().default('0.0.0.0'),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.coerce.boolean().default(true),
  }),
  database: z.object({
    url: z.string().default('postgresql://localhost:5432/conversation_platform'),
    maxConnections: z.coerce.number().int().positive().default(10),
  }),
  redis: z.object({
    url: z.string().default('redis://localhost:6379'),
    prefix: z.string().default('cp:'),
  }),
  auth: z.object({
    jwtSecret: z.string().min(32).default('CHANGE_ME_TO_A_SECURE_SECRET_32_CHARS_MIN'),
    jwtExpiresIn: z.string().default('15m'),
    refreshSecret: z.string().min(32).default('CHANGE_ME_TO_A_SECURE_REFRESH_SECRET_32_CHARS'),
    refreshExpiresIn: z.string().default('7d'),
    bcryptRounds: z.coerce.number().int().positive().default(12),
    issuer: z.string().default('conversation-platform'),
  }),
  cors: z.object({
    origins: z.string().default('*').transform((s) => s.split(',')),
    methods: z.string().default('GET,POST,PUT,PATCH,DELETE').transform((s) => s.split(',')),
  }),
  rateLimit: z.object({
    windowMs: z.coerce.number().int().positive().default(60000),
    maxRequests: z.coerce.number().int().positive().default(100),
  }),
  storage: z.object({
    provider: z.string().default('local'),
    localPath: z.string().default('./uploads'),
  }),
});

export function loadConfig(overrides?: Partial<AppConfig>): AppConfig {
  const raw: Record<string, unknown> = {
    env: process.env.NODE_ENV,
    name: process.env.APP_NAME,
    version: process.env.APP_VERSION,
    port: process.env.PORT,
    host: process.env.HOST,
    log: {
      level: process.env.LOG_LEVEL,
      pretty: process.env.LOG_PRETTY,
    },
    database: {
      url: process.env.DATABASE_URL,
      maxConnections: process.env.DATABASE_MAX_CONNECTIONS,
    },
    redis: {
      url: process.env.REDIS_URL,
      prefix: process.env.REDIS_PREFIX,
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN,
      refreshSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      bcryptRounds: process.env.BCRYPT_ROUNDS,
      issuer: process.env.JWT_ISSUER,
    },
    cors: {
      origins: process.env.CORS_ORIGINS,
      methods: process.env.CORS_METHODS,
    },
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER,
      localPath: process.env.STORAGE_LOCAL_PATH,
    },
  };

  const merged = deepMerge(raw, overrides ?? {});
  const parsed = configSchema.parse(merged);

  return parsed as AppConfig;
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source as Record<string, unknown>)) {
    const targetVal = target[key];
    const sourceVal = (source as Record<string, unknown>)[key];

    if (
      targetVal &&
      sourceVal &&
      typeof targetVal === 'object' &&
      typeof sourceVal === 'object' &&
      !Array.isArray(targetVal) &&
      !Array.isArray(sourceVal)
    ) {
      result[key as keyof T] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      ) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key as keyof T] = sourceVal as T[keyof T];
    }
  }

  return result;
}

export { configSchema };
export type { ConfigLoader, ConfigValidator, SecretsManager } from './interfaces';
