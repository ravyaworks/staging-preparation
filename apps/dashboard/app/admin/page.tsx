'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Skeleton } from '@conversation-platform/ui'
import { ErrorState } from '@conversation-platform/ui'
import { cn, formatDate } from '@/lib/utils'
import {
  Building2,
  Users,
  MessageSquare,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Settings,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

interface StatsCard {
  label: string
  value: string
  change: number
  changeLabel: string
  icon: React.ReactNode
}

interface TenantSummary {
  id: string
  name: string
  slug: string
  userCount: number
  status: 'active' | 'suspended' | 'trial'
  created: string
}

const statsCardsData: StatsCard[] = [
  {
    label: 'Total Tenants',
    value: '24',
    change: 12.5,
    changeLabel: 'vs last month',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    label: 'Total Users',
    value: '1,482',
    change: 8.2,
    changeLabel: 'vs last month',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Active Conversations',
    value: '3,219',
    change: -2.4,
    changeLabel: 'vs last month',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    label: 'API Calls Today',
    value: '142.5K',
    change: 23.1,
    changeLabel: 'vs yesterday',
    icon: <Activity className="h-5 w-5" />,
  },
]

const recentTenants: TenantSummary[] = [
  { id: '1', name: 'Acme Corp', slug: 'acme-corp', userCount: 45, status: 'active', created: '2024-01-15T10:30:00Z' },
  { id: '2', name: 'Globex Inc', slug: 'globex-inc', userCount: 128, status: 'active', created: '2024-02-20T14:00:00Z' },
  { id: '3', name: 'Initech', slug: 'initech', userCount: 23, status: 'trial', created: '2024-03-10T08:15:00Z' },
  { id: '4', name: 'Umbrella Co', slug: 'umbrella-co', userCount: 67, status: 'active', created: '2024-04-05T16:45:00Z' },
  { id: '5', name: 'Hooli', slug: 'hooli', userCount: 12, status: 'suspended', created: '2024-05-01T09:00:00Z' },
]

const systemHealth = [
  { label: 'API Response Time', value: '245ms', status: 'good' },
  { label: 'Error Rate', value: '0.02%', status: 'good' },
  { label: 'Uptime', value: '99.97%', status: 'good' },
  { label: 'Queue Backlog', value: '128', status: 'warning' },
  { label: 'Database Connections', value: '47/100', status: 'good' },
  { label: 'Memory Usage', value: '68%', status: 'warning' },
]

const quickActions = [
  { label: 'Create Tenant', href: '/admin/tenants', icon: <Plus className="h-4 w-4" /> },
  { label: 'View Analytics', href: '/admin/analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Platform Settings', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
]

const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  trial: 'warning',
  suspended: 'danger',
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load dashboard"
          description={error}
          onRetry={() => setError(null)}
        />
      </div>
    )
  }

  const StatCard = ({ item }: { item: StatsCard }) => (
    <Card className="p-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {item.icon}
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5',
              item.change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}
          >
            {item.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(item.change)}%
          </span>
        </div>
        <p className="mt-4 text-2xl font-bold text-gray-900">{item.value}</p>
        <p className="mt-1 text-sm text-gray-500">{item.label}</p>
        <p className="text-xs text-gray-400">{item.changeLabel}</p>
      </CardContent>
    </Card>
  )

  const StatCardSkeleton = () => (
    <Card className="p-0">
      <CardContent className="p-6">
        <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
        <Skeleton variant="text" width="60%" className="mt-4" />
        <Skeleton variant="text" width="40%" className="mt-1" />
        <Skeleton variant="text" width="30%" className="mt-1" />
      </CardContent>
    </Card>
  )

  return (
    <>
      <PageHeader title="Admin Overview" description="Monitor and manage your platform" />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCardsData.map((item) => (
              <StatCard key={item.label} item={item} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Recent Tenants</h3>
            </div>
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton variant="text" width="25%" />
                    <Skeleton variant="text" width="20%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="25%" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium text-gray-900">{tenant.name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{tenant.slug}</TableCell>
                      <TableCell>{tenant.userCount}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge[tenant.status]}>
                          {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{formatDate(tenant.created)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-0">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">System Health</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                {loading
                  ? [1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton variant="text" width="50%" />
                        <Skeleton variant="text" width="20%" />
                      </div>
                    ))
                  : systemHealth.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          {item.status === 'good' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                          )}
                          {item.value}
                        </span>
                      </div>
                    ))}
              </CardContent>
            </Card>

            <Card className="p-0">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Button variant="outline" className="w-full justify-start">
                      {action.icon}
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
