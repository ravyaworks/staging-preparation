import type { AppConfig } from './index';

export type DeepPartialConfig = {
  [P in keyof AppConfig]?: AppConfig[P] extends object
    ? { [K in keyof AppConfig[P]]?: AppConfig[P][K] }
    : AppConfig[P];
};

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
