import { describe, it, expect } from 'vitest'
import { MetricsCollector } from '../metrics'

describe('MetricsCollector', () => {
  let metrics: MetricsCollector

  beforeEach(() => {
    metrics = new MetricsCollector()
  })

  it('should start with zero counters', () => {
    expect(metrics.getCounter('test')).toBe(0)
  })

  it('should increment counters', () => {
    metrics.incrementCounter('jobs_completed')
    expect(metrics.getCounter('jobs_completed')).toBe(1)

    metrics.incrementCounter('jobs_completed', 5)
    expect(metrics.getCounter('jobs_completed')).toBe(6)
  })

  it('should get all counters', () => {
    metrics.incrementCounter('a', 1)
    metrics.incrementCounter('b', 2)
    const all = metrics.getAllCounters()
    expect(all).toEqual({ a: 1, b: 2 })
  })

  it('should set and get gauges', () => {
    metrics.setGauge('active_workers', 5)
    expect(metrics.getGauge('active_workers')).toBe(5)
    metrics.setGauge('active_workers', 3)
    expect(metrics.getGauge('active_workers')).toBe(3)
  })

  it('should get all gauges', () => {
    metrics.setGauge('x', 10)
    metrics.setGauge('y', 20)
    expect(metrics.getAllGauges()).toEqual({ x: 10, y: 20 })
  })

  it('should record histogram values', () => {
    metrics.recordHistogram('processing_time_ms', 100)
    metrics.recordHistogram('processing_time_ms', 200)
    metrics.recordHistogram('processing_time_ms', 300)

    const stats = metrics.getHistogramStats('processing_time_ms')
    expect(stats).not.toBeNull()
    expect(stats!.count).toBe(3)
    expect(stats!.sum).toBe(600)
    expect(stats!.avg).toBe(200)
    expect(stats!.min).toBe(100)
    expect(stats!.max).toBe(300)
  })

  it('should return null for empty histogram', () => {
    expect(metrics.getHistogramStats('nonexistent')).toBeNull()
  })

  it('should reset all metrics', () => {
    metrics.incrementCounter('x', 10)
    metrics.setGauge('y', 20)
    metrics.recordHistogram('z', 30)

    metrics.reset()

    expect(metrics.getCounter('x')).toBe(0)
    expect(metrics.getGauge('y')).toBe(0)
    expect(metrics.getHistogramStats('z')).toBeNull()
  })

  it('should produce a JSON snapshot', () => {
    metrics.incrementCounter('done', 5)
    metrics.setGauge('workers', 3)
    metrics.recordHistogram('time', 50)

    const snap = metrics.snapshot()
    const parsed = JSON.parse(snap)
    expect(parsed.counters).toEqual({ done: 5 })
    expect(parsed.gauges).toEqual({ workers: 3 })
    expect(parsed.histograms.time).toBeDefined()
  })
})
