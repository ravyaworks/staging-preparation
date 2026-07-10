import { createHash, randomBytes } from 'crypto'
import type { IntegrationApiKey } from './types'
import { IntegrationAuthError } from './types'

export class ApiKeyManager {
  private keys = new Map<string, IntegrationApiKey>()

  createKey(params: {
    tenantId: string
    name: string
    scopes: string[]
    expiresAt?: string
  }): { key: IntegrationApiKey; rawKey: string } {
    const id = crypto.randomUUID()
    const rawKey = `cp_${randomBytes(24).toString('hex')}`
    const keyPrefix = rawKey.slice(0, 8)
    const keyHash = this.hashKey(rawKey)

    const apiKey: IntegrationApiKey = {
      id,
      tenantId: params.tenantId,
      name: params.name,
      keyPrefix,
      keyHash,
      scopes: params.scopes,
      expiresAt: params.expiresAt,
      createdAt: new Date().toISOString(),
      enabled: true,
    }

    this.keys.set(id, apiKey)
    return { key: apiKey, rawKey }
  }

  validateKey(rawKey: string): IntegrationApiKey | null {
    const hash = this.hashKey(rawKey)

    for (const key of this.keys.values()) {
      if (key.keyHash === hash) {
        if (!key.enabled) return null
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) return null
        key.lastUsedAt = new Date().toISOString()
        return key
      }
    }

    return null
  }

  getKey(id: string): IntegrationApiKey | undefined {
    return this.keys.get(id)
  }

  getKeysByTenant(tenantId: string): IntegrationApiKey[] {
    return Array.from(this.keys.values())
      .filter(k => k.tenantId === tenantId)
  }

  revokeKey(id: string): boolean {
    const key = this.keys.get(id)
    if (!key) return false
    key.enabled = false
    return true
  }

  deleteKey(id: string): boolean {
    return this.keys.delete(id)
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex')
  }
}
