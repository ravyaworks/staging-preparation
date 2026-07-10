import { describe, it, expect } from 'vitest';
import {
  sleep,
  delay,
  isPlainObject,
  isString,
  isNumber,
  isBoolean,
  isDefined,
  capitalize,
  truncate,
  generateId,
  maskValue,
  parseBoolean,
  parseNumber,
  retry,
} from '../utils';

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

describe('isString', () => {
  it('returns true for strings', () => {
    expect(isString('hello')).toBe(true);
    expect(isString('')).toBe(true);
  });

  it('returns false for non-strings', () => {
    expect(isString(42)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
  });
});

describe('isNumber', () => {
  it('returns true for numbers', () => {
    expect(isNumber(42)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-1.5)).toBe(true);
  });

  it('returns false for NaN', () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it('returns false for non-numbers', () => {
    expect(isNumber('42')).toBe(false);
    expect(isNumber(null)).toBe(false);
  });
});

describe('isBoolean', () => {
  it('returns true for booleans', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });

  it('returns false for non-booleans', () => {
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean('true')).toBe(false);
  });
});

describe('isDefined', () => {
  it('returns true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined({})).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
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

  it('only contains valid characters', () => {
    const id = generateId(1000);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('delay', () => {
  it('resolves with the provided value', async () => {
    const result = await delay(10, 'test');
    expect(result).toBe('test');
  });
});

describe('truncate', () => {
  it('returns full string when shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with default ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('truncates with custom ellipsis', () => {
    expect(truncate('hello world', 8, '..')).toBe('hello ..');
  });

  it('handles exact match without ellipsis', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('maskValue', () => {
  it('masks value with asterisks', () => {
    expect(maskValue('sk-1234567890')).toBe('sk-1*********');
  });

  it('returns full value when shorter than visible chars', () => {
    expect(maskValue('abc', 5)).toBe('abc');
  });

  it('uses default visible chars of 4', () => {
    expect(maskValue('abcdefgh', 4)).toBe('abcd****');
  });
});

describe('parseBoolean', () => {
  it('returns true for truthy strings', () => {
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('1')).toBe(true);
    expect(parseBoolean('yes')).toBe(true);
    expect(parseBoolean('y')).toBe(true);
    expect(parseBoolean('TRUE')).toBe(true);
  });

  it('returns false for falsy strings', () => {
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('0')).toBe(false);
    expect(parseBoolean('no')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(parseBoolean(undefined)).toBe(false);
  });

  it('returns false for unknown values', () => {
    expect(parseBoolean('maybe')).toBe(false);
  });
});

describe('parseNumber', () => {
  it('parses valid number strings', () => {
    expect(parseNumber('42', 0)).toBe(42);
    expect(parseNumber('3.14', 0)).toBe(3.14);
  });

  it('returns fallback for undefined', () => {
    expect(parseNumber(undefined, 10)).toBe(10);
  });

  it('returns fallback for invalid strings', () => {
    expect(parseNumber('abc', -1)).toBe(-1);
  });
});

describe('retry', () => {
  it('resolves on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('ok');
    await expect(retry(fn, { maxRetries: 3, baseDelayMs: 5 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(fn, { maxRetries: 2, baseDelayMs: 5 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects maxDelayMs cap', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const start = Date.now();
    await expect(retry(fn, { maxRetries: 2, baseDelayMs: 10000, maxDelayMs: 5 })).rejects.toThrow('fail');
    expect(Date.now() - start).toBeLessThan(500);
  });
});
