'use client'

import { Card, CardContent } from '@conversation-platform/ui'
import { MessageSquare, AlertTriangle, Activity, Clock } from 'lucide-react'

interface UsageStatsData {
  totalMessages: number
  errors: number
  activeChannels: number
  averageLatency: string
}

interface UsageStatsProps {
  stats: UsageStatsData
}

export function UsageStats({ stats }: UsageStatsProps) {
  const items = [
    {
      label: 'Total Messages',
      value: stats.totalMessages.toLocaleString(),
      icon: <MessageSquare className="h-5 w-5 text-blue-500" aria-hidden="true" />,
      color: 'text-blue-500',
    },
    {
      label: 'Errors',
      value: stats.errors.toLocaleString(),
      icon: <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />,
      color: 'text-red-500',
    },
    {
      label: 'Active Channels',
      value: stats.activeChannels.toString(),
      icon: <Activity className="h-5 w-5 text-green-500" aria-hidden="true" />,
      color: 'text-green-500',
    },
    {
      label: 'Average Latency',
      value: stats.averageLatency,
      icon: <Clock className="h-5 w-5 text-purple-500" aria-hidden="true" />,
      color: 'text-purple-500',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} role="region" aria-label={item.label}>
          <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-semibold ${item.color}`}>{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      ))}
    </div>
  )
}
