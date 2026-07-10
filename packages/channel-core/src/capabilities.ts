import type { ChannelCapability, ChannelCapabilitySet, ChannelType } from './types'

export class CapabilityRegistry {
  private capabilities = new Map<ChannelType, ChannelCapabilitySet>()

  register(type: ChannelType, caps: ChannelCapabilitySet): void {
    this.capabilities.set(type, caps)
  }

  get(type: ChannelType): ChannelCapabilitySet | undefined {
    return this.capabilities.get(type)
  }

  has(type: ChannelType, capability: ChannelCapability): boolean {
    const caps = this.get(type)
    if (!caps) return false
    return caps.incoming.includes(capability) || caps.outgoing.includes(capability)
  }

  supportsIncoming(type: ChannelType, capability: ChannelCapability): boolean {
    return this.capabilities.get(type)?.incoming.includes(capability) ?? false
  }

  supportsOutgoing(type: ChannelType, capability: ChannelCapability): boolean {
    return this.capabilities.get(type)?.outgoing.includes(capability) ?? false
  }

  list(): Map<ChannelType, ChannelCapabilitySet> {
    return new Map(this.capabilities)
  }

  unregister(type: ChannelType): boolean {
    return this.capabilities.delete(type)
  }

  clear(): void {
    this.capabilities.clear()
  }

  static readonly DEFAULT_CAPABILITIES: Record<ChannelType, ChannelCapabilitySet> = {
    website: {
      incoming: ['text', 'image', 'document', 'file', 'typing_indicator'],
      outgoing: ['text', 'image', 'document', 'file', 'typing_indicator', 'quick_reply', 'button'],
      supportsReplies: true,
      supportsThreads: false,
      supportsRichText: true,
      maxMessageLength: 4096,
      maxAttachmentSizeBytes: 25 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    },
    whatsapp: {
      incoming: ['text', 'image', 'document', 'audio', 'video', 'button', 'list', 'quick_reply', 'location', 'contact', 'typing_indicator', 'delivery_receipt', 'read_receipt'],
      outgoing: ['text', 'image', 'document', 'audio', 'video', 'button', 'list', 'quick_reply', 'location', 'contact', 'typing_indicator', 'template', 'interactive'],
      supportsReplies: true,
      supportsThreads: false,
      supportsRichText: false,
      maxMessageLength: 4096,
      maxAttachmentSizeBytes: 16 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'application/pdf', 'audio/ogg', 'audio/mpeg', 'video/mp4'],
    },
    instagram: {
      incoming: ['text', 'image', 'quick_reply'],
      outgoing: ['text', 'image', 'quick_reply'],
      supportsReplies: true,
      supportsThreads: false,
      supportsRichText: false,
      maxMessageLength: 1000,
      maxAttachmentSizeBytes: 8 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    },
    messenger: {
      incoming: ['text', 'image', 'audio', 'video', 'file', 'button', 'quick_reply', 'location', 'typing_indicator', 'delivery_receipt', 'read_receipt'],
      outgoing: ['text', 'image', 'audio', 'video', 'file', 'button', 'quick_reply', 'location', 'typing_indicator'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: false,
      maxMessageLength: 2000,
      maxAttachmentSizeBytes: 25 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4', 'application/pdf'],
    },
    telegram: {
      incoming: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'quick_reply', 'location', 'contact'],
      outgoing: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'location'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: true,
      maxMessageLength: 4096,
      maxAttachmentSizeBytes: 50 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'audio/mpeg', 'video/mp4'],
    },
    slack: {
      incoming: ['text', 'image', 'file', 'button', 'typing_indicator', 'delivery_receipt', 'thread', 'slash_command'],
      outgoing: ['text', 'image', 'file', 'button', 'typing_indicator', 'thread', 'embed'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: true,
      maxMessageLength: 40000,
      maxAttachmentSizeBytes: 100 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'text/csv'],
    },
    discord: {
      incoming: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'embed', 'slash_command'],
      outgoing: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'embed'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: true,
      maxMessageLength: 2000,
      maxAttachmentSizeBytes: 25 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'audio/mpeg', 'video/mp4', 'text/plain'],
    },
    teams: {
      incoming: ['text', 'image', 'file', 'adaptive_card'],
      outgoing: ['text', 'image', 'file', 'adaptive_card'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: true,
      maxMessageLength: 4096,
      maxAttachmentSizeBytes: 10 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    },
    email: {
      incoming: ['text', 'image', 'document', 'file'],
      outgoing: ['text', 'image', 'document', 'file'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: true,
      maxMessageLength: 1048576,
      maxAttachmentSizeBytes: 25 * 1024 * 1024,
      supportedAttachmentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'],
    },
    sms: {
      incoming: ['text', 'delivery_receipt'],
      outgoing: ['text', 'delivery_receipt'],
      supportsReplies: true,
      supportsThreads: false,
      supportsRichText: false,
      maxMessageLength: 1600,
      maxAttachmentSizeBytes: 0,
      supportedAttachmentTypes: [],
    },
    api: {
      incoming: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'list', 'quick_reply', 'location', 'contact'],
      outgoing: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'list', 'quick_reply', 'location', 'contact'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: true,
      maxMessageLength: 1048576,
      maxAttachmentSizeBytes: 100 * 1024 * 1024,
      supportedAttachmentTypes: ['*/*'],
    },
    custom: {
      incoming: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'quick_reply', 'location', 'contact'],
      outgoing: ['text', 'image', 'document', 'audio', 'video', 'file', 'button', 'quick_reply', 'location', 'contact'],
      supportsReplies: true,
      supportsThreads: true,
      supportsRichText: true,
      maxMessageLength: 1048576,
      maxAttachmentSizeBytes: 100 * 1024 * 1024,
      supportedAttachmentTypes: ['*/*'],
    },
  }
}
