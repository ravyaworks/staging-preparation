import type { Logger } from '@conversation-platform/logger';
import type { WorkflowEngine } from '@conversation-platform/workflow-engine';
import type { PipelineContext } from '../types';

export function createWorkflowIntegrator(
  workflowEngine: WorkflowEngine | null,
  logger: Logger,
) {
  async function execute(context: PipelineContext): Promise<{
    results: Array<{ workflowId: string; status: string; output?: Record<string, unknown> }>;
  }> {
    if (!workflowEngine) {
      return { results: [] };
    }

    const results: Array<{ workflowId: string; status: string; output?: Record<string, unknown> }> = [];

    try {
      const workflowResult = await workflowEngine.execute('incoming-message', {
        tenantId: context.tenantId,
        contactId: context.identity.contactId,
        conversationId: context.conversation.conversationId,
        message: {
          content: context.normalizedMessage.content,
          messageType: context.normalizedMessage.messageType,
          channel: context.normalizedMessage.channel,
        },
        channel: context.normalizedMessage.channel,
      });

      results.push({
        workflowId: 'incoming-message',
        status: workflowResult.status,
        output: workflowResult.output as Record<string, unknown> | undefined,
      });
    } catch (error) {
      logger.warn({ error, context: context.conversation.conversationId }, 'Workflow execution failed');
      results.push({
        workflowId: 'incoming-message',
        status: 'failed',
      });
    }

    return { results };
  }

  return { execute };
}

export type WorkflowIntegrator = ReturnType<typeof createWorkflowIntegrator>;
