'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Dialog, Select, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate, generateId } from '@/lib/utils'
import {
  Users, Search, Plus, Edit3, Trash2, MoreHorizontal,
  ChevronUp, ChevronDown, ArrowUpDown,
} from 'lucide-react'
import { Dropdown } from '@conversation-platform/ui'

interface AppUser {
  id: string
  name: string
  email: string
  role: string
  tenant: string
  status: 'active' | 'inactive' | 'invited'
  lastLogin: string | null
  created: string
}

const mockUsers: AppUser[] = [
  { id: '1', name: 'John Doe', email: 'john@acme.com', role: 'tenant_admin', tenant: 'Acme Corp', status: 'active', lastLogin: '2024-07-05T14:30:00Z', created: '2024-01-15T10:30:00Z' },
  { id: '2', name: 'Jane Smith', email: 'jane@globex.com', role: 'user', tenant: 'Globex Inc', status: 'active', lastLogin: '2024-07-06T09:15:00Z', created: '2024-02-20T14:00:00Z' },
  { id: '3', name: 'Bob Wilson', email: 'bob@initech.com', role: 'user', tenant: 'Initech', status: 'inactive', lastLogin: '2024-06-01T11:00:00Z', created: '2024-03-10T08:15:00Z' },
  { id: '4', name: 'Alice Brown', email: 'alice@umbrella.com', role: 'admin', tenant: 'Umbrella Co', status: 'active', lastLogin: '2024-07-06T16:45:00Z', created: '2024-04-05T16:45:00Z' },
  { id: '5', name: 'Charlie Davis', email: 'charlie@hooli.com', role: 'user', tenant: 'Hooli', status: 'invited', lastLogin: null, created: '2024-05-01T09:00:00Z' },
  { id: '6', name: 'Diana Evans', email: 'diana@stark.com', role: 'tenant_admin', tenant: 'Stark Industries', status: 'active', lastLogin: '2024-07-06T08:00:00Z', created: '2024-05-15T11:20:00Z' },
  { id: '7', name: 'Frank Garcia', email: 'frank@wayne.com', role: 'user', tenant: 'Wayne Enterprises', status: 'active', lastLogin: '2024-07-05T17:30:00Z', created: '2024-06-01T07:00:00Z' },
  { id: '8', name: 'Grace Harris', email: 'grace@oscorp.com', role: 'user', tenant: 'Oscorp', status: 'inactive', lastLogin: '2024-06-15T10:00:00Z', created: '2024-06-20T13:30:00Z' },
  { id: '9', name: 'Henry Irving', email: 'henry@acme.com', role: 'user', tenant: 'Acme Corp', status: 'active', lastLogin: '2024-07-04T12:45:00Z', created: '2024-07-01T09:00:00Z' },
]

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'tenant_admin', label: 'Tenant Admin' },
  { value: 'user', label: 'User' },
]

const tenantOptions = [
  { value: '', label: 'All Tenants' },
  { value: 'Acme Corp', label: 'Acme Corp' },
  { value: 'Globex Inc', label: 'Globex Inc' },
  { value: 'Initech', label: 'Initech' },
  { value: 'Umbrella Co', label: 'Umbrella Co' },
  { value: 'Hooli', label: 'Hooli' },
  { value: 'Stark Industries', label: 'Stark Industries' },
  { value: 'Wayne Enterprises', label: 'Wayne Enterprises' },
  { value: 'Oscorp', label: 'Oscorp' },
]

