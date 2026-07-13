import type { NormalizedMessage, NormalizedAttachment, MessageDirection, MessageType } from '../types';

export function createNormalizedMessage(params: {
  id?: string;
  channel: string;
  channelMessageId: string;
  direction?: MessageDirection;
  messageType?: MessageType;
  content: string;
  attachments?: NormalizedAttachment[];
  sender: { id: string; phone?: string; email?: string; name?: string; avatarUrl?: string };
  recipient: { id: string; phone?: string };
  metadata?: Record<string, unknown>;
  timestamp?: Date;
  raw?: Record<string, unknown>;
}): NormalizedMessage {
  return {
    id: params.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    channel: params.channel,
    channelMessageId: params.channelMessageId,
    direction: params.direction ?? 'inbound',
    messageType: params.messageType ?? 'text',
    content: params.content,
    attachments: params.attachments ?? [],
    sender: params.sender,
    recipient: params.recipient,
    metadata: params.metadata ?? {},
    timestamp: params.timestamp ?? new Date(),
    raw: params.raw,
  };
}

export function createAttachment(params: {
  id?: string;
  type: string;
  url?: string;
  mimeType?: string;
  filename?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}): NormalizedAttachment {
  return {
    id: params.id ?? `att-${Date.now()}`,
    type: params.type,
    url: params.url,
    mimeType: params.mimeType,
    filename: params.filename,
    size: params.size,
    metadata: params.metadata,
  };
}
