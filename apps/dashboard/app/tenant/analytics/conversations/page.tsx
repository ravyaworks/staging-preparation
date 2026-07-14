'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  MessageSquare,
  MessageCircle,
  Clock,
  Timer,
  AlertTriangle,
  RotateCcw,
  GitBranch,
} from 'lucide-react'

interface ConversationData {
  totalConversations: number
  activeConversations: number
  closedConversations: number
  averageDuration: number
  averageResponseTime: number
  customerWaitTime: number
  reopenedCount: number
  escalatedCount: number
  trend: Array<{
    date: string
    total: number
    active: number
    closed: number
    avgResponseTime: number
  }>
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

export default function ConversationAnalyticsPage() {
  const [data, setData] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/conversations')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversation Analytics"
        description="Monitor conversation metrics and response times"
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
              label="Total Conversations"
              value={data?.totalConversations ?? 0}
              icon={MessageSquare}
              color="text-blue-500"
            />
            <StatsCard
              label="Active Conversations"
              value={data?.activeConversations ?? 0}
              icon={MessageCircle}
              color="text-green-500"
            />
            <StatsCard
              label="Closed Conversations"
              value={data?.closedConversations ?? 0}
              icon={Clock}
              color="text-gray-500"
            />
            <StatsCard
              label="Average Duration"
              value={formatDuration(data?.averageDuration ?? 0)}
              icon={Timer}
              color="text-purple-500"
            />
            <StatsCard
              label="Average Response Time"
              value={formatDuration(data?.averageResponseTime ?? 0)}
              icon={Timer}
              color="text-teal-500"
            />
            <StatsCard
              label="Customer Wait Time"
              value={formatDuration(data?.customerWaitTime ?? 0)}
              icon={Clock}
              color="text-amber-500"
            />
            <StatsCard
              label="Reopened"
              value={data?.reopenedCount ?? 0}
              icon={RotateCcw}
              color="text-orange-500"
            />
            <StatsCard
              label="Escalated"
              value={data?.escalatedCount ?? 0}
              icon={GitBranch}
              color="text-red-500"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation Trend
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Active</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Closed</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Avg Response</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.trend?.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{row.date}</td>
                      <td className="py-3 text-right">{row.total.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className="text-green-600 font-medium">{row.active.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-gray-600">{row.closed.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">{formatDuration(row.avgResponseTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
