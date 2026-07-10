export type WorkflowStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type WorkflowStepType = 'condition' | 'action' | 'trigger' | 'delay' | 'loop' | 'rule';
export type WorkflowExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  version: number;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  config: Record<string, unknown>;
  nextOnSuccess?: string[];
  nextOnFailure?: string[];
  maxRetries?: number;
  timeout?: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'and' | 'or' | 'not';
  value: unknown;
  conditions?: WorkflowCondition[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  condition: WorkflowCondition;
  actions: string[];
  priority: number;
  enabled: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  trigger?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  currentStepId?: string;
  stepResults: Map<string, StepResult>;
  variables: Record<string, unknown>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface StepResult {
  stepId: string;
  status: 'success' | 'failure' | 'skipped';
  output?: Record<string, unknown>;
  error?: string;
  duration: number;
  startedAt: Date;
  completedAt: Date;
}

export type WorkflowTriggerType = 'manual' | 'webhook' | 'schedule' | 'event' | 'condition';

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  type: WorkflowTriggerType;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class WorkflowEngine {
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private triggers: Map<string, WorkflowTrigger> = new Map();
  private schedules: Map<string, WorkflowSchedule> = new Map();

  // Definitions
  createDefinition(input: Omit<WorkflowDefinition, 'id' | 'version' | 'createdAt' | 'updatedAt'>): WorkflowDefinition {
    const def: WorkflowDefinition = {
      ...input,
      id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.definitions.set(def.id, def);
    return def;
  }

  getDefinition(id: string): WorkflowDefinition | undefined {
    return this.definitions.get(id);
  }

  listDefinitions(tenantId: string): WorkflowDefinition[] {
    return Array.from(this.definitions.values()).filter(d => d.tenantId === tenantId);
  }

  updateDefinition(id: string, input: Partial<Omit<WorkflowDefinition, 'id' | 'version' | 'tenantId' | 'createdAt'>>): WorkflowDefinition | undefined {
    const existing = this.definitions.get(id);
    if (!existing) return undefined;
    const updated: WorkflowDefinition = {
      ...existing,
      ...input,
      version: existing.version + 1,
      updatedAt: new Date(),
    };
    this.definitions.set(id, updated);
    return updated;
  }

  deleteDefinition(id: string): boolean {
    return this.definitions.delete(id);
  }

  // Execution
  async execute(workflowId: string, input?: Record<string, unknown>): Promise<WorkflowExecution> {
    const def = this.definitions.get(workflowId);
    if (!def) throw new Error(`Workflow definition not found: ${workflowId}`);
    if (def.status !== 'active') throw new Error(`Workflow is not active: ${def.status}`);

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      workflowId,
      status: 'running',
      input,
      stepResults: new Map(),
      variables: { ...def.variables },
      startedAt: new Date(),
      createdAt: new Date(),
    };

    this.executions.set(execution.id, execution);
    await this.executeSteps(def, execution);
    return execution;
  }

  private async executeSteps(def: WorkflowDefinition, execution: WorkflowExecution): Promise<void> {
    for (const step of def.steps) {
      execution.currentStepId = step.id;
      try {
        const result = await this.executeStep(step, execution);
        execution.stepResults.set(step.id, result);
        if (result.status === 'failure' && step.nextOnFailure) {
          const nextIds = new Set(step.nextOnFailure);
          for (const s of def.steps) {
            if (!nextIds.has(s.id)) s;
          }
        }
      } catch (error) {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        execution.completedAt = new Date();
        return;
      }
    }
    execution.status = 'completed';
    execution.completedAt = new Date();
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<StepResult> {
    const start = new Date();
    const startMs = Date.now();

    try {
      let output: Record<string, unknown> | undefined;
      switch (step.type) {
        case 'delay':
          const delayMs = (step.config.delayMs as number) ?? 0;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          break;
        case 'condition':
          output = { result: this.evaluateCondition(step.config.condition as WorkflowCondition, execution.variables) };
          break;
        case 'rule':
          const rules = step.config.rules as WorkflowRule[] ?? [];
          for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
            if (rule.enabled && this.evaluateCondition(rule.condition, execution.variables)) {
              output = { matchedRule: rule.name, actions: rule.actions };
              break;
            }
          }
          break;
        case 'action':
          output = { actionType: step.config.actionType, status: 'executed', stepName: step.name };
          break;
        case 'trigger':
          output = { triggerType: step.config.triggerType, status: 'registered' };
          break;
        case 'loop':
          const iterations = (step.config.iterations as number) ?? 1;
          const loopResults: Record<string, unknown>[] = [];
          for (let i = 0; i < iterations; i++) {
            execution.variables[`loop_index_${step.id}`] = i;
            loopResults.push({ iteration: i, status: 'completed' });
          }
          output = { iterations: iterations, results: loopResults };
          break;
      }
      return {
        stepId: step.id,
        status: 'success',
        output,
        duration: Date.now() - startMs,
        startedAt: start,
        completedAt: new Date(),
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startMs,
        startedAt: start,
        completedAt: new Date(),
      };
    }
  }

  private evaluateCondition(condition: WorkflowCondition, variables: Record<string, unknown>): boolean {
    const { field, operator, value, conditions } = condition;
    if (operator === 'and' && conditions) return conditions.every(c => this.evaluateCondition(c, variables));
    if (operator === 'or' && conditions) return conditions.some(c => this.evaluateCondition(c, variables));
    if (operator === 'not' && conditions) return !this.evaluateCondition(conditions[0]!, variables);

    const fieldValue = field.includes('.')
      ? field.split('.').reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], variables)
      : variables[field];

    switch (operator) {
      case 'eq': return fieldValue === value;
      case 'neq': return fieldValue !== value;
      case 'gt': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
      case 'gte': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;
      case 'lt': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
      case 'lte': return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;
      case 'contains': return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);
      case 'in': return Array.isArray(value) && value.includes(fieldValue);
      default: return false;
    }
  }

  // Triggers
  registerTrigger(trigger: Omit<WorkflowTrigger, 'id'>): WorkflowTrigger {
    const t: WorkflowTrigger = { ...trigger, id: `trig_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` };
    this.triggers.set(t.id, t);
    return t;
  }

  listTriggers(workflowId: string): WorkflowTrigger[] {
    return Array.from(this.triggers.values()).filter(t => t.workflowId === workflowId);
  }

  // Scheduling
  schedule(input: Omit<WorkflowSchedule, 'id'>): WorkflowSchedule {
    const s: WorkflowSchedule = { ...input, id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` };
    this.schedules.set(s.id, s);
    return s;
  }

  listSchedules(workflowId: string): WorkflowSchedule[] {
    return Array.from(this.schedules.values()).filter(s => s.workflowId === workflowId);
  }

  // Execution retrieval
  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  listExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(e => e.workflowId === workflowId);
  }

  // Recovery: rerun a failed execution
  async recover(executionId: string): Promise<WorkflowExecution | undefined> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'failed') return undefined;
    const def = this.definitions.get(execution.workflowId);
    if (!def) return undefined;
    return this.execute(def.id, execution.input);
  }

  // Metrics
  getMetrics(workflowId: string): { totalExecutions: number; completed: number; failed: number; avgDuration: number } {
    const execs = this.listExecutions(workflowId);
    const completed = execs.filter(e => e.status === 'completed');
    const failed = execs.filter(e => e.status === 'failed');
    const durations = completed
      .map(e => e.completedAt && e.startedAt ? e.completedAt.getTime() - e.startedAt.getTime() : 0)
      .filter(d => d > 0);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return { totalExecutions: execs.length, completed: completed.length, failed: failed.length, avgDuration };
  }
}
