import { describe, it, expect, vi } from 'vitest'

describe('Inbox Engine Pipeline', () => {
  describe('NormalizedMessage', () => {
    it('should create a normalized message with defaults', async () => {
      const { createNormalizedMessage } = await import('../models/normalized-message')
      const msg = createNormalizedMessage({
        channel: 'test',
        channelMessageId: 'test-id',
        content: 'Hello',
        sender: { id: 'sender-1', phone: '+123' },
        recipient: { id: 'recipient-1', phone: '+456' },
      })
      expect(msg.channel).toBe('test')
      expect(msg.channelMessageId).toBe('test-id')
      expect(msg.content).toBe('Hello')
      expect(msg.direction).toBe('inbound')
      expect(msg.messageType).toBe('text')
      expect(msg.attachments).toEqual([])
      expect(msg.timestamp).toBeInstanceOf(Date)
    })

    it('should create an attachment', async () => {
      const { createAttachment } = await import('../models/normalized-message')
      const att = createAttachment({
        type: 'image',
        url: 'https://example.com/img.jpg',
        mimeType: 'image/jpeg',
        filename: 'photo.jpg',
      })
      expect(att.type).toBe('image')
      expect(att.url).toBe('https://example.com/img.jpg')
      expect(att.mimeType).toBe('image/jpeg')
    })
  })

  describe('IdentityResolver', () => {
    it('should be creatable', async () => {
      const { createIdentityResolver } = await import('../pipeline/identity-resolver')
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
      const resolver = createIdentityResolver(logger)
      expect(resolver).toBeDefined()
      expect(typeof resolver.resolve).toBe('function')
    })
  })

  describe('ConversationResolver', () => {
    it('should be creatable', async () => {
      const { createConversationResolver } = await import('../pipeline/conversation-resolver')
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
      const resolver = createConversationResolver(logger)
      expect(resolver).toBeDefined()
      expect(typeof resolver.resolve).toBe('function')
    })
  })

  describe('MessagePersister', () => {
    it('should be creatable', async () => {
      const { createMessagePersister } = await import('../pipeline/message-persister')
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
      const persister = createMessagePersister(logger)
      expect(persister).toBeDefined()
      expect(typeof persister.persist).toBe('function')
    })
  })

  describe('Orchestrator', () => {
    it('should be creatable with null engines', async () => {
      const { createIncomingPipeline } = await import('../pipeline/orchestrator')
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
      const pipeline = createIncomingPipeline({
        aiEngine: null,
        workflowEngine: null,
        knowledgeEngine: null,
        conversationEngine: null,
        queueService: null,
        logger,
      })
      expect(pipeline).toBeDefined()
      expect(typeof pipeline.process).toBe('function')
    })
  })

  describe('HumanHandoffService', () => {
    it('should be creatable', async () => {
      const { createHumanHandoffService } = await import('../services/human-handoff.service')
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
      const service = createHumanHandoffService(logger)
      expect(service).toBeDefined()
      expect(typeof service.assign).toBe('function')
      expect(typeof service.release).toBe('function')
      expect(typeof service.addNote).toBe('function')
      expect(typeof service.getNotes).toBe('function')
    })
  })

  describe('ContactService', () => {
    it('should be creatable', async () => {
      const { createContactService } = await import('../services/contact.service')
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
      const service = createContactService(logger)
      expect(service).toBeDefined()
      expect(typeof service.list).toBe('function')
    })
  })

  describe('ConversationService', () => {
    it('should be creatable', async () => {
      const { createConversationService } = await import('../services/conversation.service')
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any
      const service = createConversationService(logger)
      expect(service).toBeDefined()
      expect(typeof service.list).toBe('function')
    })
  })
})
