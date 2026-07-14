'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Skeleton, ErrorState,
} from '@conversation-platform/ui'
import { formatDate } from '@/lib/utils'
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, Server, Database, HardDrive, Network, Cpu, RefreshCw,
} from 'lucide-react'

interface HealthItem { label: string; status: 'healthy' | 'degraded' | 'unhealthy'; latency: number; message: string; icon: React.ReactNode }

const mockHealth: HealthItem[] = [
  { label: 'API Server', status: 'healthy', latency: 0, message: 'API server running', icon: <Server className="h-5 w-5" /> },
  { label: 'Database', status: 'healthy', latency: 5, message: 'PostgreSQL connected', icon: <Database className="h-5 w-5" /> },
  { label: 'Redis', status: 'healthy', latency: 2, message: 'Redis available', icon: <Cpu className="h-5 w-5" /> },
  { label: 'Queue', status: 'healthy', latency: 0, message: 'Queue system operational', icon: <Activity className="h-5 w-5" /> },
  { label: 'Workers', status: 'degraded', latency: 0, message: '3 active, 1 stale worker', icon: <Cpu className="h-5 w-5" /> },
  { label: 'Channels', status: 'healthy', latency: 0, message: '6/8 channels connected', icon: <Network className="h-5 w-5" /> },
  { label: 'AI Service', status: 'healthy', latency: 0, message: 'AI service available', icon: <Cpu className="h-5 w-5" /> },
  { label: 'Storage', status: 'healthy', latency: 0, message: 'Storage healthy', icon: <HardDrive className="h-5 w-5" /> },
  { label: 'Webhooks', status: 'healthy', latency: 0, message: '2 active webhooks', icon: <Activity className="h-5 w-5" /> },
]

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  healthy: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
  degraded: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: <AlertTriangle className="h-5 w-5 text-yellow-500" /> },
  unhealthy: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <XCircle className="h-5 w-5 text-red-500" /> },
}

const adminMetrics = { orgCount: 8, userCount: 142, activeSessions: 89, apiKeyUsage: 12, failedLogins: 3, configChanges: 27 }

export default function AdminHealth() {
  const [health, setHealth] = useState<HealthItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => { setHealth(mockHealth); setLastChecked(new Date().toISOString()); setLoading(false) }, 600)
    return () => clearTimeout(timer)
  }, [])

  const refresh = () => {
    setLoading(true)
    setTimeout(() => { setHealth(mockHealth); setLastChecked(new Date().toISOString()); setLoading(false) }, 600)
  }

  const overallStatus = health.every(h => h.status === 'healthy') ? 'healthy' : health.some(h => h.status === 'unhealthy') ? 'unhealthy' : 'degraded'

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="System Health" description="Monitor platform health and performance">
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <div className="p-6 space-y-6">
        <Card className={`p-0 border-2 ${overallStatus === 'healthy' ? 'border-green-400' : overallStatus === 'degraded' ? 'border-yellow-400' : 'border-red-400'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusColors[overallStatus]?.icon}
                <div>
                  <CardTitle>Overall Status: {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}</CardTitle>
                  <CardDescription>Last checked: {lastChecked ? formatDate(lastChecked) : 'Never'}</CardDescription>
                </div>
              </div>
              <Badge variant={overallStatus === 'healthy' ? 'success' : overallStatus === 'degraded' ? 'warning' : 'danger'} size="lg">{overallStatus.toUpperCase()}</Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? [1,2,3,4,5,6,7,8,9].map(i => <Skeleton key={i} variant="rectangular" height={140} />) : health.map(item => {
            const colors = statusColors[item.status] || statusColors.unhealthy
            return (
              <Card key={item.label} className={`p-0 border ${colors.bg}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 ${colors.text} shrink-0`}>{item.icon}</div>
                      <div><CardTitle className="text-base">{item.label}</CardTitle></div>
                    </div>
                    {colors.icon}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className={colors.text}>{item.message}</p>
                  {item.latency > 0 && <p className="text-gray-500 text-xs">Response: {item.latency}ms</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="p-0">
          <CardHeader><CardTitle>Admin Metrics</CardTitle><CardDescription>Key platform metrics</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xl font-bold text-gray-900">{adminMetrics.orgCount}</p><p className="text-xs text-gray-500">Organizations</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xl font-bold text-gray-900">{adminMetrics.userCount}</p><p className="text-xs text-gray-500">Active Users</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xl font-bold text-gray-900">{adminMetrics.activeSessions}</p><p className="text-xs text-gray-500">Active Sessions</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xl font-bold text-gray-900">{adminMetrics.apiKeyUsage}</p><p className="text-xs text-gray-500">API Keys</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xl font-bold text-red-600">{adminMetrics.failedLogins}</p><p className="text-xs text-gray-500">Failed Logins</p></div>
              <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xl font-bold text-gray-900">{adminMetrics.configChanges}</p><p className="text-xs text-gray-500">Config Changes</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
