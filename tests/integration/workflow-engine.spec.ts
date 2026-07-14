import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowEngine, WorkflowDefinition, WorkflowStep, StepType, WorkflowContext, WorkflowStatus } from '@conversation-platform/workflow-engine';

const sampleWorkflow: WorkflowDefinition = { id: 'wf-order-fulfillment', name: 'Order Fulfillment', description: 'Handles order processing from inquiry to delivery', version: '1.0.0', enabled: true, trigger: { event: 'order.created', conditions: [] }, steps: [
  { id: 'validate-order', type: 'condition' as StepType, name: 'Validate Order', config: { expression: 'order.amount > 0' }, retry: { maxAttempts: 3, backoffMs: 1000 }, onSuccess: 'process-payment', onFailure: 'reject-order' },
  { id: 'process-payment', type: 'action' as StepType, name: 'Process Payment', config: { action: 'payment.process', params: {} }, retry: { maxAttempts: 3, backoffMs: 2000 }, timeoutMs: 30000, onSuccess: 'send-confirmation', onFailure: 'payment-failed' },
  { id: 'send-confirmation', type: 'notification' as StepType, name: 'Send Confirmation', config: { channel: 'whatsapp', template: 'order_confirmation' }, onSuccess: null, onFailure: null },
  { id: 'reject-order', type: 'notification' as StepType, name: 'Reject Order', config: { channel: 'whatsapp', template: 'order_rejected' }, onSuccess: null, onFailure: null },
  { id: 'payment-failed', type: 'notification' as StepType, name: 'Payment Failed', config: { channel: 'whatsapp', template: 'payment_failed' }, onSuccess: null, onFailure: null },
] };

describe('Workflow Engine Integration', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  describe('Workflow Registration', () => {
    it('should register a workflow', () => {
      engine.register(sampleWorkflow);
      expect(engine.get('wf-order-fulfillment')).toBeDefined();
    });

    it('should list all registered workflows', () => {
      engine.register(sampleWorkflow);
      engine.register({ ...sampleWorkflow, id: 'wf-support-triage' });
      expect(engine.list().length).toBe(2);
    });

    it('should unregister a workflow', () => {
      engine.register(sampleWorkflow);
      engine.unregister('wf-order-fulfillment');
      expect(engine.get('wf-order-fulfillment')).toBeUndefined();
    });
  });

  describe('Workflow Execution', () => {
    beforeEach(() => { engine.register(sampleWorkflow); });

    it('should start a workflow execution', async () => {
      const execution = await engine.start('wf-order-fulfillment', { order: { amount: 100, currency: 'USD' } });
      expect(execution.id).toBeDefined();
      expect(execution.status).toBe('running');
    });

    it('should execute all steps successfully', async () => {
      const execution = await engine.execute('wf-order-fulfillment', { order: { amount: 100 } });
      expect(execution.status).toBe('completed');
      expect(execution.steps[0].status).toBe('completed');
    });

    it('should follow failure path when condition fails', async () => {
      const execution = await engine.execute('wf-order-fulfillment', { order: { amount: -1 } });
      expect(execution.status).toBe('rejected');
      const executedStepIds = execution.steps.filter((s) => s.status === 'completed').map((s) => s.stepId);
      expect(executedStepIds).toContain('reject-order');
      expect(executedStepIds).not.toContain('process-payment');
    });

    it('should handle step timeouts', async () => {
      const workflowWithTimeout = { ...sampleWorkflow, steps: sampleWorkflow.steps.map((s) => s.id === 'process-payment' ? { ...s, timeoutMs: 1 } : s) };
      const altEngine = new WorkflowEngine();
      altEngine.register(workflowWithTimeout);
      const execution = await altEngine.execute('wf-order-fulfillment', { order: { amount: 100 } });
      const paymentStep = execution.steps.find((s) => s.stepId === 'process-payment');
      expect(paymentStep?.status).toBe('failed');
    });
  });

  describe('Parallel Execution', () => {
    const parallelWorkflow: WorkflowDefinition = { id: 'wf-parallel', name: 'Parallel Processing', description: 'Executes steps in parallel', version: '1.0.0', enabled: true, trigger: { event: 'data.ready', conditions: [] }, steps: [
      { id: 'fan-out', type: 'parallel' as StepType, name: 'Fan Out', config: { branches: ['process-a', 'process-b', 'process-c'] }, retry: { maxAttempts: 1, backoffMs: 0 }, onSuccess: 'merge', onFailure: null },
      { id: 'process-a', type: 'action' as StepType, name: 'Process A', config: { action: 'data.process', params: { stream: 'A' } }, retry: { maxAttempts: 1, backoffMs: 0 }, onSuccess: null, onFailure: null },
      { id: 'process-b', type: 'action' as StepType, name: 'Process B', config: { action: 'data.process', params: { stream: 'B' } }, retry: { maxAttempts: 1, backoffMs: 0 }, onSuccess: null, onFailure: null },
      { id: 'process-c', type: 'action' as StepType, name: 'Process C', config: { action: 'data.process', params: { stream: 'C' } }, retry: { maxAttempts: 1, backoffMs: 0 }, onSuccess: null, onFailure: null },
      { id: 'merge', type: 'action' as StepType, name: 'Merge Results', config: { action: 'data.merge', params: {} }, retry: { maxAttempts: 1, backoffMs: 0 }, onSuccess: null, onFailure: null },
    ] };

    it('should execute parallel branches', async () => {
      const pe = new WorkflowEngine();
      pe.register(parallelWorkflow);
      const execution = await pe.execute('wf-parallel', {});
      expect(execution.status).toBe('completed');
    });
  });
});
