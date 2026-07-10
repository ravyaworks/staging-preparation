import { createTemplate } from './template';
import type { PromptTemplate, PromptRole, PromptVariable } from './types';

export class SystemPromptBuilder {
  private parts: string[] = [];

  addRole(role: string): this {
    this.parts.push(`You are a ${role}.`);
    return this;
  }

  addInstruction(instruction: string): this {
    this.parts.push(instruction);
    return this;
  }

  addConstraint(constraint: string): this {
    this.parts.push(`Constraint: ${constraint}`);
    return this;
  }

  addRule(rule: string): this {
    this.parts.push(`Rule: ${rule}`);
    return this;
  }

  addExample(input: string, output: string): this {
    this.parts.push(`Example:\nInput: ${input}\nOutput: ${output}`);
    return this;
  }

  addContext(context: string): this {
    this.parts.push(`Context: ${context}`);
    return this;
  }

  build(): string {
    return this.parts.join('\n\n');
  }

  buildTemplate(id: string, name: string, variables?: PromptVariable[], tags?: string[]): PromptTemplate {
    return createTemplate({
      id,
      name,
      role: 'system',
      content: this.build(),
      variables,
      tags,
    });
  }

  reset(): void {
    this.parts = [];
  }
}

export class UserPromptBuilder {
  private parts: string[] = [];

  addQuestion(question: string): this {
    this.parts.push(question);
    return this;
  }

  addInstruction(instruction: string): this {
    this.parts.push(instruction);
    return this;
  }

  addData(data: string): this {
    this.parts.push(`Data:\n${data}`);
    return this;
  }

  addReference(reference: string): this {
    this.parts.push(`Reference: ${reference}`);
    return this;
  }

  addContext(context: string): this {
    this.parts.push(context);
    return this;
  }

  build(): string {
    return this.parts.join('\n\n');
  }

  buildTemplate(id: string, name: string, variables?: PromptVariable[], tags?: string[]): PromptTemplate {
    return createTemplate({
      id,
      name,
      role: 'user',
      content: this.build(),
      variables,
      tags,
    });
  }

  reset(): void {
    this.parts = [];
  }
}
