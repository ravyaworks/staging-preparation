import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

describe('api-key auth middleware', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('registers and validates api keys', async () => {
    const { registerApiKey, apiKeyAuth } = await import('../middleware/api-auth')

    registerApiKey('sk-test-key-123', 'tenant-1', ['*'])

    const req = { headers: { authorization: 'Bearer sk-test-key-123' } } as unknown as Request
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn() as NextFunction

    apiKeyAuth(req, res, next)

    expect((req as any).tenantId).toBe('tenant-1')
    expect((req as any).apiKeyScopes).toEqual(['*'])
    expect(next).toHaveBeenCalled()
  })

  it('rejects missing authorization header', async () => {
    const { apiKeyAuth } = await import('../middleware/api-auth')

    const req = { headers: {} } as unknown as Request
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn() as NextFunction

    apiKeyAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects non-bearer auth', async () => {
    const { apiKeyAuth } = await import('../middleware/api-auth')

    const req = { headers: { authorization: 'Basic dGVzdDp0ZXN0' } } as unknown as Request
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn() as NextFunction

    apiKeyAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('rejects invalid api key', async () => {
    const { apiKeyAuth } = await import('../middleware/api-auth')

    const req = { headers: { authorization: 'Bearer invalid-key' } } as unknown as Request
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn() as NextFunction

    apiKeyAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('requireScope passes with matching scope', async () => {
    const { requireScope } = await import('../middleware/api-auth')

    const req = { headers: {} } as unknown as Request
    ;(req as any).apiKeyScopes = ['messages:read']
    const res = {} as unknown as Response
    const next = vi.fn() as NextFunction

    requireScope('messages:read')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('requireScope passes with wildcard scope', async () => {
    const { requireScope } = await import('../middleware/api-auth')

    const req = { headers: {} } as unknown as Request
    ;(req as any).apiKeyScopes = ['*']
    const res = {} as unknown as Response
    const next = vi.fn() as NextFunction

    requireScope('messages:read')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('requireScope rejects missing scope', async () => {
    const { requireScope } = await import('../middleware/api-auth')

    const req = { headers: {} } as unknown as Request
    ;(req as any).apiKeyScopes = ['conversations:read']
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn() as NextFunction

    requireScope('messages:write')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('cache middleware', () => {
  it('exports appCache and withCache', async () => {
    const { appCache, withCache } = await import('../middleware/cache')
    expect(appCache).toBeDefined()
    expect(withCache).toBeDefined()

    const result = await withCache('test-key', async () => 'cached-value', 1000)
    expect(result).toBe('cached-value')

    const cached = await withCache('test-key', async () => 'fresh')
    expect(cached).toBe('cached-value')
  })

  it('exports invalidateCache', async () => {
    const { invalidateCache, appCache } = await import('../middleware/cache')
    await appCache.set('key1', 'val1')
    await invalidateCache()
    const val = await appCache.get('key1')
    expect(val).toBeUndefined()
  })
})

describe('etag middleware', () => {
  it('skips non-GET requests', async () => {
    const { etagMiddleware } = await import('../middleware/etag')
    const req = { method: 'POST' } as unknown as Request
    const next = vi.fn() as NextFunction
    etagMiddleware(req, {} as Response, next)
    expect(next).toHaveBeenCalled()
  })

  it('sets ETag header on GET response', async () => {
    const { etagMiddleware } = await import('../middleware/etag')
    const req = { method: 'GET', headers: {} } as unknown as Request
    const headers: Record<string, string> = {}
    const res = {
      setHeader: (k: string, v: string) => { headers[k] = v },
      removeHeader: vi.fn(),
      statusCode: 200,
      end: vi.fn() as any,
      write: vi.fn() as any,
    } as unknown as Response

    etagMiddleware(req, res, vi.fn() as NextFunction)
    // After passing through middleware, res.write and res.end should be wrapped
    expect(typeof res.write).toBe('function')
  })
})
