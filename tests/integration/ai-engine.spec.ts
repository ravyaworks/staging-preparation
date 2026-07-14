import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIEngine, IntentClassifier, SentimentAnalyzer, ResponseGenerator, MessageContext } from '@conversation-platform/ai-engine';

function createMockContext(overrides?: Partial<MessageContext>): MessageContext {
  return { message: overrides?.message ?? 'I want to check my order status', conversationId: overrides?.conversationId ?? 'conv-123', tenantId: overrides?.tenantId ?? 'tenant-001', userId: overrides?.userId ?? 'user-001', channel: overrides?.channel ?? 'whatsapp', language: overrides?.language ?? 'en', previousMessages: overrides?.previousMessages ?? [] };
}

describe('AI Engine Integration', () => {
  let engine: AIEngine;
  let intentClassifier: IntentClassifier;
  let sentimentAnalyzer: SentimentAnalyzer;
  let responseGenerator: ResponseGenerator;

  beforeEach(() => {
    intentClassifier = new IntentClassifier();
    sentimentAnalyzer = new SentimentAnalyzer();
    responseGenerator = new ResponseGenerator();
    engine = new AIEngine(intentClassifier, sentimentAnalyzer, responseGenerator);
  });

  describe('Intent Classification', () => {
    it('should classify order inquiry intent', async () => {
      const result = await intentClassifier.classify('Where is my order?');
      expect(result.intent).toBe('order.inquiry');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify support request intent', async () => {
      const result = await intentClassifier.classify('I need help with my account');
      expect(result.intent).toBe('support.request');
    });

    it('should classify complaint intent', async () => {
      const result = await intentClassifier.classify('This is terrible service!');
      expect(result.intent).toBe('complaint');
    });

    it('should classify greeting intent', async () => {
      const result = await intentClassifier.classify('Hi, good morning!');
      expect(result.intent).toBe('greeting');
    });

    it('should classify farewell intent', async () => {
      const result = await intentClassifier.classify('Goodbye, thanks!');
      expect(result.intent).toBe('farewell');
    });

    it('should identify entities in message', async () => {
      const result = await intentClassifier.extractEntities('My order number is ORD-12345');
      expect(result.entities).toBeDefined();
      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should detect positive sentiment', async () => {
      const result = await sentimentAnalyzer.analyze('I love this product! It is amazing.');
      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', async () => {
      const result = await sentimentAnalyzer.analyze('This is terrible and frustrating.');
      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(0);
    });

    it('should detect neutral sentiment', async () => {
      const result = await sentimentAnalyzer.analyze('The store is open from 9 to 5.');
      expect(result.sentiment).toBe('neutral');
    });
  });

  describe('Response Generation', () => {
    it('should generate a response for known intent', async () => {
      const response = await responseGenerator.generate({ intent: 'greeting', confidence: 0.95, entities: [] }, createMockContext());
      expect(response).toBeDefined();
      expect(response.text.length).toBeGreaterThan(0);
    });

    it('should generate a fallback response for unknown intent', async () => {
      const response = await responseGenerator.generate({ intent: 'unknown.intent', confidence: 0.3, entities: [] }, createMockContext());
      expect(response.fallback).toBe(true);
    });

    it('should include context in response', async () => {
      const response = await responseGenerator.generate({ intent: 'order.inquiry', confidence: 0.9, entities: [{ type: 'order_id', value: 'ORD-123', confidence: 1 }] }, createMockContext());
      expect(response.text).toContain('ORD-123');
    });

    it('should escalate high urgency conversations', async () => {
      const response = await responseGenerator.generate({ intent: 'complaint', confidence: 0.9, entities: [] }, createMockContext());
      expect(response.escalate).toBe(true);
    });
  });

  describe('AI Engine Pipeline', () => {
    it('should process a message through the full pipeline', async () => {
      const result = await engine.process(createMockContext({ message: 'I want to return my order ORD-999'}));
      expect(result.intent).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.response).toBeDefined();
    });

    it('should handle empty messages', async () => {
      expect(engine.process(createMockContext({ message: '' }))).rejects.toThrow();
    });

    it('should handle very long messages', async () => {
      const longMsg = 'A'.repeat(10000);
      const result = await engine.process(createMockContext({ message: longMsg }));
      expect(result).toBeDefined();
    });

    it('should respect language setting', async () => {
      const result = await engine.process(createMockContext({ message: 'Bonjour, comment ca va?', language: 'fr' }));
      expect(result.response).toBeDefined();
    });

    it('should maintain conversation context', async () => {
      const ctx = createMockContext({ message: 'My name is John' });
      const firstResult = await engine.process(ctx);
      ctx.previousMessages = [{ role: 'assistant', content: firstResult.response.text }];
      const secondResult = await engine.process({ ...ctx, message: 'What is my name?' });
      expect(secondResult.response.text.toLowerCase()).toContain('john');
    });
  });
});
