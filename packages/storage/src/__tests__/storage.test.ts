import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageProvider } from '../index';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('LocalStorageProvider', () => {
  const testDir = path.join(os.tmpdir(), `storage-test-${Date.now()}`);

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('uploads a file buffer', async () => {
    const provider = new LocalStorageProvider({ basePath: testDir, baseUrl: '/uploads' });
    const result = await provider.upload(Buffer.from('test content'), {
      filename: 'test.txt',
      mimeType: 'text/plain',
      size: 12,
    });

    expect(result.id).toBeTruthy();
    expect(result.size).toBe(12);
    expect(result.mimeType).toBe('text/plain');
    expect(result.originalName).toBe('test.txt');
    expect(result.provider).toBe('local');
    expect(result.path).toMatch(/\.txt$/);

    const filePath = path.join(testDir, result.path);
    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('test content');
  });

  it('checks file existence', async () => {
    const provider = new LocalStorageProvider({ basePath: testDir });
    const result = await provider.upload(Buffer.from('data'), {
      filename: 'exists.txt',
      mimeType: 'text/plain',
      size: 4,
    });

    const exists = await provider.exists(result.path);
    expect(exists).toBe(true);

    const notExists = await provider.exists('nonexistent.txt');
    expect(notExists).toBe(false);
  });

  it('deletes a file', async () => {
    const provider = new LocalStorageProvider({ basePath: testDir });
    const result = await provider.upload(Buffer.from('delete me'), {
      filename: 'delete.txt',
      mimeType: 'text/plain',
      size: 9,
    });

    const deleteResult = await provider.delete(result.path);
    expect(deleteResult.success).toBe(true);

    const exists = await provider.exists(result.path);
    expect(exists).toBe(false);
  });

  it('returns a URL for a path', async () => {
    const provider = new LocalStorageProvider({ basePath: testDir, baseUrl: '/files' });
    const url = await provider.getUrl('abc123.txt');
    expect(url).toBe('/files/abc123.txt');
  });
});
