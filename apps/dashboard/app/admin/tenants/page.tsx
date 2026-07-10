'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Dialog, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate, generateId } from '@/lib/utils'
import {
  Building2, Search, Plus, Edit3, Trash2, MoreHorizontal,
  ChevronUp, ChevronDown, ArrowUpDown,
} from 'lucide-react'
import { Dropdown } from '@conversation-platform/ui'

interface Tenant {
  id: string
  name: string
  slug: string
  domain: string
  userCount: number
  status: 'active' | 'suspended' | 'trial'
  created: string
}

const mockTenants: Tenant[] = [
  { id: '1', name: 'Acme Corp', slug: 'acme-corp', domain: 'acme.example.com', userCount: 45, status: 'active', created: '2024-01-15T10:30:00Z' },
  { id: '2', name: 'Globex Inc', slug: 'globex-inc', domain: 'globex.example.com', userCount: 128, status: 'active', created: '2024-02-20T14:00:00Z' },
  { id: '3', name: 'Initech', slug: 'initech', domain: 'initech.example.com', userCount: 23, status: 'trial', created: '2024-03-10T08:15:00Z' },
  { id: '4', name: 'Umbrella Co', slug: 'umbrella-co', domain: 'umbrella.example.com', userCount: 67, status: 'active', created: '2024-04-05T16:45:00Z' },
  { id: '5', name: 'Hooli', slug: 'hooli', domain: 'hooli.example.com', userCount: 12, status: 'suspended', created: '2024-05-01T09:00:00Z' },
  { id: '6', name: 'Stark Industries', slug: 'stark-industries', domain: 'stark.example.com', userCount: 89, status: 'active', created: '2024-05-15T11:20:00Z' },
  { id: '7', name: 'Wayne Enterprises', slug: 'wayne-enterprises', domain: 'wayne.example.com', userCount: 156, status: 'active', created: '2024-06-01T07:00:00Z' },
  { id: '8', name: 'Oscorp', slug: 'oscorp', domain: 'oscorp.example.com', userCount: 34, status: 'trial', created: '2024-06-20T13:30:00Z' },
]

type SortField = 'name' | 'slug' | 'userCount' | 'status' | 'created'
type SortDir = 'asc' | 'desc'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Tenant | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDomain, setFormDomain] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setTenants(mockTenants)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tenants.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.domain.toLowerCase().includes(q)
    )
  }, [tenants, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {cmp = a.name.localeCompare(b.name)}
      else if (sortField === 'slug') {cmp = a.slug.localeCompare(b.slug)}
      else if (sortField === 'userCount') {cmp = a.userCount - b.userCount}
      else if (sortField === 'status') {cmp = a.status.localeCompare(b.status)}
      else if (sortField === 'created') {cmp = new Date(a.created).getTime() - new Date(b.created).getTime()}
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {return <ArrowUpDown className="h-3 w-3 text-gray-300" />}
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const openCreate = () => {
    setEditingTenant(null)
    setFormName('')
    setFormSlug('')
    setFormDomain('')
    setDialogOpen(true)
  }

  const openEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormName(tenant.name)
    setFormSlug(tenant.slug)
    setFormDomain(tenant.domain)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim() || !formSlug.trim()) {return}
    if (editingTenant) {
      setTenants((prev) =>
        prev.map((t) =>
          t.id === editingTenant.id
            ? { ...t, name: formName.trim(), slug: formSlug.trim(), domain: formDomain.trim() }
            : t
        )
      )
    } else {
      const newTenant: Tenant = {
        id: generateId(),
        name: formName.trim(),
        slug: formSlug.trim(),
        domain: formDomain.trim(),
        userCount: 0,
        status: 'trial',
        created: new Date().toISOString(),
      }
      setTenants((prev) => [newTenant, ...prev])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deleteConfirm) {return}
    setTenants((prev) => prev.filter((t) => t.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    trial: 'warning',
    suspended: 'danger',
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load tenants" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Tenants" description="Manage platform tenants">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Tenant
        </Button>
      </PageHeader>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <Card className="p-0">
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton variant="text" width="20%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="20%" />
                  <Skeleton variant="text" width="10%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="10%" />
                </div>
              ))}
            </div>
          </Card>
        ) : sorted.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title={search ? 'No tenants match your search' : 'No tenants yet'}
              description={search ? 'Try a different search term' : 'Get started by creating your first tenant'}
              action={
                !search && (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Create Tenant
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <span className="inline-flex items-center gap-1">
                      Name <SortIcon field="name" />
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('slug')}>
                    <span className="inline-flex items-center gap-1">
                      Slug <SortIcon field="slug" />
                    </span>
                  </TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('userCount')}>
                    <span className="inline-flex items-center gap-1">
                      Users <SortIcon field="userCount" />
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <span className="inline-flex items-center gap-1">
                      Status <SortIcon field="status" />
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created')}>
                    <span className="inline-flex items-center gap-1">
                      Created <SortIcon field="created" />
                    </span>
                  </TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium text-gray-900">{tenant.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{tenant.slug}</TableCell>
                    <TableCell className="text-gray-500">{tenant.domain || '—'}</TableCell>
                    <TableCell>{tenant.userCount}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[tenant.status]}>
                        {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(tenant.created)}</TableCell>
                    <TableCell>
                      <Dropdown
                        align="end"
                        trigger={
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                        items={[
                          {
                            label: 'Edit',
                            icon: <Edit3 className="h-4 w-4" />,
                            onClick: () => openEdit(tenant),
                          },
                          {
                            label: 'Delete',
                            icon: <Trash2 className="h-4 w-4" />,
                            variant: 'danger',
                            onClick: () => setDeleteConfirm(tenant),
                          },
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingTenant ? 'Edit Tenant' : 'Create Tenant'}
        description={editingTenant ? 'Update the tenant details below.' : 'Fill in the details to create a new tenant.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || !formSlug.trim()}>
              {editingTenant ? 'Save Changes' : 'Create Tenant'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Tenant Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Acme Corp" />
          <Input label="Slug" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="e.g. acme-corp" />
          <Input label="Domain (optional)" value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="e.g. acme.example.com" />
        </div>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Tenant"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      />
    </>
  )
}
