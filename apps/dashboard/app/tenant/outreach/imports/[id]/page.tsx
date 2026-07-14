'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  imported: 'bg-green-100 text-green-800',
  duplicate: 'bg-yellow-100 text-yellow-800',
  invalid: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
}

export default function ImportJobDetailPage() {
  const params = useParams()
  const [job, setJob] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  useEffect(() => {
    fetchJob()
  }, [])

  useEffect(() => {
    if (job) fetchRecords()
  }, [page, job])

  async function fetchJob() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/outreach/jobs/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setJob(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecords() {
    try {
      const res = await fetch(`/api/v1/outreach/jobs/${params.id}/records?page=${page}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.data?.items ?? [])
      }
    } catch {
      // wait for API
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Import Job Details" />
        <div className="p-6 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div>
        <PageHeader title="Import Job Details" />
        <div className="p-6 text-muted-foreground">Import job not found</div>
      </div>
    )
  }

  const completedAt = job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'

  return (
    <div>
      <PageHeader title="Import Job Details">
        <Link href="/tenant/outreach/imports">
          <Badge variant="outline" className="cursor-pointer">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Imports
          </Badge>
        </Link>
      </PageHeader>

      <div className="p-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Job Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{job.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="uppercase font-mono text-xs">{job.type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[job.status] ?? ''}>{job.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Records</span><span>{job.totalRecords}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Success</span><span className="text-green-600">{job.successCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><span className="text-red-600">{job.failedCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(job.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{completedAt}</span></div>
          </CardContent>
        </Card>

        {job.errorSummary?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm text-red-600">Errors</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {job.errorSummary.map((err: any, i: number) => (
                  <li key={i} className="text-red-600">Row {err.row}: {err.message}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="px-6 pb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Records</CardTitle></CardHeader>
          <CardContent className="p-0">
            {records.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No records found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground">{r.rowNumber}</TableCell>
                      <TableCell className="font-medium">{r.businessName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[r.status] ?? ''}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-red-600">
                        {r.errors?.map((e: any) => e.message).join('; ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
