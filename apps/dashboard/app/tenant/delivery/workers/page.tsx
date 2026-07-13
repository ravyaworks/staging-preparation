'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/analytics/stat-card'
import { Card } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { Users, Activity, RefreshCw, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchWorkers() }, [])

  async function fetchWorkers() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/delivery/workers')
      if (res.ok) {
        const data = await res.json()
        setWorkers(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const totalJobs = workers.reduce((s: number, w: any) => s + w.jobsProcessed, 0)
  const totalSuccess = workers.reduce((s: number, w: any) => s + w.successCount, 0)
  const totalFailures = workers.reduce((s: number, w: any) => s + w.failureCount, 0)

  return (
    <div>
      <PageHeader
        title="Worker Monitor"
        description="Real-time worker status and performance metrics"
      >
        <Button variant="outline" size="sm" onClick={fetchWorkers}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Link href="/tenant/delivery">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
        <StatCard title="Workers" value={String(workers.length)} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Total Jobs" value={String(totalJobs)} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Success Rate" value={totalJobs > 0 ? `${((totalSuccess / totalJobs) * 100).toFixed(1)}%` : '0%'} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Total Failures" value={String(totalFailures)} icon={<AlertCircle className="h-5 w-5" />} />
      </div>

      <div className="px-6 pb-6">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Job</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Last Heartbeat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w: any) => (
                <TableRow key={w.workerId}>
                  <TableCell className="font-mono text-sm">{w.workerId}</TableCell>
                  <TableCell>
                    <Badge className={
                      w.status === 'active' ? 'bg-green-100 text-green-800' :
                      w.status === 'idle' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{w.currentJobId ? w.currentJobId.slice(0, 8) + '...' : '-'}</TableCell>
                  <TableCell>{w.jobsProcessed}</TableCell>
                  <TableCell className="text-green-600">{w.successCount}</TableCell>
                  <TableCell className="text-red-600">{w.failureCount}</TableCell>
                  <TableCell>{(w.averageProcessingMs / 1000).toFixed(1)}s</TableCell>
                  <TableCell className="text-sm">{(w.uptimeMs / 3600000).toFixed(1)}h</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(w.lastHeartbeatAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {workers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No workers registered'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
