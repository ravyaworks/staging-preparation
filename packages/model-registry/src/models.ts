import type { ModelInfo, ModelCapabilities, ModelPricing, ProviderName } from '@conversation-platform/provider-framework';

const defaultCapabilities: ModelCapabilities = {
  streaming: true,
  functionCalling: true,
  vision: false,
  embedding: false,
  fineTuning: false,
  jsonMode: false,
};

const basePricing: ModelPricing = { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' };

export const BUILT_IN_MODELS: ModelInfo[] = [
  // OpenAI
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', capabilities: { ...defaultCapabilities, vision: true, jsonMode: true }, contextWindow: 128000, maxOutputTokens: 16384, pricing: { inputPer1kTokens: 0.0025, outputPer1kTokens: 0.01, currency: 'USD' } },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', capabilities: { ...defaultCapabilities, vision: true, jsonMode: true }, contextWindow: 128000, maxOutputTokens: 16384, pricing: { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006, currency: 'USD' } },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'GPT-4 Turbo', capabilities: { ...defaultCapabilities, vision: true, jsonMode: true }, contextWindow: 128000, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0.01, outputPer1kTokens: 0.03, currency: 'USD' } },
  { id: 'gpt-4', provider: 'openai', name: 'GPT-4', capabilities: { ...defaultCapabilities, jsonMode: true }, contextWindow: 8192, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0.03, outputPer1kTokens: 0.06, currency: 'USD' } },
  { id: 'gpt-3.5-turbo', provider: 'openai', name: 'GPT-3.5 Turbo', capabilities: { ...defaultCapabilities, jsonMode: true }, contextWindow: 16385, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0.0005, outputPer1kTokens: 0.0015, currency: 'USD' } },

  // Anthropic
  { id: 'claude-sonnet-4-20250514', provider: 'anthropic', name: 'Claude Sonnet 4', capabilities: { ...defaultCapabilities, vision: true }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015, currency: 'USD' } },
  { id: 'claude-3-5-sonnet-20241022', provider: 'anthropic', name: 'Claude 3.5 Sonnet', capabilities: { ...defaultCapabilities, vision: true }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015, currency: 'USD' } },
  { id: 'claude-3-5-haiku-20241022', provider: 'anthropic', name: 'Claude 3.5 Haiku', capabilities: { ...defaultCapabilities, vision: true }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.0008, outputPer1kTokens: 0.004, currency: 'USD' } },
  { id: 'claude-opus-4-20250514', provider: 'anthropic', name: 'Claude Opus 4', capabilities: { ...defaultCapabilities, vision: true }, contextWindow: 200000, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.015, outputPer1kTokens: 0.075, currency: 'USD' } },

  // Google Gemini
  { id: 'gemini-2.5-pro-exp-03-25', provider: 'gemini', name: 'Gemini 2.5 Pro', capabilities: { ...defaultCapabilities, vision: true, jsonMode: true }, contextWindow: 1048576, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.00125, outputPer1kTokens: 0.01, currency: 'USD' } },
  { id: 'gemini-2.0-flash', provider: 'gemini', name: 'Gemini 2.0 Flash', capabilities: { ...defaultCapabilities, vision: true, jsonMode: true }, contextWindow: 1048576, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.0001, outputPer1kTokens: 0.0004, currency: 'USD' } },
  { id: 'gemini-1.5-pro', provider: 'gemini', name: 'Gemini 1.5 Pro', capabilities: { ...defaultCapabilities, vision: true, jsonMode: true }, contextWindow: 2097152, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.00125, outputPer1kTokens: 0.005, currency: 'USD' } },
  { id: 'gemini-1.5-flash', provider: 'gemini', name: 'Gemini 1.5 Flash', capabilities: { ...defaultCapabilities, vision: true, jsonMode: true }, contextWindow: 1048576, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.000075, outputPer1kTokens: 0.0003, currency: 'USD' } },

  // Mistral
  { id: 'mistral-large-2407', provider: 'mistral', name: 'Mistral Large', capabilities: { ...defaultCapabilities, functionCalling: true, jsonMode: true }, contextWindow: 128000, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0.002, outputPer1kTokens: 0.006, currency: 'USD' } },
  { id: 'mistral-small-2402', provider: 'mistral', name: 'Mistral Small', capabilities: { ...defaultCapabilities, functionCalling: true }, contextWindow: 32000, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0.001, outputPer1kTokens: 0.003, currency: 'USD' } },
  { id: 'mistral-nemo-2407', provider: 'mistral', name: 'Mistral Nemo', capabilities: { ...defaultCapabilities, functionCalling: true }, contextWindow: 128000, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.00015, currency: 'USD' } },

  // DeepSeek
  { id: 'deepseek-chat', provider: 'deepseek', name: 'DeepSeek V3', capabilities: { ...defaultCapabilities, jsonMode: true }, contextWindow: 65536, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.00027, outputPer1kTokens: 0.0011, currency: 'USD' } },
  { id: 'deepseek-reasoner', provider: 'deepseek', name: 'DeepSeek R1', capabilities: { streaming: true, functionCalling: false, vision: false, embedding: false, fineTuning: false, jsonMode: false }, contextWindow: 65536, maxOutputTokens: 8192, pricing: { inputPer1kTokens: 0.00055, outputPer1kTokens: 0.00219, currency: 'USD' } },

  // Ollama (local, free)
  { id: 'llama3.1:8b', provider: 'ollama', name: 'Llama 3.1 8B', capabilities: { ...defaultCapabilities, jsonMode: true }, contextWindow: 131072, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' } },
  { id: 'llama3.1:70b', provider: 'ollama', name: 'Llama 3.1 70B', capabilities: { ...defaultCapabilities, jsonMode: true }, contextWindow: 131072, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' } },
  { id: 'mistral:7b', provider: 'ollama', name: 'Mistral 7B', capabilities: { ...defaultCapabilities }, contextWindow: 32768, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' } },
  { id: 'codellama:7b', provider: 'ollama', name: 'CodeLlama 7B', capabilities: { ...defaultCapabilities }, contextWindow: 16384, maxOutputTokens: 4096, pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' } },

  // OpenRouter (aggregator, uses model-specific pricing)
  { id: 'openrouter/auto', provider: 'openrouter', name: 'OpenRouter Auto', capabilities: { ...defaultCapabilities, vision: true }, contextWindow: 128000, maxOutputTokens: 16384, pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' } },
];

export function getBuiltInModels(): ModelInfo[] {
  return [...BUILT_IN_MODELS];
}

export function getModelsByProvider(provider: ProviderName): ModelInfo[] {
  return BUILT_IN_MODELS.filter(m => m.provider === provider);
}

export function findModel(id: string): ModelInfo | undefined {
  return BUILT_IN_MODELS.find(m => m.id === id);
}

export function findModelByProvider(provider: ProviderName, id: string): ModelInfo | undefined {
  return BUILT_IN_MODELS.find(m => m.provider === provider && m.id === id);
}
