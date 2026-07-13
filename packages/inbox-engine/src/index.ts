export type {
  NormalizedMessage,
  NormalizedAttachment,
  IdentityResult,
  ConversationResult,
  ChannelInfo,
  IncomingChannelAdapter,
  PipelineContext,
  PipelineResult,
  MessageDirection,
  MessageType,
  ConversationPriority,
  ConversationStatus,
  MessageStatus,
  ConversationFilter,
  HumanHandoffRequest,
  ConversationNote,
} from './types';

export { createNormalizedMessage, createAttachment } from './models/normalized-message';
export { createChannelAdapter } from './adapter';
export type { IncomingPipeline } from './pipeline/orchestrator';
export { createIncomingPipeline } from './pipeline/orchestrator';
export type { IdentityResolver } from './pipeline/identity-resolver';
export { createIdentityResolver } from './pipeline/identity-resolver';
export type { ConversationResolver } from './pipeline/conversation-resolver';
export { createConversationResolver } from './pipeline/conversation-resolver';
export type { MessagePersister } from './pipeline/message-persister';
export { createMessagePersister } from './pipeline/message-persister';
export type { WorkflowIntegrator } from './pipeline/workflow-integrator';
export { createWorkflowIntegrator } from './pipeline/workflow-integrator';
export type { AIIntegrator } from './pipeline/ai-integrator';
export { createAIIntegrator } from './pipeline/ai-integrator';
export type { ResponseGenerator } from './pipeline/response-generator';
export { createResponseGenerator } from './pipeline/response-generator';
export type { HumanHandoffService } from './services/human-handoff.service';
export { createHumanHandoffService } from './services/human-handoff.service';
export type { ContactService } from './services/contact.service';
export { createContactService } from './services/contact.service';
export type { ConversationService } from './services/conversation.service';
export { createConversationService } from './services/conversation.service';
