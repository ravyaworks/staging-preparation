import type { PromptTemplate, PromptCompileOptions, CompiledPrompt } from './types';
import { PromptError } from './types';
import { compileTemplate } from './template';

export class PromptRegistry {
  private templates = new Map<string, PromptTemplate>();
  private history: Map<string, PromptTemplate[]> = new Map();

  register(template: PromptTemplate): void {
    const existing = this.templates.get(template.id);
    if (existing) {
      if (!this.history.has(template.id)) {
        this.history.set(template.id, []);
      }
      this.history.get(template.id)!.push(existing);
    }
    this.templates.set(template.id, template);
  }

  get(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getOrThrow(id: string): PromptTemplate {
    const t = this.templates.get(id);
    if (!t) throw new PromptError('NOT_FOUND', `Prompt template '${id}' not found`);
    return t;
  }

  compile(id: string, options: PromptCompileOptions): CompiledPrompt {
    const template = this.getOrThrow(id);
    return compileTemplate(template, options);
  }

  getAll(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  findByTag(tag: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.tags.includes(tag));
  }

  getVersionHistory(id: string): PromptTemplate[] {
    return this.history.get(id) ?? [];
  }

  remove(id: string): boolean {
    return this.templates.delete(id);
  }

  clear(): void {
    this.templates.clear();
    this.history.clear();
  }

  get count(): number {
    return this.templates.size;
  }
}
