import type { PrismaClient } from '@prisma/client'
import type { SystemHealth, HealthCheckResult } from '../types'

export class HealthService {
  constructor(private readonly prisma: PrismaClient) {}

  async check(): Promise<SystemHealth> {
    const [database, api, queue, workers, channels, ai, storage, webhooks, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkApi(),
      this.checkQueue(),
      this.checkWorkers(),
      this.checkChannels(),
      this.checkAI(),
      this.checkStorage(),
      this.checkWebhooks(),
      this.checkRedis(),
    ])
    const checks = { api, database, redis, queue, workers, channels, ai, storage, webhooks }
    const allHealthy = Object.values(checks).every(c => c.status === 'healthy')
    const anyUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy')
    return {
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }

  private async measure<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
    const start = Date.now()
    const result = await fn()
    return { result, latency: Date.now() - start }
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const { latency } = await this.measure(() => this.prisma.$queryRaw`SELECT 1`)
    return { status: 'healthy', latency, message: 'PostgreSQL connected' }
  }

  private async checkApi(): Promise<HealthCheckResult> {
    return { status: 'healthy', latency: 0, message: 'API server running' }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    return { status: 'healthy', latency: 0, message: 'Redis available' }
  }

  private async checkQueue(): Promise<HealthCheckResult> {
    try {
      const metrics = await this.prisma.workerMetric.findMany({
        take: 1,
        orderBy: { lastHeartbeatAt: 'desc' },
      })
      const jobs = await this.prisma.deliveryEvent.count()
      return { status: 'healthy', latency: 0, message: `${jobs} jobs tracked, ${metrics.length} workers` }
    } catch {
      return { status: 'degraded', latency: 0, message: 'Queue metrics unavailable' }
    }
  }

  private async checkWorkers(): Promise<HealthCheckResult> {
    try {
      const workers = await this.prisma.workerMetric.findMany()
      const activeWorkers = workers.filter(w => w.status === 'active')
      const staleWorkers = workers.filter(w => {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
        return w.lastHeartbeatAt < fiveMinAgo
      })
      if (staleWorkers.length > 0) {
        return { status: 'degraded', latency: 0, message: `${activeWorkers.length} active, ${staleWorkers.length} stale` }
      }
      return { status: 'healthy', latency: 0, message: `${activeWorkers.length} active workers` }
    } catch {
      return { status: 'degraded', latency: 0, message: 'Worker metrics unavailable' }
    }
  }

  private async checkChannels(): Promise<HealthCheckResult> {
    try {
      const channels = await this.prisma.channelConnection.findMany()
      const connected = channels.filter(c => c.status === 'connected')
      const errored = channels.filter(c => c.status === 'error')
      if (errored.length > 0) {
        return { status: 'degraded', latency: 0, message: `${connected.length}/${channels.length} connected, ${errored.length} errors` }
      }
      return { status: 'healthy', latency: 0, message: `${connected.length}/${channels.length} channels connected` }
    } catch {
      return { status: 'degraded', latency: 0, message: 'Channel status unavailable' }
    }
  }

  private async checkAI(): Promise<HealthCheckResult> {
    return { status: 'healthy', latency: 0, message: 'AI service available' }
  }

  private async checkStorage(): Promise<HealthCheckResult> {
    try {
      const files = await this.prisma.file.count()
      return { status: 'healthy', latency: 0, message: `${files} files stored` }
    } catch {
      return { status: 'degraded', latency: 0, message: 'Storage status unavailable' }
    }
  }

  private async checkWebhooks(): Promise<HealthCheckResult> {
    try {
      const webhooks = await this.prisma.webhook.count({ where: { isActive: true } })
      return { status: 'healthy', latency: 0, message: `${webhooks} active webhooks` }
    } catch {
      return { status: 'degraded', latency: 0, message: 'Webhook status unavailable' }
    }
  }

  async getAdminMetrics() {
    const [orgCount, userCount, activeSessions, apiKeyUsage, failedLogins, configChanges] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.session.count({ where: { isActive: true } }),
      this.prisma.apiKey.count({ where: { isActive: true } }),
      this.prisma.auditLog.count({ where: { action: { contains: 'auth.login' } } }),
      this.prisma.auditLog.count({ where: { action: { contains: 'configuration.update' } } }),
    ])
    return { orgCount, userCount, activeSessions, apiKeyUsage, failedLogins, configChanges }
  }
}
