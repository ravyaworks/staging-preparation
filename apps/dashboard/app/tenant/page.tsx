'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  BookOpen,
  GitBranch,
  Users,
  Mail,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton, ErrorState } from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { cn, formatDate, pluralize } from '@/lib/utils'

interface StatCard {
  label: string
  value: string | number
  change: string
  changeType: 'up' | 'down' | 'neutral'
  icon: React.ElementType
}

interface RecentConversation {
  id: string
  title: string
  status: 'active' | 'pending' | 'resolved' | 'closed'
  messageCount: number
  lastActivity: string
  assignee: string
}

interface SystemStatus {
  api: 'healthy' | 'degraded' | 'down'
  database: 'healthy' | 'degraded' | 'down'
  ai: 'healthy' | 'degraded' | 'down'
  uptime: string
}

const mockStats: StatCard[] = [
  { label: 'Active Conversations', value: 128, change: '+12%', changeType: 'up', icon: MessageSquare },
  { label: 'Knowledge Items', value: 1_842, change: '+5.2%', changeType: 'up', icon: BookOpen },
  { label: 'Workflows Active', value: 24, change: '3 paused', changeType: 'neutral', icon: GitBranch },
  { label: 'Team Members', value: 16, change: '2 online', changeType: 'neutral', icon: Users },
  { label: 'Messages Today', value: 4_356, change: '+18.7%', changeType: 'up', icon: Mail },
  { label: 'Avg Response Time', value: '1.2s', change: '-0.3s', changeType: 'down', icon: Clock },
]

const mockConversations: RecentConversation[] = [
  { id: '1', title: 'Product inquiry - pricing', status: 'active', messageCount: 23, lastActivity: '2026-07-08T10:30:00Z', assignee: 'You' },
  { id: '2', title: 'Technical support: API integration', status: 'active', messageCount: 45, lastActivity: '2026-07-08T09:15:00Z', assignee: 'Alex' },
  { id: '3', title: 'Account cancellation request', status: 'pending', messageCount: 8, lastActivity: '2026-07-07T22:00:00Z', assignee: 'Sam' },
  { id: '4', title: 'Feature request: dark mode', status: 'resolved', messageCount: 16, lastActivity: '2026-07-07T16:45:00Z', assignee: 'Jordan' },
  { id: '5', title: 'Billing discrepancy inquiry', status: 'active', messageCount: 31, lastActivity: '2026-07-07T14:20:00Z', assignee: 'You' },
]

const mockSystemStatus: SystemStatus = {
  api: 'healthy',
  database: 'healthy',
  ai: 'degraded',
  uptime: '99.97%',
}

const statusColor: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active: 'success',
  pending: 'warning',
  resolved: 'info',
  closed: 'default',
}

const systemBadge: Record<string, 'success' | 'warning' | 'danger'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'danger',
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="rectangular" width={40} height={40} />
              <div className="space-y-2 flex-1">
                <Skeleton width="80%" />
                <Skeleton width="50%" height={12} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RecentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton width={160} />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton variant="rectangular" width={24} height={24} />
            <div className="flex-1 space-y-1">
              <Skeleton width="60%" />
              <Skeleton width="40%" height={12} />
            </div>
            <Skeleton width={60} height={20} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function TenantDashboard() {
  const [stats, setStats] = useState<StatCard[] | null>(null)
  const [conversations, setConversations] = useState<RecentConversation[] | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setStats(mockStats)
      setConversations(mockConversations)
      setSystemStatus(mockSystemStatus)
      setLoading(false)
    }, 800)
  }, [])

  useEffect(() => { load() }, [load])

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Tenant overview and metrics" />
        <div className="p-6">
          <ErrorState title="Failed to load dashboard" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Tenant overview and metrics">
        <Button size="sm" onClick={load} isLoading={loading}>
          Refresh
        </Button>
      </PageHeader>

      <div className="space-y-6 p-6">
        {loading ? <StatsSkeleton /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(stats ?? []).map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                        <p className="text-2xl font-bold tracking-tight mt-0.5">{stat.value}</p>
                        <span className={cn(
                          'text-xs font-medium',
                          stat.changeType === 'up' && 'text-green-600',
                          stat.changeType === 'down' && 'text-red-500',
                          stat.changeType === 'neutral' && 'text-muted-foreground',
                        )}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {loading ? <RecentSkeleton /> : (
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Conversations</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Latest {conversations?.length ?? 0} active conversations
                    </p>
                  </div>
                  <Link href="/tenant/conversations">
                    <Button variant="ghost" size="sm">
                      View all
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {(conversations ?? []).map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/tenant/conversations/${conv.id}`}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conv.messageCount} {pluralize(conv.messageCount, 'message')} &middot; {formatDate(conv.lastActivity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={statusColor[conv.status]}>{conv.status}</Badge>
                          <span className="text-xs text-muted-foreground">{conv.assignee}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {loading ? (
              <>
                <RecentSkeleton />
                <RecentSkeleton />
              </>
            ) : (
              <>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/tenant/conversations">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="mr-2 h-4 w-4" />
                        New Conversation
                      </Button>
                    </Link>
                    <Link href="/tenant/knowledge">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Knowledge
                      </Button>
                    </Link>
                    <Link href="/tenant/workflows">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workflow
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(Object.keys(systemStatus ?? {}) as Array<keyof SystemStatus>).filter(k => k !== 'uptime').map((key) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize text-muted-foreground">{key}</span>
                        <Badge variant={systemStatus ? systemBadge[systemStatus[key]] : 'success'}>
                          <span className="flex items-center gap-1">
                            <span className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              systemStatus?.[key] === 'healthy' && 'bg-green-500',
                              systemStatus?.[key] === 'degraded' && 'bg-yellow-500',
                              systemStatus?.[key] === 'down' && 'bg-red-500',
                            )} />
                            {systemStatus?.[key]}
                          </span>
                        </Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="text-sm font-medium text-green-600">{systemStatus?.uptime}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Channels</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Web Chat</p>
                          <p className="text-xs text-muted-foreground">Embeddable chat widget</p>
                        </div>
                      </div>
                      <Badge variant="success">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">API</p>
                          <p className="text-xs text-muted-foreground">REST API integration</p>
                        </div>
                      </div>
                      <Badge variant="success">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-3 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Messenger</p>
                          <p className="text-xs text-muted-foreground">Facebook Messenger</p>
                        </div>
                      </div>
                      <Badge variant="default">Coming soon</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-3 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">WhatsApp</p>
                          <p className="text-xs text-muted-foreground">WhatsApp Business API</p>
                        </div>
                      </div>
                      <Badge variant="default">Coming soon</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-3 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Slack</p>
                          <p className="text-xs text-muted-foreground">Slack integration</p>
                        </div>
                      </div>
                      <Badge variant="default">Coming soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
