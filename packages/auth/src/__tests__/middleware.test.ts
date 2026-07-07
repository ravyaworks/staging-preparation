import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createJwtHandler } from '../jwt';
import { authenticate, optionalAuth, requireRole, extractTenantId } from '../middleware';

function mockReq(headers: Record<string, string> = {}): Request & { auth?: unknown; tenantId?: string } {
  return { headers } as unknown as Request & { auth?: unknown; tenantId?: string };
}

function mockRes(): Response {
  return {} as Response;
}

function mockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

describe('authenticate', () => {
  const jwtConfig = {
    secret: 'test-secret-that-is-at-least-32-characters-long!!',
    expiresIn: 900,
    refreshSecret: 'test-refresh-secret-at-least-32-characters!!',
    refreshExpiresIn: 604800,
    issuer: 'test',
  };

  it('calls next with error when no auth header', () => {
    const req = mockReq();
    const next = mockNext();
    authenticate(jwtConfig)(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(new Error('Authentication required'));
  });

  it('calls next with error when auth header is not Bearer', () => {
    const req = mockReq({ authorization: 'Basic token' });
    const next = mockNext();
    authenticate(jwtConfig)(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(new Error('Authentication required'));
  });

  it('calls next with error on invalid token', () => {
    const req = mockReq({ authorization: 'Bearer invalid-token' });
    const next = mockNext();
    authenticate(jwtConfig)(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(new Error('Invalid or expired token'));
  });

  it('calls next without error on valid token', () => {
    const jwt = createJwtHandler(jwtConfig);
    const token = jwt.signAccessToken({ sub: 'user-1', tenantId: 'tenant-1', email: 'a@b.com', role: 'admin' });

    const req = mockReq({ authorization: `Bearer ${token}` });
    const next = mockNext();
    authenticate(jwtConfig)(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('optionalAuth', () => {
  const jwtConfig = {
    secret: 'test-secret-that-is-at-least-32-characters-long!!',
    expiresIn: 900,
    refreshSecret: 'test-refresh-secret-at-least-32-characters!!',
    refreshExpiresIn: 604800,
    issuer: 'test',
  };

  it('calls next without error when no auth header', () => {
    const req = mockReq();
    const next = mockNext();
    optionalAuth(jwtConfig)(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next without error on invalid token', () => {
    const req = mockReq({ authorization: 'Bearer invalid-token' });
    const next = mockNext();
    optionalAuth(jwtConfig)(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('attaches auth on valid token', () => {
    const jwt = createJwtHandler(jwtConfig);
    const token = jwt.signAccessToken({ sub: 'user-1', tenantId: 'tenant-1', email: 'a@b.com', role: 'admin' });

    const req = mockReq({ authorization: `Bearer ${token}` }) as Request & { auth?: unknown };
    const next = mockNext();
    optionalAuth(jwtConfig)(req, mockRes(), next);
    expect((req as Request & { auth?: unknown }).auth).toBeTruthy();
  });
});

describe('requireRole', () => {
  it('calls next with error when no auth context', () => {
    const req = mockReq();
    const next = mockNext();
    requireRole('admin')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(new Error('Authentication required'));
  });

  it('calls next with error when role does not match', () => {
    const req = mockReq() as Request & { auth?: { role: string } };
    req.auth = { role: 'member' };
    const next = mockNext();
    requireRole('admin')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(new Error('Insufficient permissions'));
  });

  it('calls next without error when role matches', () => {
    const req = mockReq() as Request & { auth?: { role: string } };
    req.auth = { role: 'admin' };
    const next = mockNext();
    requireRole('admin')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('extractTenantId', () => {
  it('extracts tenant id from header', () => {
    const req = mockReq({ 'x-tenant-id': 'tenant-123' }) as Request & { tenantId?: string };
    const next = mockNext();
    extractTenantId()(req, mockRes(), next);
    expect(req.tenantId).toBe('tenant-123');
  });

  it('calls next without error', () => {
    const req = mockReq();
    const next = mockNext();
    extractTenantId()(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
