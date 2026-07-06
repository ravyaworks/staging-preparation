export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function delay<T>(ms: number, value: T): Promise<T> {
  return sleep(ms).then(() => value);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str: string, maxLength: number, ellipsis = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function generateId(length = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    const index = array[i]! % chars.length;
    result += chars[index] as string;
  }
  return result;
}

export function maskValue(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) return value;
  return value.slice(0, visibleChars).padEnd(value.length, '*');
}

export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
}

export function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 100, maxDelayMs = 10000 } = options;

  async function attempt(remaining: number): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (remaining <= 0) throw error;
      const delayMs = Math.min(baseDelayMs * Math.pow(2, maxRetries - remaining), maxDelayMs);
      await sleep(delayMs + Math.random() * 100);
      return attempt(remaining - 1);
    }
  }

  return attempt(maxRetries);
}
