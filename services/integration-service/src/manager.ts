import type { Logger } from '@conversation-platform/logger'
import type { ChannelType, ChannelConfig, ChannelAuthConfig } from '@conversation-platform/channel-core'
import type { IntegrationConfig, IntegrationStatus, IntegrationConnection, IntegrationLog } from './types'
import { IntegrationError, IntegrationConnectionError } from './types'
import type { IntegrationRepository, IntegrationLogRepository } from '@conversation-platform/database'
import type { Prisma } from '@prisma/client'

export class IntegrationManager {
  private integrations = new Map<string, IntegrationConfig>()
  private connections = new Map<string, IntegrationConnection[]>()
  private logs: IntegrationLog[] = []
  private logger?: Logger
  private maxLogSize: number
  private integrationRepo?: IntegrationRepository
  private logRepo?: IntegrationLogRepository

  constructor(logger?: Logger, maxLogSize = 10000, integrationRepo?: IntegrationRepository, logRepo?: IntegrationLogRepository) {
    this.logger = logger
    this.maxLogSize = maxLogSize
    this.integrationRepo = integrationRepo
    this.logRepo = logRepo
  }

  createIntegration(config: IntegrationConfig): IntegrationConfig {
    if (this.integrations.has(config.id)) {
      throw new IntegrationError(`Integration ${config.id} already exists`, 'INTEGRATION_EXISTS')
    }
    this.integrations.set(config.id, config)
    this.connections.set(config.id, [])
    this.logger?.info?.('Integration created', { integrationId: config.id, tenantId: config.tenantId })

    if (this.integrationRepo) {
      this.integrationRepo.create({
        id: config.id,
        channelType: config.channelType,
        name: config.name,
        enabled: config.enabled,
        status: config.status,
        settings: config.settings as Prisma.InputJsonValue,
        error: config.error,
        connectedAt: config.connectedAt ? new Date(config.connectedAt) : undefined,
        tenant: { connect: { id: config.tenantId } },
      }).catch((err) => this.logger?.error?.('Failed to persist integration', { error: err }))
    }

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

    if (this.integrationRepo) {
      this.integrationRepo.update(id, {
        channelType: updated.channelType,
        name: updated.name,
        enabled: updated.enabled,
        status: updated.status,
        settings: updated.settings as Prisma.InputJsonValue,
        error: updated.error,
        connectedAt: updated.connectedAt ? new Date(updated.connectedAt) : undefined,
      }).catch((err) => this.logger?.error?.('Failed to persist integration update', { error: err }))
    }

    return updated
  }

  removeIntegration(id: string): boolean {
    this.connections.delete(id)
    const result = this.integrations.delete(id)

    if (result && this.integrationRepo) {
      this.integrationRepo.remove(id).catch((err) => this.logger?.error?.('Failed to persist integration removal', { error: err }))
    }

    return result
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

      if (this.integrationRepo) {
        this.integrationRepo.update(id, {
          status,
          error,
          connectedAt: integration.connectedAt ? new Date(integration.connectedAt) : undefined,
        }).catch((err) => this.logger?.error?.('Failed to persist integration status', { error: err }))
      }
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

    if (this.logRepo) {
      this.logRepo.create({
        type: entry.type,
        message: entry.message,
        metadata: entry.metadata as Prisma.InputJsonValue,
        integration: { connect: { id: entry.integrationId } },
      }).catch((err) => this.logger?.error?.('Failed to persist integration log', { error: err }))
    }
  }

  getLogs(integrationId: string, limit = 50): IntegrationLog[] {
    return this.logs
      .filter(l => l.integrationId === integrationId)
      .slice(-limit)
      .reverse()
  }

  async getLogsFromDb(integrationId: string, limit = 50): Promise<IntegrationLog[] | undefined> {
    if (!this.logRepo) return undefined
    const logs = await this.logRepo.findByIntegration(integrationId, limit)
    return logs.map(l => ({
      id: l.id,
      integrationId: l.integrationId,
      tenantId: '',
      type: l.type as IntegrationLog['type'],
      message: l.message,
      metadata: (l.metadata as Record<string, unknown>) ?? undefined,
      timestamp: l.createdAt.toISOString(),
    }))
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
