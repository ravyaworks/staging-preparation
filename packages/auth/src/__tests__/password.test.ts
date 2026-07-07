import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, validatePassword, generateVerificationToken } from '../password';

describe('hashPassword / comparePassword', () => {
  it('hashes a password and compares correctly', async () => {
    const password = 'TestPass123!';
    const hash = await hashPassword(password);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);

    const match = await comparePassword(password, hash);
    expect(match).toBe(true);

    const noMatch = await comparePassword('wrong-password', hash);
    expect(noMatch).toBe(false);
  });
});

describe('validatePassword', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const result = validatePassword('Ab1!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('8 characters');
  });

  it('rejects passwords longer than 128 characters', () => {
    const longPwd = 'A1' + 'a'.repeat(130);
    const result = validatePassword(longPwd);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('128 characters');
  });

  it('rejects passwords without an uppercase letter', () => {
    const result = validatePassword('lowercase1!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('uppercase');
  });

  it('rejects passwords without a lowercase letter', () => {
    const result = validatePassword('UPPERCASE1!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('lowercase');
  });

  it('rejects passwords without a number', () => {
    const result = validatePassword('NoNumber!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('number');
  });

  it('accepts a valid password', () => {
    const result = validatePassword('ValidPass1');
    expect(result.isValid).toBe(true);
  });
});

describe('generateVerificationToken', () => {
  it('generates a 48-character token', () => {
    const token = generateVerificationToken();
    expect(token).toHaveLength(48);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateVerificationToken()));
    expect(tokens.size).toBe(10);
  });
});
