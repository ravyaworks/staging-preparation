'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate } from '@/lib/utils'
import { Database, Plus, Download, CheckCircle2, XCircle, Clock, HardDrive } from 'lucide-react'

interface Backup {
  id: string; type: string; status: string; size: string | null; createdAt: string; completedAt: string | null
}

const mockBackups: Backup[] = [
  { id: '1', type: 'Full', status: 'completed', size: '2.4 GB', createdAt: '2024-07-06T02:00:00Z', completedAt: '2024-07-06T02:15:00Z' },
  { id: '2', type: 'Database', status: 'completed', size: '1.8 GB', createdAt: '2024-07-05T02:00:00Z', completedAt: '2024-07-05T02:12:00Z' },
  { id: '3', type: 'Configuration', status: 'completed', size: '12 MB', createdAt: '2024-07-05T02:00:00Z', completedAt: '2024-07-05T02:01:00Z' },
  { id: '4', type: 'Full', status: 'completed', size: '2.3 GB', createdAt: '2024-07-04T02:00:00Z', completedAt: '2024-07-04T02:14:00Z' },
  { id: '5', type: 'Database', status: 'failed', size: null, createdAt: '2024-07-03T02:00:00Z', completedAt: null },
]

export default function AdminBackups() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => { setBackups(mockBackups); setLoading(false) }, 600)
    return () => clearTimeout(timer)
  }, [])

  const statusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    running: <Clock className="h-4 w-4 text-blue-500" />,
  }

  const stats = {
    total: backups.length,
    completed: backups.filter(b => b.status === 'completed').length,
    failed: backups.filter(b => b.status === 'failed').length,
    latestSize: backups.find(b => b.status === 'completed' && b.size)?.size || 'N/A',
  }

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="Backups" description="Manage backup and restore operations">
        <Button><Plus className="h-4 w-4" /> Create Backup</Button>
      </PageHeader>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-0"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total Backups</p></CardContent></Card>
          <Card className="p-0"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.completed}</p><p className="text-sm text-gray-500">Successful</p></CardContent></Card>
          <Card className="p-0"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.failed}</p><p className="text-sm text-gray-500">Failed</p></CardContent></Card>
          <Card className="p-0"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{stats.latestSize}</p><p className="text-sm text-gray-500">Latest Size</p></CardContent></Card>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={50} />)}</div>
        ) : backups.length === 0 ? (
          <Card className="p-0"><EmptyState icon={<Database className="h-12 w-12" />} title="No backups" description="No backups have been created yet" action={<Button><Plus className="h-4 w-4" /> Create Backup</Button>} /></Card>
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium"><Badge variant="info">{b.type}</Badge></TableCell>
                    <TableCell><span className="flex items-center gap-1.5">{statusIcon[b.status] || null}<span className="capitalize text-sm">{b.status}</span></span></TableCell>
                    <TableCell className="text-gray-500">{b.size || '—'}</TableCell>
                    <TableCell className="text-gray-500 text-xs">{formatDate(b.createdAt)}</TableCell>
                    <TableCell className="text-gray-500 text-xs">{b.completedAt ? formatDate(b.completedAt) : '—'}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" disabled={b.status !== 'completed'}><Download className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  )
}