type SortField = 'name' | 'email' | 'role' | 'tenant' | 'status' | 'lastLogin' | 'created'
type SortDir = 'asc' | 'desc'

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AppUser | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState('user')
  const [formTenant, setFormTenant] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setUsers(mockUsers)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.tenant.toLowerCase().includes(q)
      const matchesRole = !roleFilter || u.role === roleFilter
      const matchesTenant = !tenantFilter || u.tenant === tenantFilter
      return matchesSearch && matchesRole && matchesTenant
    })
  }, [users, search, roleFilter, tenantFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') { cmp = a.name.localeCompare(b.name) }
      else if (sortField === 'email') { cmp = a.email.localeCompare(b.email) }
      else if (sortField === 'role') { cmp = a.role.localeCompare(b.role) }
      else if (sortField === 'tenant') { cmp = a.tenant.localeCompare(b.tenant) }
      else if (sortField === 'status') { cmp = a.status.localeCompare(b.status) }
      else if (sortField === 'lastLogin') {
        if (!a.lastLogin && !b.lastLogin) { cmp = 0 }
        else if (!a.lastLogin) { cmp = -1 }
        else if (!b.lastLogin) { cmp = 1 }
        else { cmp = new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime() }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')) }
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) { return <ArrowUpDown className="h-3 w-3 text-gray-300" /> }
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormName(''); setFormEmail(''); setFormRole('user'); setFormTenant('')
    setDialogOpen(true)
  }

  const openEdit = (user: AppUser) => {
    setEditingUser(user)
    setFormName(user.name); setFormEmail(user.email); setFormRole(user.role); setFormTenant(user.tenant)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) { return }
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: formName.trim(), email: formEmail.trim(), role: formRole, tenant: formTenant }
            : u
        )
      )
    } else {
      const newUser: AppUser = {
        id: generateId(),
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        tenant: formTenant,
        status: 'invited',
        lastLogin: null,
        created: new Date().toISOString(),
      }
      setUsers((prev) => [newUser, ...prev])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deleteConfirm) { return }
    setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  const roleBadge: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
    super_admin: 'danger',
    admin: 'info',
    tenant_admin: 'warning',
    user: 'default',
  }

  const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    invited: 'warning',
    inactive: 'danger',
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load users" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Users" description="Manage platform users">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </PageHeader>

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={tenantOptions}
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="w-44"
          />
        </div>

        {loading ? (
          <Card className="p-0">
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton variant="text" width="18%" />
                  <Skeleton variant="text" width="22%" />
                  <Skeleton variant="text" width="12%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="10%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="8%" />
                </div>
              ))}
            </div>
          </Card>
        ) : sorted.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title={search || roleFilter || tenantFilter ? 'No users match your filters' : 'No users yet'}
              description={search || roleFilter || tenantFilter ? 'Try adjusting your search or filters' : 'Get started by adding your first user'}
              action={
                !search && !roleFilter && !tenantFilter && (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add User
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
                    <span className="inline-flex items-center gap-1">Name <SortIcon field="name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('email')}>
                    <span className="inline-flex items-center gap-1">Email <SortIcon field="email" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('role')}>
                    <span className="inline-flex items-center gap-1">Role <SortIcon field="role" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('tenant')}>
                    <span className="inline-flex items-center gap-1">Tenant <SortIcon field="tenant" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <span className="inline-flex items-center gap-1">Status <SortIcon field="status" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('lastLogin')}>
                    <span className="inline-flex items-center gap-1">Last Login <SortIcon field="lastLogin" /></span>
                  </TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadge[user.role] || 'default'}>
                        {user.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{user.tenant}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[user.status]}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {user.lastLogin ? formatDate(user.lastLogin) : '—'}
                    </TableCell>
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
                            onClick: () => openEdit(user),
                          },
                          {
                            label: 'Delete',
                            icon: <Trash2 className="h-4 w-4" />,
                            variant: 'danger',
                            onClick: () => setDeleteConfirm(user),
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
        title={editingUser ? 'Edit User' : 'Create User'}
        description={editingUser ? 'Update the user details below.' : 'Fill in the details to create a new user.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || !formEmail.trim()}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. John Doe" />
          <Input label="Email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g. john@example.com" />
          <Select
            label="Role"
            options={[
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'admin', label: 'Admin' },
              { value: 'tenant_admin', label: 'Tenant Admin' },
              { value: 'user', label: 'User' },
            ]}
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
          />
          <Select
            label="Tenant"
            options={[
              { value: 'Acme Corp', label: 'Acme Corp' },
              { value: 'Globex Inc', label: 'Globex Inc' },
              { value: 'Initech', label: 'Initech' },
              { value: 'Umbrella Co', label: 'Umbrella Co' },
              { value: 'Hooli', label: 'Hooli' },
              { value: 'Stark Industries', label: 'Stark Industries' },
              { value: 'Wayne Enterprises', label: 'Wayne Enterprises' },
              { value: 'Oscorp', label: 'Oscorp' },
            ]}
            value={formTenant}
            onChange={(e) => setFormTenant(e.target.value)}
            placeholder="Select tenant"
          />
        </div>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
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
