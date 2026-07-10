'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/analytics/stat-card'
import { BarChart } from '@/components/analytics/bar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Select } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { Progress } from '@conversation-platform/ui'

import {
  Building2,
  Users,
  MessageSquare,
  Activity,
  Database,
  DollarSign,
  Download,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

const periods = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
]

const kpis = [
  { title: 'Total Tenants', value: '24', change: 12.5, trend: 'up' as const, icon: <Building2 className="h-5 w-5" /> },
  { title: 'Total Users', value: '1,482', change: 8.2, trend: 'up' as const, icon: <Users className="h-5 w-5" /> },
  { title: 'Total Conversations', value: '48,920', change: 15.7, trend: 'up' as const, icon: <MessageSquare className="h-5 w-5" /> },
  { title: 'API Calls', value: '1.2M', change: 23.4, trend: 'up' as const, icon: <Activity className="h-5 w-5" /> },
  { title: 'Storage Used', value: '2.4 TB', change: 18.1, trend: 'up' as const, icon: <Database className="h-5 w-5" /> },
  { title: 'Revenue (MRR)', value: '$48,240', change: 11.3, trend: 'up' as const, icon: <DollarSign className="h-5 w-5" /> },
]

const growthData = [
  { label: 'Jan', value: 1200 },
  { label: 'Feb', value: 1900 },
  { label: 'Mar', value: 2800 },
  { label: 'Apr', value: 3600 },
  { label: 'May', value: 4200 },
  { label: 'Jun', value: 5100 },
]

const topTenants = [
  { name: 'Acme Corp', conversations: 12450, users: 450, apiCalls: 234000, storage: '450 GB', revenue: '$12,400' },
  { name: 'Globex Inc', conversations: 8920, users: 280, apiCalls: 182000, storage: '320 GB', revenue: '$8,900' },
  { name: 'Initech', conversations: 5670, users: 190, apiCalls: 98000, storage: '180 GB', revenue: '$5,200' },
  { name: 'Umbrella Co', conversations: 4320, users: 135, apiCalls: 76000, storage: '120 GB', revenue: '$3,800' },
  { name: 'Hooli', conversations: 2890, users: 95, apiCalls: 54000, storage: '85 GB', revenue: '$2,100' },
]

const systemMetrics = [
  { label: 'CPU Usage', value: 62, max: 100, variant: 'default' as const },
  { label: 'Memory Usage', value: 78, max: 100, variant: 'warning' as const },
  { label: 'Disk I/O', value: 45, max: 100, variant: 'default' as const },
  { label: 'Network Throughput', value: 340, max: 1000, variant: 'default' as const, suffix: ' Mbps' },
  { label: 'Database Connections', value: 47, max: 100, variant: 'default' as const },
  { label: 'Cache Hit Rate', value: 94, max: 100, variant: 'success' as const, suffix: '%' },
]

const errorRateData = [
  { label: 'Mon', value: 0.8 },
  { label: 'Tue', value: 1.2 },
  { label: 'Wed', value: 0.5 },
  { label: 'Thu', value: 0.9 },
  { label: 'Fri', value: 0.3 },
  { label: 'Sat', value: 0.4 },
  { label: 'Sun', value: 0.6 },
]

const systemHealth = [
  { label: 'API Response Time', value: '245ms', status: 'good' },
  { label: 'Error Rate', value: '0.02%', status: 'good' },
  { label: 'Uptime', value: '99.97%', status: 'good' },
  { label: 'Queue Backlog', value: '128', status: 'warning' },
  { label: 'SSL Certificate', value: 'Expires in 45d', status: 'good' },
  { label: 'Backup Status', value: 'Last 2h ago', status: 'good' },
]

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d')

  return (
    <>
      <PageHeader title="Platform Analytics" description="Overall platform metrics and performance">
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={periods}
            className="w-44"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi) => (
            <StatCard key={kpi.title} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Growth (Conversations)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={growthData} height={200} showValues />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Rate (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={errorRateData} height={200} showValues />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Tenants by Usage</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Conversations</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>API Calls</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTenants.map((t) => (
                    <TableRow key={t.name}>
                      <TableCell className="font-medium text-gray-900">{t.name}</TableCell>
                      <TableCell>{t.conversations.toLocaleString()}</TableCell>
                      <TableCell>{t.users}</TableCell>
                      <TableCell>{t.apiCalls.toLocaleString()}</TableCell>
                      <TableCell>{t.storage}</TableCell>
                      <TableCell className="font-mono text-sm">{t.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth.map((item) => (
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemMetrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">{m.label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {m.suffix ? `${m.value}${m.suffix}` : m.value}
                  </span>
                </div>
                <Progress value={m.value} max={m.max} variant={m.variant} size="md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
