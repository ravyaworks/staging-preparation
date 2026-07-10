import type { PromptTemplate, PromptCompileOptions, CompiledPrompt, PromptVariable, PromptRole } from './types';
import { PromptError } from './types';

export function createTemplate(params: {
  id: string;
  name: string;
  description?: string;
  role?: PromptRole;
  content: string;
  variables?: PromptVariable[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}): PromptTemplate {
  return {
    id: params.id,
    name: params.name,
    description: params.description,
    role: params.role ?? 'user',
    content: params.content,
    variables: params.variables ?? [],
    version: 1,
    tags: params.tags ?? [],
    metadata: params.metadata,
  };
}

export function compileTemplate(template: PromptTemplate, options: PromptCompileOptions): CompiledPrompt {
  const { variables, onMissing = 'throw' } = options;
  const usedVariables: string[] = [];

  let content = template.content;
  const definedVars = new Set(template.variables.map(v => v.name));

  if (template.variables.length > 0) {
    for (const v of template.variables) {
      const value = variables[v.name] ?? v.defaultValue;
      if (value === undefined && v.required) {
        if (onMissing === 'throw') {
          throw new PromptError('MISSING_VARIABLE', `Required variable '${v.name}' is missing`);
        }
        if (onMissing === 'empty') {
          content = content.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), '');
        }
        continue;
      }
      if (value !== undefined) {
        content = content.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), value);
        usedVariables.push(v.name);
      }
    }
  }

  const allVariables = content.match(/\{\{(\w+)\}\}/g);
  if (allVariables) {
    for (const match of allVariables) {
      const name = match.replace(/\{\{|\}\}/g, '');
      const value = variables[name];
      if (value === undefined && onMissing === 'throw') {
        throw new PromptError('MISSING_VARIABLE', `Undefined variable '${name}' found in content`);
      }
      if (value !== undefined) {
        content = content.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), value);
        if (!usedVariables.includes(name)) usedVariables.push(name);
      }
    }
  }

  return {
    role: template.role,
    content,
    templateId: template.id,
    version: template.version,
    usedVariables,
  };
}

export function incrementVersion(template: PromptTemplate): PromptTemplate {
  return { ...template, version: template.version + 1 };
}
