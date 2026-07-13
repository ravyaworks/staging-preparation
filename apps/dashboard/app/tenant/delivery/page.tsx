'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/analytics/stat-card'
import { Card, CardContent } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { AlertTriangle, BarChart3, Activity, Users, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  queued: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  retrying: 'bg-orange-100 text-orange-800',
  dead_letter: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const statusDisplay: Record<string, string> = {
  pending: 'Draft',
  queued: 'Queued',
  processing: 'Processing',
  sent: 'Sent',
  completed: 'Completed',
  failed: 'Failed',
  retrying: 'Retrying',
  dead_letter: 'Dead Letter',
  cancelled: 'Cancelled',
}

export default function DeliveryMonitorPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [queueHealth, setQueueHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [page, statusFilter])

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) { params.set('status', statusFilter) }

      const [jobsRes, analyticsRes, healthRes] = await Promise.all([
        fetch(`/api/v1/delivery/jobs?${params}`),
        fetch('/api/v1/delivery/analytics/delivery'),
        fetch('/api/v1/delivery/analytics/queue-health'),
      ])

      if (jobsRes.ok) {
        const data = await jobsRes.json()
        setJobs(data.data.items)
        setTotal(data.data.total)
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data.data)
      }
      if (healthRes.ok) {
        const data = await healthRes.json()
        setQueueHealth(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Delivery Monitor"
        description="Track and monitor all outreach delivery jobs"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </PageHeader>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
          <StatCard
            title="Total Jobs"
            value={String(analytics.totalJobs)}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <StatCard
            title="Completed"
            value={String(analytics.completedJobs)}
            change={analytics.successRate}
            trend="up"
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            title="Failed"
            value={String(analytics.failedJobs)}
            change={analytics.failureRate}
            trend="down"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            title="Active Workers"
            value={String(analytics.activeWorkers)}
            icon={<Users className="h-5 w-5" />}
          />
        </div>
      )}

      {queueHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 pb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Queue Load</p>
              <p className="text-2xl font-bold">{queueHealth.currentLoad}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Wait Time</p>
              <p className="text-2xl font-bold">{(queueHealth.averageWaitTimeMs / 1000).toFixed(1)}s</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Throughput</p>
              <p className="text-2xl font-bold">{queueHealth.throughputPerMinute}/min</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Dead Letter</p>
              <p className="text-2xl font-bold">{queueHealth.deadLetterCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-6 pb-6">
        <div className="flex gap-2 mb-4">
          <Button
            variant={statusFilter === '' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(''); setPage(1) }}
          >
            All
          </Button>
          {Object.entries(statusDisplay).map(([key, label]) => (
            <Button
              key={key}
              variant={statusFilter === key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(key); setPage(1) }}
            >
              {label}
            </Button>
          ))}
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: any) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{job.recipientName}</p>
                      <p className="text-sm text-muted-foreground">{job.recipientPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{job.campaignName || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[job.status] || ''}>
                      {statusDisplay[job.status] || job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.attempts}/{job.maxAttempts}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/tenant/delivery/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No jobs found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {total > 20 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
