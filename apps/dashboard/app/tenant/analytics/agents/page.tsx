'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Users,
  MessageSquare,
  CheckCircle,
  Timer,
  BarChart3,
  UserCheck,
} from 'lucide-react'

interface AgentData {
  activeAgents: number
  assignedConversations: number
  closedConversations: number
  avgResolutionTime: number
  agentWorkload: Array<{
    agentId: string
    name: string
    assigned: number
    closed: number
    status: 'online' | 'offline' | 'busy'
  }>
  agentAvailability: {
    online: number
    offline: number
    busy: number
  }
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

export default function AgentAnalyticsPage() {
  const [data, setData] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/agents')
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
        title="Agent Analytics"
        description="Track agent performance and availability"
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
              label="Active Agents"
              value={data?.activeAgents ?? 0}
              icon={Users}
              color="text-blue-500"
            />
            <StatsCard
              label="Assigned Conversations"
              value={data?.assignedConversations ?? 0}
              icon={MessageSquare}
              color="text-purple-500"
            />
            <StatsCard
              label="Closed Conversations"
              value={data?.closedConversations ?? 0}
              icon={CheckCircle}
              color="text-green-500"
            />
            <StatsCard
              label="Avg Resolution Time"
              value={formatDuration(data?.avgResolutionTime ?? 0)}
              icon={Timer}
              color="text-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
              <p className="text-2xl font-bold">{data?.agentAvailability?.online ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <p className="text-sm text-muted-foreground">Busy</p>
              </div>
              <p className="text-2xl font-bold">{data?.agentAvailability?.busy ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
              <p className="text-2xl font-bold">{data?.agentAvailability?.offline ?? 0}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Agent Workload
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Agent</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Assigned</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.agentWorkload?.map((agent) => (
                    <tr key={agent.agentId} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{agent.name}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                            agent.status === 'online'
                              ? 'bg-green-50 text-green-700'
                              : agent.status === 'busy'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              agent.status === 'online'
                                ? 'bg-green-500'
                                : agent.status === 'busy'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-400'
                            }`}
                          />
                          {agent.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">{agent.assigned.toLocaleString()}</td>
                      <td className="py-3 text-right">{agent.closed.toLocaleString()}</td>
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
