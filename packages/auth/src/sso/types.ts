export type SsoProviderType = 'oidc' | 'saml'

export interface SsoProviderConfig {
  id: string
  tenantId: string
  type: SsoProviderType
  label: string
  enabled: boolean
  clientId?: string
  clientSecret?: string
  issuerUrl?: string
  authorizationUrl?: string
  tokenUrl?: string
  userInfoUrl?: string
  jwksUrl?: string
  scopes: string[]
  samlEntryPoint?: string
  samlIssuer?: string
  samlCert?: string
  attributeMapping: Record<string, string>
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SsoAuthRequest {
  providerId: string
  redirectUri: string
  state: string
  tenantId: string
}

export interface SsoCallbackResult {
  providerId: string
  providerType: SsoProviderType
  externalId: string
  email: string
  name: string
  rawAttributes: Record<string, unknown>
  accessToken?: string
  idToken?: string
  refreshToken?: string
}

export interface SsoUserProfile {
  externalId: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  picture?: string
  locale?: string
  raw: Record<string, unknown>
}

export class SsoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly providerType?: SsoProviderType,
  ) {
    super(message)
    this.name = 'SsoError'
  }
}
