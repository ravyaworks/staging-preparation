'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  GitBranch,
  CheckCircle,
  XCircle,
  Timer,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

interface WorkflowData {
  executions: number
  successRate: number
  failures: number
  avgExecutionTime: number
  mostUsed: Array<{
    id: string
    name: string
    executions: number
    successRate: number
    avgTime: number
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

export default function WorkflowAnalyticsPage() {
  const [data, setData] = useState<WorkflowData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/workflows')
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
        title="Workflow Analytics"
        description="Track workflow executions and performance"
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
              label="Total Executions"
              value={data?.executions ?? 0}
              icon={GitBranch}
              color="text-blue-500"
            />
            <StatsCard
              label="Success Rate"
              value={`${(data?.successRate ?? 0).toFixed(1)}%`}
              icon={CheckCircle}
              color="text-green-500"
            />
            <StatsCard
              label="Failures"
              value={data?.failures ?? 0}
              icon={XCircle}
              color="text-red-500"
            />
            <StatsCard
              label="Avg Execution Time"
              value={formatDuration(data?.avgExecutionTime ?? 0)}
              icon={Timer}
              color="text-purple-500"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Most Used Workflows
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Workflow</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Executions</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Success Rate</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.mostUsed?.map((workflow) => (
                    <tr key={workflow.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{workflow.name}</td>
                      <td className="py-3 text-right">{workflow.executions.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-medium ${
                            workflow.successRate >= 80
                              ? 'text-green-600'
                              : workflow.successRate >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {workflow.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">{formatDuration(workflow.avgTime)}</td>
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
