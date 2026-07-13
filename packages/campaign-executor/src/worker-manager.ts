import type { Logger } from '@conversation-platform/logger'
import type { WorkerInfo } from './types'
import { MetricsCollector } from './metrics'

interface InternalWorkerInfo {
  id: string
  status: 'active' | 'idle' | 'stopped'
  startedAt: Date
  lastHeartbeatAt: Date
  jobsProcessed: number
  currentJobId: string | null
  processJob: () => Promise<boolean>
  stop: () => void
}

export class WorkerManager {
  private workers: Map<string, InternalWorkerInfo> = new Map()
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null
  private isRunning = false

  constructor(
    private readonly workerCount: number,
    private readonly heartbeatIntervalMs: number,
    private readonly staleTimeoutMs: number,
    private readonly processJobFn: () => Promise<boolean>,
    private readonly metrics: MetricsCollector,
    private readonly logger: Logger,
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true

    for (let i = 0; i < this.workerCount; i++) {
      this.createWorker(i)
    }

    this.heartbeatTimer = setInterval(() => this.sendHeartbeats(), this.heartbeatIntervalMs)
    this.staleCheckTimer = setInterval(() => this.checkStaleWorkers(), this.staleTimeoutMs)

    this.logger.info({ workerCount: this.workerCount }, 'Worker manager started')
    this.metrics.setGauge('workers.active', this.workerCount)
  }

  async stop(): Promise<void> {
    this.isRunning = false

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.staleCheckTimer) {
      clearInterval(this.staleCheckTimer)
      this.staleCheckTimer = null
    }

    for (const [id, worker] of this.workers) {
      worker.status = 'stopped'
      worker.stop()
      this.logger.info({ workerId: id }, 'Worker stopped')
    }

    this.workers.clear()
    this.metrics.setGauge('workers.active', 0)
    this.logger.info('All workers stopped')
  }

  private createWorker(index: number): void {
    const id = `worker_${process.pid}_${index}`
    let running = false

    const processJob = async (): Promise<boolean> => {
      if (running || !this.isRunning) return false
      running = true
      try {
        const result = await this.processJobFn()
        return result
      } finally {
        running = false
      }
    }

    const worker: InternalWorkerInfo = {
      id,
      status: 'active',
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
      jobsProcessed: 0,
      currentJobId: null,
      processJob,
      stop: () => {
        running = false
      },
    }

    this.workers.set(id, worker)

    const pollInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(pollInterval)
        return
      }
      try {
        const processed = await worker.processJob()
        if (processed) {
          worker.jobsProcessed++
          worker.lastHeartbeatAt = new Date()
          this.metrics.setGauge('workers.active', this.getActiveCount())
        }
      } catch {
        // worker error handled silently
      }
    }, 500)

    this.logger.info({ workerId: id }, 'Worker created')
  }

  private sendHeartbeats(): void {
    const now = new Date()
    for (const worker of this.workers.values()) {
      worker.lastHeartbeatAt = now
      worker.status = worker.currentJobId ? 'active' : 'idle'
    }
    this.metrics.setGauge('workers.active', this.getActiveCount())
  }

  private checkStaleWorkers(): void {
    const now = Date.now()
    for (const [id, worker] of this.workers) {
      const elapsed = now - worker.lastHeartbeatAt.getTime()
      if (elapsed > this.staleTimeoutMs) {
        this.logger.warn({ workerId: id, elapsedMs: elapsed }, 'Worker is stale, recreating')
        this.workers.delete(id)
        this.createWorker(parseInt(id.split('_').pop() ?? '0', 10))
      }
    }
  }

  getWorkers(): WorkerInfo[] {
    return Array.from(this.workers.values()).map(w => ({
      id: w.id,
      status: w.status,
      startedAt: w.startedAt,
      lastHeartbeatAt: w.lastHeartbeatAt,
      jobsProcessed: w.jobsProcessed,
      currentJobId: w.currentJobId,
    }))
  }

  getActiveCount(): number {
    return Array.from(this.workers.values()).filter(w => w.status === 'active').length
  }

  getTotalJobsProcessed(): number {
    return Array.from(this.workers.values()).reduce((sum, w) => sum + w.jobsProcessed, 0)
  }
}
