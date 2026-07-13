'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function FailureMonitorPage() {
  const [failures, setFailures] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page] = useState(1)

  useEffect(() => {
    fetchData()
  }, [page])

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20', offset: String((page - 1) * 20) })
      const [failuresRes, statsRes] = await Promise.all([
        fetch(`/api/v1/delivery/failures?${params}`),
        fetch('/api/v1/delivery/failures/stats'),
      ])

      if (failuresRes.ok) {
        const data = await failuresRes.json()
        setFailures(data.data.failures)
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Failure Monitor"
        description="Track and manage delivery failures"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Link href="/tenant/delivery">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      </PageHeader>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Failures</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Unresolved</p>
              <p className="text-2xl font-bold text-red-600">{stats.unresolved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Error Types</p>
              <p className="text-2xl font-bold">{Object.keys(stats.byType).length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && Object.keys(stats.byType).length > 0 && (
        <div className="px-6 pb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Failures by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byType as Record<string, number>)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-sm w-32">{type}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-8 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-6 pb-6">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Error Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failures.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-sm">{f.jobId.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge className="bg-red-100 text-red-800">{f.errorType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{f.errorMessage}</TableCell>
                  <TableCell>{f.retryCount}</TableCell>
                  <TableCell>
                    <Badge className={
                      f.resolutionStatus === 'resolved' ? 'bg-green-100 text-green-800' :
                      f.resolutionStatus === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {f.resolutionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(f.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {failures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No unresolved failures'}
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
