import { describe, it, expect } from 'vitest';
import { sleep, delay, isPlainObject, isString, capitalize, generateId } from '../utils';

describe('sleep', () => {
  it('resolves after the specified time', async () => {
    const start = Date.now();
    await sleep(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(5);
  });
});

describe('isPlainObject', () => {
  it('returns true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('returns false for non-plain objects', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject('string')).toBe(false);
  });
});

describe('generateId', () => {
  it('generates a string of the specified length', () => {
    expect(generateId()).toHaveLength(21);
    expect(generateId(10)).toHaveLength(10);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });
});

describe('delay', () => {
  it('resolves with the provided value', async () => {
    const result = await delay(10, 'test');
    expect(result).toBe('test');
  });
});
