import type { AIProvider } from './provider';
import type { ProviderName } from './types';

export class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  register(name: string, provider: AIProvider): void {
    if (this.providers.has(name)) {
      throw new Error(`Provider '${name}' is already registered`);
    }
    this.providers.set(name, provider);
  }

  get(name: ProviderName | string): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' is not registered`);
    }
    return provider;
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getNames(): string[] {
    return Array.from(this.providers.keys());
  }

  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  clear(): void {
    this.providers.clear();
  }
}
