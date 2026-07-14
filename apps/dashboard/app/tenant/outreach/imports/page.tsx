'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
}

export default function OutreachImportsPage() {
  const [imports, setImports] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    fetchImports()
  }, [page])

  async function fetchImports() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/outreach/jobs?page=${page}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setImports(data.data?.items ?? [])
        setTotal(data.data?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <PageHeader title="Import Jobs" description="Track bulk import submissions">
        <Button variant="outline" size="sm" onClick={fetchImports} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-muted-foreground">Loading...</div>
            ) : imports.length === 0 ? (
              <div className="p-6 text-muted-foreground">No import jobs found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((imp: any) => (
                    <TableRow key={imp.id}>
                      <TableCell className="font-mono text-xs">{imp.id.substring(0, 8)}...</TableCell>
                      <TableCell className="uppercase text-xs font-mono">{imp.type}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[imp.status] ?? ''}>{imp.status}</Badge>
                      </TableCell>
                      <TableCell>{imp.totalRecords}</TableCell>
                      <TableCell className="text-green-600">{imp.successCount}</TableCell>
                      <TableCell className="text-red-600">{imp.failedCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(imp.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Link href={`/tenant/outreach/imports/${imp.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">{total} total imports</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
