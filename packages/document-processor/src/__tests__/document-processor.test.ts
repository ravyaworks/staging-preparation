import { describe, it, expect } from 'vitest';
import { DocumentProcessor } from '../index';

describe('DocumentProcessor', () => {
  it('process basic text document', () => {
    const proc = new DocumentProcessor({ chunking: { chunkSize: 10, chunkOverlap: 2, minChunkSize: 5 } });
    const result = proc.process('Hello world', 'txt', 'Test');
    expect(result.title).toBe('Test');
    expect(result.format).toBe('txt');
    expect(result.metadata.wordCount).toBe(2);
    expect(result.chunks.length).toBeGreaterThanOrEqual(1);
  });

  it('process generates checksum', () => {
    const proc = new DocumentProcessor();
    const r1 = proc.process('Hello', 'txt');
    const r2 = proc.process('Hello', 'txt');
    expect(r1.checksum).toBe(r2.checksum);
    const r3 = proc.process('World', 'txt');
    expect(r1.checksum).not.toBe(r3.checksum);
  });

  it('process creates chunks from long content', () => {
    const proc = new DocumentProcessor({ chunking: { chunkSize: 10, chunkOverlap: 2, minChunkSize: 5 } });
    const content = Array(50).fill('word').join(' ');
    const result = proc.process(content, 'txt');
    expect(result.chunks.length).toBeGreaterThan(1);
  });

  it('validate returns errors for empty content', () => {
    const proc = new DocumentProcessor();
    const result = proc.validate('', 'txt');
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('EMPTY_CONTENT');
  });

  it('validate detects invalid JSON', () => {
    const proc = new DocumentProcessor();
    const result = proc.validate('{invalid json}', 'json');
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('INVALID_JSON');
  });

  it('validate passes valid JSON', () => {
    const proc = new DocumentProcessor();
    const result = proc.validate('{"key": "value"}', 'json');
    expect(result.valid).toBe(true);
  });

  it('detectLanguage returns en for ASCII', () => {
    const proc = new DocumentProcessor();
    expect(proc.detectLanguage('Hello world')).toBe('en');
  });
});
