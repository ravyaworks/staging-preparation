'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/analytics/stat-card'
import { BarChart } from '@/components/analytics/bar-chart'
import { PieChart } from '@/components/analytics/pie-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Select } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Zap,
  Smile,
} from 'lucide-react'

const periods = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
]

const kpis = [
  { title: 'Total Conversations', value: '12,847', change: 14.2, trend: 'up' as const, icon: <MessageSquare className="h-5 w-5" />, description: 'vs. previous period' },
  { title: 'Messages', value: '89,234', change: 8.7, trend: 'up' as const, icon: <Zap className="h-5 w-5" />, description: 'vs. previous period' },
  { title: 'Active Users', value: '1,423', change: -3.1, trend: 'down' as const, icon: <Users className="h-5 w-5" />, description: 'vs. previous period' },
  { title: 'Avg Response Time', value: '1.2s', change: -12.5, trend: 'up' as const, icon: <Clock className="h-5 w-5" />, description: 'faster than before' },
  { title: 'Satisfaction Score', value: '92%', change: 2.1, trend: 'up' as const, icon: <Smile className="h-5 w-5" />, description: 'vs. previous period' },
  { title: 'Token Usage', value: '2.4M', change: 18.3, trend: 'up' as const, icon: <BarChart3 className="h-5 w-5" />, description: 'vs. previous period' },
]

const conversationOverTime = [
  { label: 'Mon', value: 420 },
  { label: 'Tue', value: 380 },
  { label: 'Wed', value: 510 },
  { label: 'Thu', value: 470 },
  { label: 'Fri', value: 590 },
  { label: 'Sat', value: 320 },
  { label: 'Sun', value: 280 },
]

const messagesByModel = [
  { label: 'GPT-4', value: 45, color: '#3b82f6' },
  { label: 'GPT-3.5', value: 30, color: '#10b981' },
  { label: 'Claude', value: 15, color: '#f59e0b' },
  { label: 'Other', value: 10, color: '#6b7280' },
]

const responseTimeTrend = [
  { label: 'Week 1', value: 1.8 },
  { label: 'Week 2', value: 1.5 },
  { label: 'Week 3', value: 1.3 },
  { label: 'Week 4', value: 1.2 },
]

const topModels = [
  { name: 'GPT-4 Turbo', messages: 34520, tokens: 980234, avgLatency: '0.8s', cost: '$172.40' },
  { name: 'GPT-3.5 Turbo', messages: 22340, tokens: 612450, avgLatency: '0.4s', cost: '$24.50' },
  { name: 'Claude 3 Sonnet', messages: 11230, tokens: 345200, avgLatency: '0.9s', cost: '$45.60' },
  { name: 'Claude 3 Haiku', messages: 8450, tokens: 198400, avgLatency: '0.5s', cost: '$8.45' },
  { name: 'Mistral Large', messages: 3240, tokens: 89200, avgLatency: '0.7s', cost: '$12.80' },
]

const hourlyVolume = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}:00`,
  value: Math.floor(Math.random() * 60) + 10,
}))

const activityColors = ['bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600']
const activityData = Array.from({ length: 7 }, () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 5))
)

export default function TenantAnalytics() {
  const [period, setPeriod] = useState('30d')

  return (
    <>
      <PageHeader title="Analytics" description="Track your conversation performance and usage">
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
              <CardTitle>Conversations Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={conversationOverTime} height={200} showValues />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages by Model</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <PieChart data={messagesByModel} size={180} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative" style={{ height: 180 }}>
                <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={responseTimeTrend
                      .map((d, i) => {
                        const x = (i / (responseTimeTrend.length - 1)) * 280 + 10
                        const y = 140 - ((d.value - 1) / 1) * 120
                        return `${x},${y}`
                      })
                      .join(' ')}
                  />
                  {responseTimeTrend.map((d, i) => {
                    const x = (i / (responseTimeTrend.length - 1)) * 280 + 10
                    const y = 140 - ((d.value - 1) / 1) * 120
                    return (
                      <g key={d.label}>
                        <circle cx={x} cy={y} r="4" fill="#3b82f6" className="stroke-white stroke-2" />
                        <text x={x} y={155} textAnchor="middle" className="fill-gray-400 text-[9px]">{d.label}</text>
                        <text x={x} y={y - 10} textAnchor="middle" className="fill-gray-500 text-[9px] font-medium">{d.value}s</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Activity Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className="w-8 flex-shrink-0" />
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 text-[8px] text-gray-400 text-center">{i % 3 === 0 ? `${i}h` : ''}</div>
                  ))}
                </div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, di) => (
                  <div key={day} className="flex gap-1 items-center">
                    <div className="w-8 flex-shrink-0 text-[10px] text-gray-400">{day}</div>
                    {activityData[di].map((val, hi) => (
                      <div
                        key={hi}
                        className={cn('flex-1 aspect-square rounded-sm', activityColors[val] || 'bg-gray-100')}
                        title={`${day} ${hi}:00 - ${val} conversations`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-3 justify-end">
                <span className="text-[10px] text-gray-400">Low</span>
                {activityColors.map((c) => (
                  <div key={c} className={cn('h-3 w-3 rounded-sm', c)} />
                ))}
                <span className="text-[10px] text-gray-400">High</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Models Used</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Avg Latency</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topModels.map((m) => (
                  <TableRow key={m.name}>
                    <TableCell className="font-medium text-gray-900">{m.name}</TableCell>
                    <TableCell>{m.messages.toLocaleString()}</TableCell>
                    <TableCell>{m.tokens.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={m.avgLatency === '0.4s' || m.avgLatency === '0.5s' ? 'success' : 'default'}>
                        {m.avgLatency}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{m.cost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Volume by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={hourlyVolume} height={180} showValues />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
