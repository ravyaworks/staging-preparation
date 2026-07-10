import type { PromptTemplate } from './types';

export function validateTemplate(template: PromptTemplate): string[] {
  const errors: string[] = [];
  if (!template.id) errors.push('Template ID is required');
  if (!template.name) errors.push('Template name is required');
  if (!template.content) errors.push('Template content is required');
  if (template.content && !template.content.trim()) errors.push('Template content cannot be empty');
  if (template.variables) {
    const names = new Set<string>();
    for (const v of template.variables) {
      if (!v.name) errors.push('Variable name is required');
      if (names.has(v.name)) errors.push(`Duplicate variable name: ${v.name}`);
      names.add(v.name);
    }
  }
  return errors;
}

export function validateCompiledContent(content: string): string[] {
  const errors: string[] = [];
  const unresolved = content.match(/\{\{\w+\}\}/g);
  if (unresolved) {
    errors.push(`Unresolved variables: ${unresolved.join(', ')}`);
  }
  return errors;
}
