import type { ModelInfo, ProviderName } from '@conversation-platform/provider-framework';
import { BUILT_IN_MODELS, getModelsByProvider, getBuiltInModels, findModel } from './models';

export class ModelRegistry {
  private customModels = new Map<string, ModelInfo>();

  constructor() {
    for (const model of BUILT_IN_MODELS) {
      this.customModels.set(model.id, model);
    }
  }

  register(model: ModelInfo): void {
    this.customModels.set(model.id, model);
  }

  registerMany(models: ModelInfo[]): void {
    for (const model of models) {
      this.customModels.set(model.id, model);
    }
  }

  get(id: string): ModelInfo | undefined {
    return this.customModels.get(id);
  }

  getByProvider(provider: ProviderName): ModelInfo[] {
    return Array.from(this.customModels.values()).filter(m => m.provider === provider);
  }

  getAll(): ModelInfo[] {
    return Array.from(this.customModels.values());
  }

  hasCapability(id: string, capability: keyof ModelInfo['capabilities']): boolean {
    const model = this.customModels.get(id);
    return model ? model.capabilities[capability] : false;
  }

  remove(id: string): boolean {
    return this.customModels.delete(id);
  }

  clear(): void {
    this.customModels.clear();
  }

  get count(): number {
    return this.customModels.size;
  }
}

export { getBuiltInModels as listBuiltInModels, getModelsByProvider, findModel };
