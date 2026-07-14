'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Layers,
  Users,
  Zap,
  Timer,
  RotateCcw,
  AlertCircle,
  HeartPulse,
} from 'lucide-react'

interface QueueData {
  queueSize: number
  activeWorkers: number
  workerThroughput: number
  avgProcessingTime: number
  retryRate: number
  deadLetterQueueSize: number
  health: 'healthy' | 'warning' | 'critical'
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: any
  color?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${color || 'text-primary'}`} />}
      </div>
      <p className="text-2xl font-bold mt-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

function HealthBadge({ health }: { health: string }) {
  const config = {
    healthy: { label: 'Healthy', className: 'bg-green-50 text-green-700 border-green-200' },
    warning: { label: 'Warning', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
  }[health] ?? { label: 'Unknown', className: 'bg-gray-50 text-gray-700 border-gray-200' }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export default function QueueAnalyticsPage() {
  const [data, setData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/queue')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queue Analytics"
        description="Monitor queue health and worker performance"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              Queue Health
            </h3>
            <HealthBadge health={data?.health ?? 'unknown'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              label="Queue Size"
              value={data?.queueSize ?? 0}
              icon={Layers}
              color="text-blue-500"
            />
            <StatsCard
              label="Active Workers"
              value={data?.activeWorkers ?? 0}
              icon={Users}
              color="text-green-500"
            />
            <StatsCard
              label="Worker Throughput"
              value={`${(data?.workerThroughput ?? 0).toFixed(1)}/s`}
              icon={Zap}
              color="text-purple-500"
            />
            <StatsCard
              label="Avg Processing Time"
              value={`${(data?.avgProcessingTime ?? 0).toFixed(1)}s`}
              icon={Timer}
              color="text-teal-500"
            />
            <StatsCard
              label="Retry Rate"
              value={`${(data?.retryRate ?? 0).toFixed(1)}%`}
              icon={RotateCcw}
              color="text-orange-500"
            />
            <StatsCard
              label="Dead Letter Queue"
              value={data?.deadLetterQueueSize ?? 0}
              icon={AlertCircle}
              color="text-red-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
