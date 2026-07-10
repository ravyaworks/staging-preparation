import type { Logger } from '@conversation-platform/logger'
import type { ChannelType, ChannelConfig, ChannelAuthConfig } from '@conversation-platform/channel-core'
import type { IntegrationConfig, IntegrationStatus, IntegrationConnection, IntegrationLog } from './types'
import { IntegrationError, IntegrationConnectionError } from './types'

export class IntegrationManager {
  private integrations = new Map<string, IntegrationConfig>()
  private connections = new Map<string, IntegrationConnection[]>()
  private logs: IntegrationLog[] = []
  private logger?: Logger
  private maxLogSize: number

  constructor(logger?: Logger, maxLogSize = 10000) {
    this.logger = logger
    this.maxLogSize = maxLogSize
  }

  createIntegration(config: IntegrationConfig): IntegrationConfig {
    if (this.integrations.has(config.id)) {
      throw new IntegrationError(`Integration ${config.id} already exists`, 'INTEGRATION_EXISTS')
    }
    this.integrations.set(config.id, config)
    this.connections.set(config.id, [])
    this.logger?.info?.('Integration created', { integrationId: config.id, tenantId: config.tenantId })
    return config
  }

  getIntegration(id: string): IntegrationConfig | undefined {
    return this.integrations.get(id)
  }

  getIntegrationsByTenant(tenantId: string): IntegrationConfig[] {
    return Array.from(this.integrations.values())
      .filter(i => i.tenantId === tenantId)
  }

  getIntegrationsByChannel(tenantId: string, channelType: ChannelType): IntegrationConfig[] {
    return this.getIntegrationsByTenant(tenantId)
      .filter(i => i.channelType === channelType)
  }

  updateIntegration(id: string, updates: Partial<IntegrationConfig>): IntegrationConfig {
    const existing = this.integrations.get(id)
    if (!existing) throw new IntegrationError(`Integration ${id} not found`, 'INTEGRATION_NOT_FOUND')
    const updated = { ...existing, ...updates, id: existing.id, tenantId: existing.tenantId }
    this.integrations.set(id, updated)
    return updated
  }

  removeIntegration(id: string): boolean {
    this.connections.delete(id)
    return this.integrations.delete(id)
  }

  updateStatus(id: string, status: IntegrationStatus, error?: string): void {
    const integration = this.integrations.get(id)
    if (integration) {
      integration.status = status
      integration.error = error
      if (status === 'connected') {
        integration.connectedAt = new Date().toISOString()
      }
      integration.lastActivityAt = new Date().toISOString()
    }
  }

  recordConnection(integrationId: string, connection: IntegrationConnection): void {
    const conns = this.connections.get(integrationId) ?? []
    conns.push(connection)
    this.connections.set(integrationId, conns)
  }

  getConnections(integrationId: string): IntegrationConnection[] {
    return this.connections.get(integrationId) ?? []
  }

  addLog(entry: Omit<IntegrationLog, 'id' | 'timestamp'>): void {
    const log: IntegrationLog = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    this.logs.push(log)
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize)
    }
  }

  getLogs(integrationId: string, limit = 50): IntegrationLog[] {
    return this.logs
      .filter(l => l.integrationId === integrationId)
      .slice(-limit)
      .reverse()
  }

  getTenantLogs(tenantId: string, limit = 50): IntegrationLog[] {
    return this.logs
      .filter(l => l.tenantId === tenantId)
      .slice(-limit)
      .reverse()
  }

  clear(): void {
    this.integrations.clear()
    this.connections.clear()
    this.logs = []
  }

  count(): { total: number; active: number } {
    const all = Array.from(this.integrations.values())
    return {
      total: all.length,
      active: all.filter(i => i.status === 'connected').length,
    }
  }
}
