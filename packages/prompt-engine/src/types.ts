export type PromptRole = 'system' | 'developer' | 'user' | 'assistant';

export interface PromptVariable {
  name: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  role: PromptRole;
  content: string;
  variables: PromptVariable[];
  version: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface PromptCompileOptions {
  variables: Record<string, string>;
  onMissing?: 'throw' | 'skip' | 'empty';
}

export interface CompiledPrompt {
  role: PromptRole;
  content: string;
  templateId: string;
  version: number;
  usedVariables: string[];
}

export interface PromptHistoryEntry {
  promptId: string;
  version: number;
  compiledContent: string;
  timestamp: Date;
  variables: Record<string, string>;
}

export class PromptError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PromptError';
    this.code = code;
  }
}
