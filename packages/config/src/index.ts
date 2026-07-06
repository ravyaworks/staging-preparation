import type { Environment, LogLevel } from '@conversation-platform/types';

export interface AppConfig {
  env: Environment;
  name: string;
  version: string;
  port: number;
  host: string;
  log: {
    level: LogLevel;
    pretty: boolean;
  };
  database: {
    url: string;
    maxConnections: number;
    idleTimeoutMs: number;
  };
  redis: {
    url: string;
    prefix: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
  };
  cors: {
    origins: string[];
    methods: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export type DeepPartialConfig = DeepPartial<AppConfig>;

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export interface ConfigLoader {
  load(): Promise<AppConfig>;
}

export interface ConfigValidator {
  validate(config: DeepPartialConfig): AppConfig;
}

export interface SecretsManager {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}
