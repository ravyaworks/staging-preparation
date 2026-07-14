'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Bot,
  AlertTriangle,
  UserCheck,
  Timer,
  BookOpen,
  Zap,
} from 'lucide-react'

interface AIData {
  aiResponses: number
  aiEscalations: number
  humanTakeovers: number
  avgResponseTime: number
  knowledgeBaseUsage: number
  workflowTriggerRate: number
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

export default function AIAnalyticsPage() {
  const [data, setData] = useState<AIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/ai')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Analytics"
        description="Monitor AI performance and automation metrics"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              label="AI Responses"
              value={data?.aiResponses ?? 0}
              icon={Bot}
              color="text-blue-500"
            />
            <StatsCard
              label="AI Escalations"
              value={data?.aiEscalations ?? 0}
              icon={AlertTriangle}
              color="text-red-500"
            />
            <StatsCard
              label="Human Takeovers"
              value={data?.humanTakeovers ?? 0}
              icon={UserCheck}
              color="text-orange-500"
            />
            <StatsCard
              label="Avg Response Time"
              value={formatDuration(data?.avgResponseTime ?? 0)}
              icon={Timer}
              color="text-purple-500"
            />
            <StatsCard
              label="Knowledge Base Usage"
              value={data?.knowledgeBaseUsage ?? 0}
              icon={BookOpen}
              color="text-teal-500"
            />
            <StatsCard
              label="Workflow Trigger Rate"
              value={`${(data?.workflowTriggerRate ?? 0).toFixed(1)}%`}
              icon={Zap}
              color="text-green-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
