import type {
  IncomingMessage,
  OutgoingMessage,
  ChannelMessageContent,
  ChannelMessageType,
  ChannelMessageAttachment,
  ChannelMessageButton,
  ChannelMessageListOption,
  ChannelQuickReply,
  ChannelLocation,
  ChannelContact,
  ChannelMessageMetadata,
  ChannelUserContext,
  ChannelConversationContext,
  ChannelTenantContext,
  ChannelType,
} from './types'

let messageCounter = 0

function generateId(): string {
  messageCounter += 1
  return `msg_${Date.now()}_${messageCounter}`
}

export function createIncomingMessage(params: {
  type?: ChannelMessageType
  content?: Partial<ChannelMessageContent>
  attachments?: ChannelMessageAttachment[]
  buttons?: ChannelMessageButton[]
  listOptions?: ChannelMessageListOption[]
  quickReplies?: ChannelQuickReply[]
  location?: ChannelLocation
  contact?: ChannelContact
  metadata: Partial<ChannelMessageMetadata> & { channelType: ChannelType }
  user: ChannelUserContext
  conversation: ChannelConversationContext
  tenant: ChannelTenantContext
  raw?: Record<string, unknown>
}): IncomingMessage {
  const messageType = params.type ?? 'text'
  return {
    id: generateId(),
    type: messageType,
    content: {
      type: messageType,
      ...params.content,
    },
    attachments: params.attachments ?? [],
    buttons: params.buttons ?? [],
    listOptions: params.listOptions ?? [],
    quickReplies: params.quickReplies ?? [],
    location: params.location,
    contact: params.contact,
    metadata: {
      messageId: generateId(),
      conversationId: '',
      timestamp: new Date().toISOString(),
      source: 'user',
      ...params.metadata,
    },
    user: params.user,
    conversation: params.conversation,
    tenant: params.tenant,
    raw: params.raw,
  }
}

export function createOutgoingMessage(params: {
  type?: ChannelMessageType
  content?: Partial<ChannelMessageContent>
  attachments?: ChannelMessageAttachment[]
  buttons?: ChannelMessageButton[]
  listOptions?: ChannelMessageListOption[]
  quickReplies?: ChannelQuickReply[]
  location?: ChannelLocation
  contact?: ChannelContact
  metadata: Partial<ChannelMessageMetadata> & { channelType: ChannelType }
  user: ChannelUserContext
  conversation: ChannelConversationContext
  tenant: ChannelTenantContext
  customization?: Record<string, unknown>
}): OutgoingMessage {
  const messageType = params.type ?? 'text'
  return {
    id: generateId(),
    type: messageType,
    content: {
      type: messageType,
      ...params.content,
    },
    attachments: params.attachments ?? [],
    buttons: params.buttons ?? [],
    listOptions: params.listOptions ?? [],
    quickReplies: params.quickReplies ?? [],
    location: params.location,
    contact: params.contact,
    metadata: {
      messageId: generateId(),
      conversationId: '',
      timestamp: new Date().toISOString(),
      source: 'bot',
      ...params.metadata,
    },
    user: params.user,
    conversation: params.conversation,
    tenant: params.tenant,
    customization: params.customization,
  }
}

export function isTextContent(content: ChannelMessageContent): boolean {
  return content.type === 'text' && content.text !== undefined
}

export function isAttachmentContent(content: ChannelMessageContent): boolean {
  return ['image', 'document', 'audio', 'video', 'file'].includes(content.type)
}
