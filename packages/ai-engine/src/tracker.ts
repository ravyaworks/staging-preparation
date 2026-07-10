import type { ProviderName, ModelInfo, TokenUsage } from '@conversation-platform/provider-framework';
import type { TokenCost } from './types';
import { findModel } from '@conversation-platform/model-registry';

export function estimateCost(provider: ProviderName, modelId: string, usage: TokenUsage): TokenCost {
  let inputCost = 0;
  let outputCost = 0;
  const modelInfo = findModel(modelId);
  if (modelInfo) {
    inputCost = (usage.promptTokens / 1000) * modelInfo.pricing.inputPer1kTokens;
    outputCost = (usage.completionTokens / 1000) * modelInfo.pricing.outputPer1kTokens;
  }
  return {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    estimatedCost: inputCost + outputCost,
    currency: modelInfo?.pricing.currency ?? 'USD',
  };
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function formatCost(cost: number, currency: string = 'USD'): string {
  return `${currency} ${cost.toFixed(6)}`;
}

export class UsageTracker {
  private usages: Array<{ provider: ProviderName; model: string; cost: TokenCost; timestamp: Date }> = [];

  track(provider: ProviderName, model: string, usage: TokenUsage): TokenCost {
    const cost = estimateCost(provider, model, usage);
    this.usages.push({ provider, model, cost, timestamp: new Date() });
    return cost;
  }

  getTotalCost(): number {
    return this.usages.reduce((sum, u) => sum + u.cost.estimatedCost, 0);
  }

  getTotalTokens(): number {
    return this.usages.reduce((sum, u) => sum + u.cost.totalTokens, 0);
  }

  getProviderUsage(provider: ProviderName): typeof this.usages {
    return this.usages.filter(u => u.provider === provider);
  }

  getModelUsage(model: string): typeof this.usages {
    return this.usages.filter(u => u.model === model);
  }

  getRecent(minutes: number): typeof this.usages {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.usages.filter(u => u.timestamp.getTime() >= cutoff);
  }

  getAll(): typeof this.usages {
    return [...this.usages];
  }

  clear(): void {
    this.usages = [];
  }

  get count(): number {
    return this.usages.length;
  }
}
