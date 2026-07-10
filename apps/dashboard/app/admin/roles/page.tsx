'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input, Dialog, Toggle, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { generateId } from '@/lib/utils'
import {
  Shield, Plus, Edit3, Trash2,
} from 'lucide-react'

interface Permission {
  id: string
  key: string
  label: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  isSystem: boolean
  userCount: number
  permissions: string[]
  created: string
}

const permissionDefs: Permission[] = [
  { id: 'p1', key: 'tenants:read', label: 'View Tenants', category: 'Tenants' },
  { id: 'p2', key: 'tenants:create', label: 'Create Tenants', category: 'Tenants' },
  { id: 'p3', key: 'tenants:update', label: 'Edit Tenants', category: 'Tenants' },
  { id: 'p4', key: 'tenants:delete', label: 'Delete Tenants', category: 'Tenants' },
  { id: 'p5', key: 'users:read', label: 'View Users', category: 'Users' },
  { id: 'p6', key: 'users:create', label: 'Create Users', category: 'Users' },
  { id: 'p7', key: 'users:update', label: 'Edit Users', category: 'Users' },
  { id: 'p8', key: 'users:delete', label: 'Delete Users', category: 'Users' },
  { id: 'p9', key: 'roles:read', label: 'View Roles', category: 'Roles' },
  { id: 'p10', key: 'roles:create', label: 'Create Roles', category: 'Roles' },
  { id: 'p11', key: 'roles:update', label: 'Edit Roles', category: 'Roles' },
  { id: 'p12', key: 'roles:delete', label: 'Delete Roles', category: 'Roles' },
  { id: 'p13', key: 'settings:read', label: 'View Settings', category: 'Settings' },
  { id: 'p14', key: 'settings:update', label: 'Edit Settings', category: 'Settings' },
  { id: 'p15', key: 'analytics:read', label: 'View Analytics', category: 'Analytics' },
  { id: 'p16', key: 'audit:read', label: 'View Audit Logs', category: 'Audit' },
  { id: 'p17', key: 'billing:read', label: 'View Billing', category: 'Billing' },
  { id: 'p18', key: 'billing:manage', label: 'Manage Billing', category: 'Billing' },
  { id: 'p19', key: 'conversations:read', label: 'View Conversations', category: 'Conversations' },
  { id: 'p20', key: 'conversations:manage', label: 'Manage Conversations', category: 'Conversations' },
]

const categories = Array.from(new Set(permissionDefs.map((p) => p.category)))

const mockRoles: Role[] = [
  {
    id: 'sys-super-admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    userCount: 2,
    permissions: permissionDefs.map((p) => p.key),
    created: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-admin',
    name: 'Admin',
    description: 'Administrative access to manage platform',
    isSystem: true,
    userCount: 5,
    permissions: permissionDefs.filter((p) => !p.key.startsWith('billing:manage')).map((p) => p.key),
    created: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-user',
    name: 'User',
    description: 'Standard user with basic access',
    isSystem: true,
    userCount: 120,
    permissions: permissionDefs.filter((p) => ['conversations:read', 'conversations:manage', 'settings:read'].includes(p.key)).map((p) => p.key),
    created: '2024-01-01T00:00:00Z',
  },
  {
    id: 'r1',
    name: 'Billing Admin',
    description: 'Can manage billing and view analytics',
    isSystem: false,
    userCount: 3,
    permissions: ['billing:read', 'billing:manage', 'analytics:read', 'settings:read'],
    created: '2024-03-15T10:00:00Z',
  },
  {
    id: 'r2',
    name: 'Support Agent',
    description: 'Can view and manage conversations',
    isSystem: false,
    userCount: 8,
    permissions: ['conversations:read', 'conversations:manage', 'users:read'],
    created: '2024-04-20T14:30:00Z',
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPermissions, setFormPermissions] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoles(mockRoles)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const togglePermission = (key: string) => {
    setFormPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const openCreate = () => {
    setEditingRole(null)
    setFormName('')
    setFormDescription('')
    setFormPermissions([])
    setDialogOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditingRole(role)
    setFormName(role.name)
    setFormDescription(role.description)
    setFormPermissions([...role.permissions])
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim()) {return}
    if (editingRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? { ...r, name: formName.trim(), description: formDescription.trim(), permissions: formPermissions }
            : r
        )
      )
    } else {
      const newRole: Role = {
        id: generateId(),
        name: formName.trim(),
        description: formDescription.trim(),
        isSystem: false,
        userCount: 0,
        permissions: formPermissions,
        created: new Date().toISOString(),
      }
      setRoles((prev) => [newRole, ...prev])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deleteConfirm) {return}
    setRoles((prev) => prev.filter((r) => r.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  const rolePermissions = (permissions: string[]) => {
    const total = permissionDefs.length
    const granted = permissions.length
    const pct = total ? Math.round((granted / total) * 100) : 0
    return `${granted}/${total} (${pct}%)`
  }

  const groupedPermissions = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      permissions: permissionDefs.filter((p) => p.category === cat),
    }))
  }, [])

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load roles" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Roles" description="Manage roles and permissions">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-0">
                <CardContent className="p-6 space-y-4">
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="rectangular" height={100} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : roles.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<Shield className="h-12 w-12" />}
              title="No roles defined"
              description="Create roles to manage user permissions across the platform"
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Create Role
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="p-0 flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base truncate">{role.name}</CardTitle>
                        {role.isSystem && (
                          <Badge variant="info">System</Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm mt-1">{role.description}</CardDescription>
                    </div>
                    {!role.isSystem && (
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(role)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {role.userCount} user{role.userCount !== 1 ? 's' : ''} · {rolePermissions(role.permissions)}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const catPerms = permissionDefs.filter((p) => p.category === cat)
                      const granted = catPerms.filter((p) => role.permissions.includes(p.key)).length
                      const total = catPerms.length
                      if (granted === 0) {return null}
                      return (
                        <div key={cat} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{cat}</span>
                          <span className="text-xs text-gray-400">{granted}/{total}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingRole ? 'Edit Role' : 'Create Role'}
        description={editingRole ? 'Update the role name, description, and permissions.' : 'Define a new role with specific permissions.'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Role Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Custom Role" />
          <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe this role..." />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Permissions</p>
            <div className="space-y-4">
              {groupedPermissions.map(({ category, permissions: perms }) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</p>
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <Toggle
                        key={perm.id}
                        label={perm.label}
                        checked={formPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Role"
        description={
          deleteConfirm?.isSystem
            ? `"${deleteConfirm.name}" is a system role and cannot be deleted.`
            : `Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`
        }
        size="sm"
        footer={
          deleteConfirm?.isSystem ? (
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </>
          )
        }
      />
    </>
  )
}
