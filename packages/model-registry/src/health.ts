import type { ModelInfo, ProviderName } from '@conversation-platform/provider-framework';

export interface ProviderHealth {
  provider: ProviderName;
  healthy: boolean;
  latency: number;
  lastChecked: Date;
  error?: string;
}

export class HealthTracker {
  private statuses = new Map<ProviderName, ProviderHealth>();

  record(result: Omit<ProviderHealth, 'lastChecked'>): void {
    this.statuses.set(result.provider, { ...result, lastChecked: new Date() });
  }

  get(provider: ProviderName): ProviderHealth | undefined {
    return this.statuses.get(provider);
  }

  getAll(): ProviderHealth[] {
    return Array.from(this.statuses.values());
  }

  getHealthy(): ProviderHealth[] {
    return Array.from(this.statuses.values()).filter(s => s.healthy);
  }

  getUnhealthy(): ProviderHealth[] {
    return Array.from(this.statuses.values()).filter(s => !s.healthy);
  }

  isHealthy(provider: ProviderName): boolean {
    return this.statuses.get(provider)?.healthy ?? false;
  }

  clear(): void {
    this.statuses.clear();
  }
}
