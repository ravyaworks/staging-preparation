import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import type { JobFailureData, ResolutionStatus } from './types'
import { DeliveryTrackingError } from './types'

export class FailureTracker {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async recordFailure(
    jobId: string,
    errorType: string,
    errorMessage: string,
    retryCount: number,
    stackTrace?: string | null,
  ): Promise<JobFailureData> {
    const failure = await this.prisma.jobFailure.create({
      data: {
        jobId,
        errorType,
        errorMessage,
        retryCount,
        stackTrace: stackTrace ?? null,
        resolutionStatus: 'unresolved',
      },
    })

    this.logger.warn(
      { jobId, errorType, errorMessage, retryCount },
      'Job failure recorded',
    )

    return this.toFailureData(failure)
  }

  async updateRetry(jobId: string, retryCount: number): Promise<void> {
    const failure = await this.prisma.jobFailure.findFirst({
      where: { jobId, resolutionStatus: 'unresolved' },
      orderBy: { createdAt: 'desc' },
    })

    if (failure) {
      await this.prisma.jobFailure.update({
        where: { id: failure.id },
        data: { retryCount, lastRetryAt: new Date() },
      })
    }
  }

  async resolveFailure(
    jobId: string,
    resolutionStatus: ResolutionStatus,
    resolvedBy?: string,
  ): Promise<JobFailureData | null> {
    const failure = await this.prisma.jobFailure.findFirst({
      where: { jobId, resolutionStatus: 'unresolved' },
      orderBy: { createdAt: 'desc' },
    })

    if (!failure) return null

    const updated = await this.prisma.jobFailure.update({
      where: { id: failure.id },
      data: {
        resolutionStatus,
        resolvedAt: new Date(),
        resolvedBy: resolvedBy ?? null,
      },
    })

    return this.toFailureData(updated)
  }

  async getJobFailures(jobId: string): Promise<JobFailureData[]> {
    const failures = await this.prisma.jobFailure.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    })
    return failures.map(f => this.toFailureData(f))
  }

  async getUnresolvedFailures(limit = 50, offset = 0): Promise<{ failures: JobFailureData[]; total: number }> {
    const [failures, total] = await Promise.all([
      this.prisma.jobFailure.findMany({
        where: { resolutionStatus: 'unresolved' },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.jobFailure.count({ where: { resolutionStatus: 'unresolved' } }),
    ])
    return { failures: failures.map(f => this.toFailureData(f)), total }
  }

  async getFailureStats(): Promise<{
    total: number
    unresolved: number
    resolved: number
    byType: Record<string, number>
  }> {
    const [all, unresolved] = await Promise.all([
      this.prisma.jobFailure.findMany({ select: { errorType: true, resolutionStatus: true } }),
      this.prisma.jobFailure.count({ where: { resolutionStatus: 'unresolved' } }),
    ])

    const byType: Record<string, number> = {}
    for (const f of all) {
      byType[f.errorType] = (byType[f.errorType] ?? 0) + 1
    }

    return {
      total: all.length,
      unresolved,
      resolved: all.filter(f => f.resolutionStatus === 'resolved').length,
      byType,
    }
  }

  private toFailureData(f: any): JobFailureData {
    return {
      id: f.id,
      jobId: f.jobId,
      errorType: f.errorType,
      errorMessage: f.errorMessage,
      retryCount: f.retryCount,
      lastRetryAt: f.lastRetryAt,
      stackTrace: f.stackTrace,
      resolutionStatus: f.resolutionStatus as ResolutionStatus,
      resolvedAt: f.resolvedAt,
      resolvedBy: f.resolvedBy,
      createdAt: f.createdAt,
    }
  }
}
