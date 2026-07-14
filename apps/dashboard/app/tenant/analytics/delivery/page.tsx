'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Send,
  Check,
  CheckCheck,
  Eye,
  Clock,
  RotateCcw,
  Timer,
  Zap,
} from 'lucide-react'

interface DeliveryData {
  submitted: number
  accepted: number
  sent: number
  delivered: number
  read: number
  retryCount: number
  queueWaitTime: number
  processingTime: number
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

function FunnelStep({
  label,
  value,
  total,
  icon: Icon,
  color,
  isLast,
}: {
  label: string
  value: number
  total: number
  icon: any
  color: string
  isLast?: boolean
}) {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 min-w-[160px]">
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex-1">
        <div className="h-8 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color.replace('bg-', 'bg-')} opacity-80`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-right min-w-[120px]">
        <span className="text-lg font-bold">{value.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground ml-2">{percentage}%</span>
      </div>
      {!isLast && (
        <div className="absolute left-[26px] mt-10 w-px h-4 bg-border" />
      )}
    </div>
  )
}

export default function DeliveryAnalyticsPage() {
  const [data, setData] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/delivery')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const total = data?.submitted ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Analytics"
        description="Track message delivery funnel and processing metrics"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Retry Count"
              value={data?.retryCount ?? 0}
              icon={RotateCcw}
              color="text-orange-500"
            />
            <StatsCard
              label="Queue Wait Time"
              value={`${(data?.queueWaitTime ?? 0).toFixed(1)}s`}
              icon={Clock}
              color="text-amber-500"
            />
            <StatsCard
              label="Processing Time"
              value={`${(data?.processingTime ?? 0).toFixed(1)}s`}
              icon={Timer}
              color="text-purple-500"
            />
            <StatsCard
              label="Delivery Rate"
              value={`${total > 0 ? (((data?.delivered ?? 0) / total) * 100).toFixed(1) : 0}%`}
              icon={Zap}
              color="text-green-500"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-6">Delivery Funnel</h3>
            <div className="space-y-4 relative">
              <FunnelStep
                label="Submitted"
                value={data?.submitted ?? 0}
                total={total}
                icon={Send}
                color="bg-blue-500"
              />
              <FunnelStep
                label="Accepted"
                value={data?.accepted ?? 0}
                total={total}
                icon={Check}
                color="bg-indigo-500"
              />
              <FunnelStep
                label="Sent"
                value={data?.sent ?? 0}
                total={total}
                icon={CheckCheck}
                color="bg-purple-500"
              />
              <FunnelStep
                label="Delivered"
                value={data?.delivered ?? 0}
                total={total}
                icon={CheckCheck}
                color="bg-teal-500"
              />
              <FunnelStep
                label="Read"
                value={data?.read ?? 0}
                total={total}
                icon={Eye}
                color="bg-green-500"
                isLast
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
