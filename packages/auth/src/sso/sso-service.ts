import type { SsoProviderConfig, SsoAuthRequest, SsoCallbackResult, SsoUserProfile } from './types'
import { SsoError } from './types'

interface PendingAuth {
  providerId: string
  state: string
  tenantId: string
  redirectUri: string
  expiresAt: number
}

export class SsoService {
  private providers = new Map<string, SsoProviderConfig>()
  private pendingAuths = new Map<string, PendingAuth>()

  registerProvider(config: SsoProviderConfig): void {
    const key = `${config.tenantId}:${config.id}`
    this.providers.set(key, config)
  }

  getProvider(tenantId: string, providerId: string): SsoProviderConfig | undefined {
    return this.providers.get(`${tenantId}:${providerId}`)
  }

  listProviders(tenantId: string): SsoProviderConfig[] {
    const result: SsoProviderConfig[] = []
    for (const [key, config] of this.providers) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push(config)
      }
    }
    return result
  }

  removeProvider(tenantId: string, providerId: string): boolean {
    return this.providers.delete(`${tenantId}:${providerId}`)
  }

  initiateAuth(providerId: string, tenantId: string, redirectUri: string): SsoAuthRequest {
    const provider = this.getProvider(tenantId, providerId)
    if (!provider) throw new SsoError(`SSO provider ${providerId} not found`, 'PROVIDER_NOT_FOUND')
    if (!provider.enabled) throw new SsoError(`SSO provider ${providerId} is disabled`, 'PROVIDER_DISABLED')

    const state = `sso_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
    const authRequest: SsoAuthRequest = {
      providerId,
      redirectUri,
      state,
      tenantId,
    }

    this.pendingAuths.set(state, {
      providerId,
      state,
      tenantId,
      redirectUri,
      expiresAt: Date.now() + 600_000,
    })

    return authRequest
  }

  async handleCallback(
    state: string,
    params: Record<string, string>,
  ): Promise<SsoCallbackResult> {
    const pending = this.pendingAuths.get(state)
    if (!pending) throw new SsoError('Invalid or expired SSO state', 'INVALID_STATE')
    if (Date.now() > pending.expiresAt) {
      this.pendingAuths.delete(state)
      throw new SsoError('SSO request expired', 'EXPIRED')
    }
    this.pendingAuths.delete(state)

    const provider = this.getProvider(pending.tenantId, pending.providerId)
    if (!provider) throw new SsoError('Provider not found', 'PROVIDER_NOT_FOUND')

    const profile = await this.exchangeCode(provider, params)
    return {
      providerId: provider.id,
      providerType: provider.type,
      externalId: profile.externalId,
      email: profile.email,
      name: profile.name,
      rawAttributes: profile.raw,
    }
  }

  private async exchangeCode(
    provider: SsoProviderConfig,
    params: Record<string, string>,
  ): Promise<SsoUserProfile> {
    if (provider.type === 'oidc') {
      return this.handleOidcCallback(provider, params)
    }
    return this.handleSamlCallback(provider, params)
  }

  private async handleOidcCallback(
    provider: SsoProviderConfig,
    params: Record<string, string>,
  ): Promise<SsoUserProfile> {
    const code = params.code
    if (!code) throw new SsoError('No authorization code received', 'MISSING_CODE', 'oidc')

    if (!provider.tokenUrl) throw new SsoError('OIDC provider missing token URL', 'MISSING_TOKEN_URL', 'oidc')

    try {
      const tokenResponse = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: params.redirect_uri ?? '',
          client_id: provider.clientId ?? '',
          client_secret: provider.clientSecret ?? '',
        }),
        signal: AbortSignal.timeout(10_000),
      })

      if (!tokenResponse.ok) {
        throw new SsoError('Token exchange failed', 'TOKEN_EXCHANGE_FAILED', 'oidc')
      }

      const tokens = await tokenResponse.json() as Record<string, string>
      const idToken = tokens.id_token
      const accessToken = tokens.access_token

      if (idToken) {
        return this.parseIdToken(idToken, provider)
      }

      if (accessToken && provider.userInfoUrl) {
        return this.fetchUserInfo(accessToken, provider)
      }

      throw new SsoError('No user identity available', 'NO_IDENTITY', 'oidc')
    } catch (err) {
      if (err instanceof SsoError) throw err
      throw new SsoError(`OIDC callback failed: ${(err as Error).message}`, 'CALLBACK_FAILED', 'oidc')
    }
  }

  private parseIdToken(idToken: string, provider: SsoProviderConfig): SsoUserProfile {
    try {
      const parts = idToken.split('.')
      if (parts.length !== 3) throw new Error('Invalid JWT format')
      const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString('utf-8')) as Record<string, unknown>

      const email = String(payload.email ?? payload.preferred_username ?? '')
      const name = String(payload.name ?? payload.given_name ?? email)

      return {
        externalId: String(payload.sub ?? email),
        email,
        name,
        firstName: String(payload.given_name ?? ''),
        lastName: String(payload.family_name ?? ''),
        picture: String(payload.picture ?? ''),
        locale: String(payload.locale ?? ''),
        raw: payload,
      }
    } catch (err) {
      throw new SsoError(`Failed to parse ID token: ${(err as Error).message}`, 'PARSE_FAILED', 'oidc')
    }
  }

  private async fetchUserInfo(accessToken: string, provider: SsoProviderConfig): Promise<SsoUserProfile> {
    if (!provider.userInfoUrl) throw new SsoError('No userinfo URL configured', 'NO_USERINFO_URL', 'oidc')

    const response = await fetch(provider.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) throw new SsoError('Failed to fetch user info', 'USERINFO_FAILED', 'oidc')

    const data = await response.json() as Record<string, unknown>
    const email = String(data.email ?? '')
    const name = String(data.name ?? data.preferred_username ?? email)

    return {
      externalId: String(data.sub ?? email),
      email,
      name,
      firstName: String(data.given_name ?? ''),
      lastName: String(data.family_name ?? ''),
      picture: String(data.picture ?? ''),
      locale: String(data.locale ?? ''),
      raw: data,
    }
  }

  private async handleSamlCallback(
    _provider: SsoProviderConfig,
    _params: Record<string, string>,
  ): Promise<SsoUserProfile> {
    throw new SsoError('SAML callback not yet implemented', 'SAML_NOT_IMPLEMENTED', 'saml')
  }

  cleanupExpired(): number {
    let count = 0
    const now = Date.now()
    for (const [key, pending] of this.pendingAuths) {
      if (now > pending.expiresAt) {
        this.pendingAuths.delete(key)
        count++
      }
    }
    return count
  }
}
