import type { ConversationState, ConversationStatus } from './types';
import { ConversationError } from './types';

export class ConversationStateManager {
  private states = new Map<string, ConversationState>();

  initialize(conversationId: string): ConversationState {
    const state: ConversationState = {
      conversationId,
      status: 'active',
      waitingForInput: true,
      processingMessage: false,
      updatedAt: new Date(),
    };
    this.states.set(conversationId, state);
    return state;
  }

  get(conversationId: string): ConversationState | undefined {
    return this.states.get(conversationId);
  }

  getOrInitialize(conversationId: string): ConversationState {
    const existing = this.states.get(conversationId);
    if (existing) return existing;
    return this.initialize(conversationId);
  }

  setStatus(conversationId: string, status: ConversationStatus): ConversationState {
    const state = this.getOrInitialize(conversationId);
    state.status = status;
    state.updatedAt = new Date();
    return state;
  }

  setProcessing(conversationId: string, processing: boolean): void {
    const state = this.getOrInitialize(conversationId);
    state.processingMessage = processing;
    state.waitingForInput = !processing;
    state.updatedAt = new Date();
  }

  setCurrentStep(conversationId: string, step?: string): void {
    const state = this.getOrInitialize(conversationId);
    state.currentStep = step;
    state.updatedAt = new Date();
  }

  setMetadata(conversationId: string, metadata: Record<string, unknown>): void {
    const state = this.getOrInitialize(conversationId);
    state.metadata = { ...state.metadata, ...metadata };
    state.updatedAt = new Date();
  }

  remove(conversationId: string): boolean {
    return this.states.delete(conversationId);
  }

  getAll(): ConversationState[] {
    return Array.from(this.states.values());
  }

  getAllByStatus(status: ConversationStatus): ConversationState[] {
    return Array.from(this.states.values()).filter(s => s.status === status);
  }

  clear(): void {
    this.states.clear();
  }

  get count(): number {
    return this.states.size;
  }
}
