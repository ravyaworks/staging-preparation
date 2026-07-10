import type { ChannelConfig, ChannelType } from './types'

export interface ConfigSource {
  get(key: string): string | undefined
  getObject<T>(key: string): T | undefined
}

export class ChannelConfigLoader {
  private configs = new Map<string, ChannelConfig>()

  load(tenantId: string, type: ChannelType, source: ConfigSource): ChannelConfig {
    const config: ChannelConfig = {
      enabled: source.get(`${type}.enabled`) === 'true',
      webhookUrl: source.get(`${type}.webhookUrl`),
      webhookSecret: source.get(`${type}.webhookSecret`),
      rateLimitPerMinute: Number(source.get(`${type}.rateLimitPerMinute`)) || undefined,
      retryMaxAttempts: Number(source.get(`${type}.retryMaxAttempts`)) || undefined,
      retryBackoffBaseMs: Number(source.get(`${type}.retryBackoffBaseMs`)) || undefined,
      customConfig: source.getObject<Record<string, unknown>>(`${type}.customConfig`),
    }

    const key = `${tenantId}:${type}`
    this.configs.set(key, config)
    return config
  }

  get(tenantId: string, type: ChannelType): ChannelConfig | undefined {
    return this.configs.get(`${tenantId}:${type}`)
  }

  set(tenantId: string, type: ChannelType, config: ChannelConfig): void {
    this.configs.set(`${tenantId}:${type}`, config)
  }

  remove(tenantId: string, type: ChannelType): boolean {
    return this.configs.delete(`${tenantId}:${type}`)
  }

  clear(): void {
    this.configs.clear()
  }
}
