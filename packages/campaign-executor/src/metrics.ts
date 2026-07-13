export class MetricsCollector {
  private counters: Record<string, number> = {}
  private gauges: Record<string, number> = {}
  private histograms: Record<string, number[]> = {}

  incrementCounter(name: string, value = 1): void {
    this.counters[name] = (this.counters[name] ?? 0) + value
  }

  setGauge(name: string, value: number): void {
    this.gauges[name] = value
  }

  recordHistogram(name: string, value: number): void {
    if (!this.histograms[name]) this.histograms[name] = []
    this.histograms[name]!.push(value)
    if (this.histograms[name]!.length > 1000) {
      this.histograms[name] = this.histograms[name]!.slice(-500)
    }
  }

  getCounter(name: string): number {
    return this.counters[name] ?? 0
  }

  getGauge(name: string): number {
    return this.gauges[name] ?? 0
  }

  getHistogramStats(name: string): { count: number; sum: number; avg: number; min: number; max: number } | null {
    const values = this.histograms[name]
    if (!values || values.length === 0) return null
    const sum = values.reduce((a, b) => a + b, 0)
    return {
      count: values.length,
      sum,
      avg: Math.round(sum / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  getAllCounters(): Record<string, number> {
    return { ...this.counters }
  }

  getAllGauges(): Record<string, number> {
    return { ...this.gauges }
  }

  snapshot(): string {
    const counters = this.getAllCounters()
    const gauges = this.getAllGauges()
    const histograms: Record<string, unknown> = {}
    for (const key of Object.keys(this.histograms)) {
      histograms[key] = this.getHistogramStats(key)
    }
    return JSON.stringify({ counters, gauges, histograms })
  }

  reset(): void {
    this.counters = {}
    this.gauges = {}
    this.histograms = {}
  }
}
