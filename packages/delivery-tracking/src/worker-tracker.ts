import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { WorkerMetricData, WorkerStatus } from './types'

export class WorkerTracker {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async registerHeartbeat(
    workerId: string,
    status: string = 'active',
    currentJobId?: string | null,
  ): Promise<WorkerMetricData> {
    const existing = await this.prisma.workerMetric.findUnique({
      where: { workerId },
    })

    if (!existing) {
      return this.createWorker(workerId, status, currentJobId)
    }

    const updated = await this.prisma.workerMetric.update({
      where: { workerId },
      data: {
        status,
        currentJobId: currentJobId ?? existing.currentJobId,
        lastHeartbeatAt: new Date(),
      },
    })
    return this.toData(updated)
  }

  async recordJobProcessed(
    workerId: string,
    succeeded: boolean,
    processingTimeMs: number,
    jobId?: string,
  ): Promise<WorkerMetricData> {
    const worker = await this.prisma.workerMetric.findUnique({ where: { workerId } })
    if (!worker) {
      return this.createWorker(workerId, 'idle')
    }

    const newSuccessCount = worker.successCount + (succeeded ? 1 : 0)
    const newFailureCount = worker.failureCount + (succeeded ? 0 : 1)
    const newJobsProcessed = worker.jobsProcessed + 1
    const newAvg = Math.round(
      (worker.averageProcessingMs * worker.jobsProcessed + processingTimeMs) / newJobsProcessed,
    )

    const updated = await this.prisma.workerMetric.update({
      where: { workerId },
      data: {
        jobsProcessed: newJobsProcessed,
        successCount: newSuccessCount,
        failureCount: newFailureCount,
        averageProcessingMs: newAvg,
        currentJobId: jobId ?? null,
        lastHeartbeatAt: new Date(),
        status: 'idle',
      },
    })
    return this.toData(updated)
  }

  async getWorkerStatus(workerId: string): Promise<WorkerMetricData | null> {
    const worker = await this.prisma.workerMetric.findUnique({ where: { workerId } })
    return worker ? this.toData(worker) : null
  }

  async getAllWorkers(): Promise<WorkerStatus[]> {
    const workers = await this.prisma.workerMetric.findMany({
      orderBy: { lastHeartbeatAt: 'desc' },
    })

    return workers.map(w => ({
      workerId: w.workerId,
      status: w.status,
      currentJobId: w.currentJobId,
      jobsProcessed: w.jobsProcessed,
      successCount: w.successCount,
      failureCount: w.failureCount,
      averageProcessingMs: w.averageProcessingMs,
      uptimeMs: Date.now() - w.startedAt.getTime(),
      lastHeartbeatAt: w.lastHeartbeatAt,
    }))
  }

  async markWorkerOffline(workerId: string): Promise<void> {
    await this.prisma.workerMetric.update({
      where: { workerId },
      data: { status: 'stopped' },
    })
    this.logger.info({ workerId }, 'Worker marked offline')
  }

  async cleanupStaleWorkers(timeoutMs = 60000): Promise<number> {
    const cutoff = new Date(Date.now() - timeoutMs)
    const stale = await this.prisma.workerMetric.updateMany({
      where: {
        status: 'active',
        lastHeartbeatAt: { lt: cutoff },
      },
      data: { status: 'stopped' },
    })
    if (stale.count > 0) {
      this.logger.warn({ count: stale.count, timeoutMs }, 'Stale workers cleaned up')
    }
    return stale.count
  }

  private async createWorker(
    workerId: string,
    status: string,
    currentJobId?: string | null,
  ): Promise<WorkerMetricData> {
    const worker = await this.prisma.workerMetric.create({
      data: {
        workerId,
        status,
        currentJobId: currentJobId ?? null,
        lastHeartbeatAt: new Date(),
      },
    })
    this.logger.info({ workerId, status }, 'New worker registered')
    return this.toData(worker)
  }

  private toData(w: any): WorkerMetricData {
    return {
      workerId: w.workerId,
      currentJobId: w.currentJobId,
      jobsProcessed: w.jobsProcessed,
      successCount: w.successCount,
      failureCount: w.failureCount,
      averageProcessingMs: w.averageProcessingMs,
      lastHeartbeatAt: w.lastHeartbeatAt,
      status: w.status,
      startedAt: w.startedAt,
    }
  }
}
