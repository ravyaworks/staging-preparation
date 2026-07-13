export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'image' | 'document' | 'video' | 'audio' | 'template' | 'interactive' | 'location' | 'contacts' | 'sticker' | 'system';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ConversationStatus = 'active' | 'waiting' | 'resolved' | 'closed' | 'spam';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export interface NormalizedAttachment {
  id: string;
  type: string;
  url?: string;
  mimeType?: string;
  filename?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

export interface NormalizedMessage {
  id: string;
  channel: string;
  channelMessageId: string;
  direction: MessageDirection;
  messageType: MessageType;
  content: string;
  attachments: NormalizedAttachment[];
  sender: {
    id: string;
    phone?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
  recipient: {
    id: string;
    phone?: string;
  };
  metadata: Record<string, unknown>;
  timestamp: Date;
  raw?: Record<string, unknown>;
}

export interface IdentityResult {
  contactId: string;
  isNew: boolean;
  contact: {
    id: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
  };
}

export interface ConversationResult {
  conversationId: string;
  isNew: boolean;
  conversation: {
    id: string;
    status: string;
    priority: string;
    channel: string;
    contactId?: string | null;
    assignedToId?: string | null;
    isAiEnabled: boolean;
    isHumanHandoff: boolean;
  };
}

export interface ChannelInfo {
  channelType: string;
  channelId: string;
  channelName: string;
  isActive: boolean;
}

export interface IncomingChannelAdapter {
  readonly channelInfo: ChannelInfo;
  normalize(payload: Record<string, unknown>): NormalizedMessage;
  validate(payload: Record<string, unknown>): boolean;
}

export interface PipelineContext {
  tenantId: string;
  normalizedMessage: NormalizedMessage;
  identity: IdentityResult;
  conversation: ConversationResult;
  metadata: Record<string, unknown>;
  startedAt: Date;
}

export interface PipelineResult {
  success: boolean;
  context: PipelineContext;
  aiResponse?: {
    content: string;
    provider: string;
    model: string;
    tokenCount: number;
    latency: number;
  };
  workflowResults?: Array<{
    workflowId: string;
    status: string;
    output?: Record<string, unknown>;
  }>;
  outboundMessageId?: string;
  error?: string;
  totalLatency: number;
}

export interface ConversationFilter {
  tenantId: string;
  status?: string;
  channel?: string;
  priority?: string;
  assignedToId?: string;
  contactId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HumanHandoffRequest {
  conversationId: string;
  assignedToId: string;
  assignedByName: string;
  reason?: string;
}

export interface ConversationNote {
  id: string;
  conversationId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}
