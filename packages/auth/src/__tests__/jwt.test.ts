import { describe, it, expect } from 'vitest';
import { createJwtHandler } from '../jwt';

describe('createJwtHandler', () => {
  const config = {
    secret: 'test-secret-that-is-at-least-32-characters-long!!',
    expiresIn: 900,
    refreshSecret: 'test-refresh-secret-at-least-32-characters!!',
    refreshExpiresIn: 604800,
    issuer: 'test-issuer',
  };

  const payload = { sub: 'user-1', tenantId: 'tenant-1', email: 'test@test.com', role: 'admin' };

  it('signs and verifies an access token', () => {
    const jwt = createJwtHandler(config);
    const token = jwt.signAccessToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const decoded = jwt.verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.tenantId).toBe('tenant-1');
    expect(decoded.email).toBe('test@test.com');
    expect(decoded.type).toBe('access');
  });

  it('signs and verifies a refresh token', () => {
    const jwt = createJwtHandler(config);
    const token = jwt.signRefreshToken(payload);
    expect(token).toBeTruthy();

    const decoded = jwt.verifyRefreshToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.type).toBe('refresh');
  });

  it('throws on invalid access token', () => {
    const jwt = createJwtHandler(config);
    expect(() => jwt.verifyAccessToken('invalid-token')).toThrow();
  });

  it('generates a token pair', () => {
    const jwt = createJwtHandler(config);
    const pair = jwt.generateTokenPair(payload);
    expect(pair.accessToken).toBeTruthy();
    expect(pair.refreshToken).toBeTruthy();
    expect(pair.expiresIn).toBe(900);
  });
});
