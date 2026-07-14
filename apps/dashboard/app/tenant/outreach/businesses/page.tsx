'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { Input } from '@conversation-platform/ui'
import { RefreshCw, Search } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  queued: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  read: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  replied: 'bg-purple-100 text-purple-800',
}

export default function OutreachBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const limit = 20

  useEffect(() => {
    fetchBusinesses()
  }, [page, statusFilter])

  async function fetchBusinesses() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/v1/outreach/businesses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBusinesses(data.data?.items ?? [])
        setTotal(data.data?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <PageHeader title="Businesses" description="All imported businesses across campaigns">
        <Button variant="outline" size="sm" onClick={fetchBusinesses} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      <div className="px-6 pb-4 flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-9"
            onKeyDown={e => e.key === 'Enter' && fetchBusinesses()}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="read">Read</option>
          <option value="failed">Failed</option>
          <option value="replied">Replied</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}>
          Clear
        </Button>
      </div>

      <div className="px-6 pb-6">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-muted-foreground">Loading...</div>
            ) : businesses.length === 0 ? (
              <div className="p-6 text-muted-foreground">No businesses found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preview URL</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((biz: any) => (
                    <TableRow key={biz.id}>
                      <TableCell>
                        <Link href={`/tenant/outreach/businesses/${biz.id}`} className="text-primary hover:underline font-medium">
                          {biz.businessName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{biz.phone}</TableCell>
                      <TableCell className="text-xs">{biz.campaignName}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[biz.status] ?? ''}>{biz.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {biz.previewUrl ? (
                          <a href={biz.previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px] block">
                            Preview
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(biz.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">{total} total businesses</p>
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
