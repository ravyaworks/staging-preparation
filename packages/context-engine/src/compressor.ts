import type { MessageContext, CompositeContext, ConfigContext } from './types';

export function compressMessages(messages: MessageContext[], maxTokens: number, estimateTokens: (text: string) => number = (t) => Math.ceil(t.length / 4)): MessageContext[] {
  if (messages.length === 0) return [];
  let total = 0;
  const result: MessageContext[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!;
    const tokens = estimateTokens(msg.content);
    if (total + tokens > maxTokens && result.length > 0) break;
    total += tokens;
    result.unshift(msg);
  }
  if (result.length === 0 && messages.length > 0) {
    return [messages[messages.length - 1]!];
  }
  return result;
}

export function summarizeContext(context: CompositeContext): string {
  const parts: string[] = [];
  parts.push(`Conversation: ${context.conversation.title ?? context.conversation.conversationId}`);
  parts.push(`Tenant: ${context.tenant.name} (${context.tenant.slug})`);
  if (context.user) parts.push(`User: ${context.user.firstName} ${context.user.lastName} (${context.user.email})`);
  if (context.business) parts.push(`Business: ${context.business.businessName ?? 'N/A'}`);
  if (context.config) parts.push(`Model: ${context.config.model ?? 'default'}`);
  parts.push(`Messages: ${context.messages.length}`);
  return parts.join(' | ');
}

export function calculateTokenBudget(context: CompositeContext, maxContextTokens: number, responseTokens: number): number {
  return maxContextTokens - responseTokens;
}
