'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  Badge,
  Select,
  Button,
  EmptyState,
  ErrorState,
} from '@conversation-platform/ui'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface LogEntry {
  id: string
  channelType: string
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
  details: string | null
}

interface IntegrationLogsProps {
  logs: LogEntry[]
  channelTypes: string[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

const levelColors: Record<string, 'success' | 'warning' | 'danger'> = {
  info: 'success',
  warning: 'warning',
  error: 'danger',
}

export function IntegrationLogs({ logs, channelTypes, loading, error, onRetry }: IntegrationLogsProps) {
  const [channelFilter, setChannelFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  const channelOptions = [
    { value: '', label: 'All Channels' },
    ...channelTypes.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
  ]

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
  ]

  const filtered = logs.filter((log) => {
    const matchesChannel = !channelFilter || log.channelType === channelFilter
    const matchesLevel = !levelFilter || log.level === levelFilter
    return matchesChannel && matchesLevel
  })

  if (error) {
    return (
      <ErrorState
        title="Failed to load logs"
        description={error}
        onRetry={onRetry}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Integration Logs</h3>
          <p className="text-sm text-muted-foreground">Recent integration activity and errors.</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select
          options={channelOptions}
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="w-44"
          aria-label="Filter by channel"
        />
        <Select
          options={levelOptions}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="w-40"
          aria-label="Filter by level"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<AlertTriangle className="h-12 w-12" />}
              title="No logs found"
              description="No integration logs match your current filters."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <Card key={log.id} className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      log.level === 'error'
                        ? 'text-red-500'
                        : log.level === 'warning'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={levelColors[log.level] ?? 'default'} className="text-[10px]">
                        {log.level}
                      </Badge>
                      <Badge variant="default" className="text-[10px]">
                        {log.channelType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{log.message}</p>
                    {log.details && (
                      <pre className="mt-1 rounded bg-muted p-2 text-xs font-mono text-muted-foreground overflow-x-auto">
                        {log.details}
                      </pre>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
