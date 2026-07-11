import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SsoService } from '../sso-service'
import type { SsoProviderConfig } from '../types'

function createProvider(overrides: Partial<SsoProviderConfig> = {}): SsoProviderConfig {
  return {
    id: 'google-oauth',
    tenantId: 'tenant-1',
    type: 'oidc',
    label: 'Google',
    enabled: true,
    clientId: 'google-client-id',
    clientSecret: 'google-client-secret',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'email', 'profile'],
    attributeMapping: { email: 'email', name: 'name', sub: 'sub' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('SsoService', () => {
  let service: SsoService

  beforeEach(() => {
    service = new SsoService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('registerProvider / getProvider', () => {
    it('registers and retrieves an SSO provider', () => {
      const config = createProvider()
      service.registerProvider(config)
      const retrieved = service.getProvider('tenant-1', 'google-oauth')
      expect(retrieved).toBeDefined()
      expect(retrieved?.label).toBe('Google')
    })

    it('returns undefined for non-existent provider', () => {
      expect(service.getProvider('tenant-1', 'nonexistent')).toBeUndefined()
    })
  })

  describe('listProviders', () => {
    it('lists providers for a tenant', () => {
      service.registerProvider(createProvider({ id: 'p1', tenantId: 't1' }))
      service.registerProvider(createProvider({ id: 'p2', tenantId: 't1' }))
      service.registerProvider(createProvider({ id: 'p3', tenantId: 't2' }))
      expect(service.listProviders('t1')).toHaveLength(2)
      expect(service.listProviders('t2')).toHaveLength(1)
    })
  })

  describe('removeProvider', () => {
    it('removes a provider', () => {
      service.registerProvider(createProvider())
      expect(service.removeProvider('tenant-1', 'google-oauth')).toBe(true)
      expect(service.getProvider('tenant-1', 'google-oauth')).toBeUndefined()
    })
  })

  describe('initiateAuth', () => {
    it('creates auth request with state', () => {
      service.registerProvider(createProvider())
      const auth = service.initiateAuth('google-oauth', 'tenant-1', 'https://app.com/callback')
      expect(auth.providerId).toBe('google-oauth')
      expect(auth.state).toContain('sso_')
      expect(auth.redirectUri).toBe('https://app.com/callback')
    })

    it('throws for unknown provider', () => {
      expect(() => service.initiateAuth('unknown', 't1', 'https://app.com/callback'))
        .toThrow('SSO provider unknown not found')
    })

    it('throws for disabled provider', () => {
      service.registerProvider(createProvider({ enabled: false }))
      expect(() => service.initiateAuth('google-oauth', 'tenant-1', 'https://app.com/callback'))
        .toThrow('is disabled')
    })
  })

  describe('handleCallback', () => {
    it('throws for invalid state', async () => {
      await expect(service.handleCallback('invalid-state', {})).rejects.toThrow('Invalid or expired SSO state')
    })

    it('throws for expired state', async () => {
      vi.useFakeTimers()
      service.registerProvider(createProvider())
      const auth = service.initiateAuth('google-oauth', 'tenant-1', 'https://app.com/callback')
      vi.advanceTimersByTime(700_000)
      await expect(service.handleCallback(auth.state, {})).rejects.toThrow('expired')
      vi.useRealTimers()
    })

    it('handles OIDC callback with token exchange', async () => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)

      const idTokenParts = [
        Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64'),
        Buffer.from(JSON.stringify({ sub: 'google-123', email: 'user@example.com', name: 'Test User' })).toString('base64'),
        'fake-signature',
      ]
      const idToken = idTokenParts.join('.')

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id_token: idToken, access_token: 'access-token' }),
      })

      service.registerProvider(createProvider())
      const auth = service.initiateAuth('google-oauth', 'tenant-1', 'https://app.com/callback')
      const result = await service.handleCallback(auth.state, {
        code: 'auth-code',
        redirect_uri: 'https://app.com/callback',
      })

      expect(result.email).toBe('user@example.com')
      expect(result.name).toBe('Test User')
      expect(result.externalId).toBe('google-123')

      vi.unstubAllGlobals()
    })

    it('handles OIDC callback with userinfo endpoint', async () => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'access-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sub: 'google-456', email: 'user2@example.com', name: 'User Two' }),
        })

      service.registerProvider(createProvider({ tokenUrl: 'https://provider.com/token' }))
      const auth = service.initiateAuth('google-oauth', 'tenant-1', 'https://app.com/callback')
      const result = await service.handleCallback(auth.state, {
        code: 'auth-code',
        redirect_uri: 'https://app.com/callback',
      })

      expect(result.email).toBe('user2@example.com')
      expect(result.name).toBe('User Two')
      expect(result.externalId).toBe('google-456')

      vi.unstubAllGlobals()
    })
  })

  describe('cleanupExpired', () => {
    it('cleans up expired pending auths', () => {
      service.registerProvider(createProvider())
      vi.useFakeTimers()
      service.initiateAuth('google-oauth', 'tenant-1', 'https://app.com/callback')
      vi.advanceTimersByTime(700_000)
      const cleaned = service.cleanupExpired()
      expect(cleaned).toBe(1)
      vi.useRealTimers()
    })
  })
})
