'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Dialog, Select, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate, generateId } from '@/lib/utils'
import {
  Building2, Search, Plus, Edit3, Trash2, MoreHorizontal, ChevronUp, ChevronDown, ArrowUpDown, Ban, CheckCircle,
} from 'lucide-react'
import { Dropdown } from '@conversation-platform/ui'

interface Org {
  id: string; name: string; slug: string; isActive: boolean; userCount: number; campaignCount: number; createdAt: string
}

const mockOrgs: Org[] = [
  { id: '1', name: 'Acme Corp Marketing', slug: 'acme-marketing', isActive: true, userCount: 12, campaignCount: 5, createdAt: '2024-01-15T10:30:00Z' },
  { id: '2', name: 'Globex Sales', slug: 'globex-sales', isActive: true, userCount: 24, campaignCount: 8, createdAt: '2024-02-20T14:00:00Z' },
  { id: '3', name: 'Initech Support', slug: 'initech-support', isActive: false, userCount: 6, campaignCount: 2, createdAt: '2024-03-10T08:15:00Z' },
  { id: '4', name: 'Umbrella PR', slug: 'umbrella-pr', isActive: true, userCount: 18, campaignCount: 12, createdAt: '2024-04-05T16:45:00Z' },
  { id: '5', name: 'Hooli Dev', slug: 'hooli-dev', isActive: true, userCount: 9, campaignCount: 3, createdAt: '2024-05-01T09:00:00Z' },
]

type SortField = 'name' | 'slug' | 'userCount' | 'campaignCount' | 'createdAt'
type SortDir = 'asc' | 'desc'

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Org | null>(null)
  const [confirmSuspend, setConfirmSuspend] = useState<Org | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => { setOrgs(mockOrgs); setLoading(false) }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orgs.filter(o => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q))
  }, [orgs, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'slug') cmp = a.slug.localeCompare(b.slug)
      else if (sortField === 'userCount') cmp = a.userCount - b.userCount
      else if (sortField === 'campaignCount') cmp = a.campaignCount - b.campaignCount
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-300" />
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const openCreate = () => { setEditing(null); setFormName(''); setFormSlug(''); setDialogOpen(true) }
  const openEdit = (o: Org) => { setEditing(o); setFormName(o.name); setFormSlug(o.slug); setDialogOpen(true) }

  const handleSave = () => {
    if (!formName.trim() || !formSlug.trim()) return
    if (editing) {
      setOrgs(prev => prev.map(o => o.id === editing.id ? { ...o, name: formName.trim(), slug: formSlug.trim() } : o))
    } else {
      setOrgs(prev => [{ id: generateId(), name: formName.trim(), slug: formSlug.trim(), isActive: true, userCount: 0, campaignCount: 0, createdAt: new Date().toISOString() }, ...prev])
    }
    setDialogOpen(false)
  }

  const toggleSuspend = (org: Org) => {
    setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, isActive: !o.isActive } : o))
    setConfirmSuspend(null)
  }

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="Organizations" description="Manage organizations within your tenant">
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Organization</Button>
      </PageHeader>
      <div className="p-6 space-y-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search organizations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        {loading ? (
          <Card className="p-0"><div className="p-6 space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="flex gap-4"><Skeleton variant="text" width="20%" /><Skeleton variant="text" width="15%" /><Skeleton variant="text" width="10%" /><Skeleton variant="text" width="12%" /><Skeleton variant="text" width="15%" /></div>)}</div></Card>
        ) : sorted.length === 0 ? (
          <Card className="p-0"><EmptyState icon={<Building2 className="h-12 w-12" />} title={search ? 'No organizations match your search' : 'No organizations yet'} description={search ? 'Try a different search term' : 'Create your first organization'} action={!search && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Organization</Button>} /></Card>
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}><span className="inline-flex items-center gap-1">Name <SortIcon field="name" /></span></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('slug')}><span className="inline-flex items-center gap-1">Slug <SortIcon field="slug" /></span></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('userCount')}><span className="inline-flex items-center gap-1">Users <SortIcon field="userCount" /></span></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('campaignCount')}><span className="inline-flex items-center gap-1">Campaigns <SortIcon field="campaignCount" /></span></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}><span className="inline-flex items-center gap-1">Created <SortIcon field="createdAt" /></span></TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium text-gray-900">{org.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{org.slug}</TableCell>
                    <TableCell>{org.userCount}</TableCell>
                    <TableCell>{org.campaignCount}</TableCell>
                    <TableCell><Badge variant={org.isActive ? 'success' : 'danger'}>{org.isActive ? 'Active' : 'Suspended'}</Badge></TableCell>
                    <TableCell className="text-gray-500">{formatDate(org.createdAt)}</TableCell>
                    <TableCell>
                      <Dropdown align="end" trigger={<Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>}
                        items={[
                          { label: 'Edit', icon: <Edit3 className="h-4 w-4" />, onClick: () => openEdit(org) },
                          { label: org.isActive ? 'Suspend' : 'Reactivate', icon: org.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />, variant: org.isActive ? 'danger' : 'success', onClick: () => setConfirmSuspend(org) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit Organization' : 'Create Organization'}
        description={editing ? 'Update organization details.' : 'Fill in the details to create a new organization.'}
        footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!formName.trim() || !formSlug.trim()}>{editing ? 'Save Changes' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Organization Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Marketing Dept" />
          <Input label="Slug" value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="e.g. marketing-dept" />
        </div>
      </Dialog>
      <Dialog open={!!confirmSuspend} onClose={() => setConfirmSuspend(null)} title={confirmSuspend?.isActive ? 'Suspend Organization' : 'Reactivate Organization'}
        description={`Are you sure you want to ${confirmSuspend?.isActive ? 'suspend' : 'reactivate'} "${confirmSuspend?.name}"?`} size="sm"
        footer={<><Button variant="outline" onClick={() => setConfirmSuspend(null)}>Cancel</Button><Button variant={confirmSuspend?.isActive ? 'danger' : 'success'} onClick={() => confirmSuspend && toggleSuspend(confirmSuspend)}>{confirmSuspend?.isActive ? 'Suspend' : 'Reactivate'}</Button></>} />
    </>
  )
}
